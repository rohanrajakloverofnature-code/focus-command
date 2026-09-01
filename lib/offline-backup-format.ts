import { bytesToHex } from "@noble/hashes/utils.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { strFromU8, strToU8, Unzip, UnzipInflate, UnzipPassThrough, unzipSync, zipSync } from "fflate";

import type { FocusState } from "@/lib/focus-command";

export const FOCUS_COMMAND_BACKUP_EXTENSION = "fcbak";
export const FOCUS_COMMAND_BACKUP_FORMAT = "focus-command-offline-backup";
export const FOCUS_COMMAND_BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 250 * 1024 * 1024;
// Existing cinematic/video and sound overrides can now be accompanied by two
// tracks for eight forms plus four files for each custom form.
export const MAX_BACKUP_MEDIA_FILES = 256;

const MANIFEST_PATH = "manifest.json";
const STATE_PATH = "state.json";
const SAFE_ARCHIVE_PATH = /^[a-zA-Z0-9][a-zA-Z0-9_./-]{0,180}$/;

export interface OfflineBackupMediaFile {
  path: string;
  bytes: Uint8Array;
}

export interface OfflineBackupMediaManifest {
  path: string;
  bytes: number;
  sha256: string;
}

export interface OfflineBackupSummary {
  missions: number;
  completions: number;
  reflections: number;
  journals: number;
  mediaFiles: number;
}

export interface OfflineBackupManifest {
  format: typeof FOCUS_COMMAND_BACKUP_FORMAT;
  backupVersion: typeof FOCUS_COMMAND_BACKUP_VERSION;
  createdAt: string;
  statePath: typeof STATE_PATH;
  stateSha256: string;
  appSchemaVersion: number;
  summary: OfflineBackupSummary;
  media: OfflineBackupMediaManifest[];
}

export interface ParsedOfflineBackup {
  manifest: OfflineBackupManifest;
  state: FocusState;
  media: OfflineBackupMediaFile[];
}

/**
 * The small, durable portion of a validated archive needed for the existing
 * preview and restore confirmation. Large media remains in the selected file
 * until the user confirms the restore.
 */
export interface ParsedOfflineBackupPreview {
  manifest: OfflineBackupManifest;
  state: FocusState;
}

export type OfflineBackupChunkReader = (
  onChunk: (chunk: Uint8Array, isFinal: boolean) => void,
) => Promise<void>;

export type OfflineBackupMediaChunkHandler = (
  media: OfflineBackupMediaManifest,
  chunk: Uint8Array,
  isFinal: boolean,
) => void;

export class OfflineBackupValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OfflineBackupValidationError";
  }
}

export function hashBackupBytes(bytes: Uint8Array): string {
  return bytesToHex(sha256(bytes));
}

function cloneBackupState(state: FocusState): FocusState {
  return { ...state, hydrated: false };
}

/**
 * Restored local portrait files receive new device URIs. Keep an immutable
 * achievement node connected to its captured portrait when that source file
 * has been recreated from the same validated offline archive.
 */
export function remapHistoricMilestonePortraitUris(state: FocusState, restoredPortraitUris: ReadonlyMap<string, string>): FocusState {
  if (!restoredPortraitUris.size || !state.characterMilestones.length) return state;
  let changed = false;
  const characterMilestones = state.characterMilestones.map((milestone) => {
    const restoredPortraitUri = milestone.portraitUri ? restoredPortraitUris.get(milestone.portraitUri) : null;
    if (!restoredPortraitUri) return milestone;
    changed = true;
    return { ...milestone, portraitUri: restoredPortraitUri };
  });
  return changed ? { ...state, characterMilestones } : state;
}

function buildSummary(state: FocusState, mediaFiles: number): OfflineBackupSummary {
  return {
    missions: state.missions.length,
    completions: state.missionCompletions.length,
    reflections: state.reflections.length,
    journals: state.journals.length,
    mediaFiles,
  };
}

function requireSafePath(path: string): void {
  if (!SAFE_ARCHIVE_PATH.test(path) || path.includes("..") || path === MANIFEST_PATH || path === STATE_PATH) {
    throw new OfflineBackupValidationError("The backup contains an unsafe file path.");
  }
}

function assertStateShape(value: unknown): asserts value is FocusState {
  if (!value || typeof value !== "object") {
    throw new OfflineBackupValidationError("The backup does not contain a valid Focus Command state.");
  }
  const state = value as Partial<FocusState>;
  const requiredCollections: Array<keyof FocusState> = [
    "missions", "missionCompletions", "reflections", "srsTopics", "bosses", "journals",
    "distractionLogs", "rewards", "transactions", "inventory", "progression", "characterMilestones", "lifeline",
    "customQuestions", "customGraphs", "allEquipment", "userEquipment",
  ];
  if (!state.profile || typeof state.profile !== "object" || !state.combo || typeof state.combo !== "object") {
    throw new OfflineBackupValidationError("The backup profile or combo configuration is missing.");
  }
  if (!Number.isFinite(Number(state.schemaVersion))) {
    throw new OfflineBackupValidationError("The backup schema version is invalid.");
  }
  for (const key of requiredCollections) {
    if (!Array.isArray(state[key])) {
      throw new OfflineBackupValidationError(`The backup ${String(key)} collection is invalid.`);
    }
  }
}

function parseManifest(bytes: Uint8Array): OfflineBackupManifest {
  try {
    const manifest = JSON.parse(strFromU8(bytes)) as OfflineBackupManifest;
    if (
      manifest.format !== FOCUS_COMMAND_BACKUP_FORMAT ||
      manifest.backupVersion !== FOCUS_COMMAND_BACKUP_VERSION ||
      manifest.statePath !== STATE_PATH ||
      !Array.isArray(manifest.media) ||
      !manifest.summary ||
      !Number.isFinite(Date.parse(manifest.createdAt))
    ) {
      throw new Error("shape");
    }
    return manifest;
  } catch {
    throw new OfflineBackupValidationError("This file is not a compatible Focus Command backup.");
  }
}

function parseBackupState(bytes: Uint8Array): FocusState {
  try {
    const parsedState = JSON.parse(strFromU8(bytes)) as Partial<FocusState>;
    // Revision activity history was introduced after the initial offline-backup format.
    // Preserve all valid older backups by treating the missing append-only ledger as empty;
    // no past activity is reconstructed or invented during restore.
    if (!Array.isArray(parsedState.srsActivityLog)) parsedState.srsActivityLog = [];
    // Character milestones were introduced after the initial offline-backup format.
    // A missing collection is hydrated as empty and then safely reconstructed from
    // immutable progression data by the central compatibility layer.
    if (!Array.isArray(parsedState.characterMilestones)) parsedState.characterMilestones = [];
    // Shadow Gate was introduced after the initial offline-backup format. Older
    // valid files receive no invented Gate history or personal doorway text.
    if (!Array.isArray(parsedState.shadowGateEntries)) parsedState.shadowGateEntries = [];
    if (!Array.isArray(parsedState.shadowGatePersonalDoorways)) parsedState.shadowGatePersonalDoorways = [];
    // Mistake Ledger and Personal Graphs are independent optional local records.
    // Older valid archives receive empty collections; no personal history or
    // graph point is inferred during restore.
    if (!Array.isArray(parsedState.mistakeLedgerEntries)) parsedState.mistakeLedgerEntries = [];
    if (!Array.isArray(parsedState.mistakeLedgerActivityLog)) parsedState.mistakeLedgerActivityLog = [];
    if (!Array.isArray(parsedState.personalGraphs)) parsedState.personalGraphs = [];
    const state = parsedState as FocusState;
    assertStateShape(state);
    return state;
  } catch (error) {
    if (error instanceof OfflineBackupValidationError) throw error;
    throw new OfflineBackupValidationError("The backup command data cannot be read.");
  }
}

function validateManifestAgainstState(manifest: OfflineBackupManifest, state: FocusState, mediaFiles: number): void {
  if (state.schemaVersion > manifest.appSchemaVersion) {
    throw new OfflineBackupValidationError("This backup requires a newer version of Focus Command.");
  }
  if (manifest.media.length > MAX_BACKUP_MEDIA_FILES) {
    throw new OfflineBackupValidationError("The backup contains too many media files.");
  }
  const expectedSummary = buildSummary(state, mediaFiles);
  if (JSON.stringify(expectedSummary) !== JSON.stringify(manifest.summary)) {
    throw new OfflineBackupValidationError("The backup record summary does not match its data.");
  }
}

/**
 * Validates an archive incrementally. The state and manifest remain small
 * in-memory values; each media item is checksum-verified as it streams and
 * can be materialized directly to device storage by the caller.
 */
export async function streamOfflineBackupArchive(
  archiveBytes: number,
  readChunks: OfflineBackupChunkReader,
  onMediaChunk?: OfflineBackupMediaChunkHandler,
): Promise<ParsedOfflineBackupPreview> {
  if (!Number.isFinite(archiveBytes) || archiveBytes <= 0 || archiveBytes > MAX_BACKUP_BYTES) {
    throw new OfflineBackupValidationError("The selected backup file is empty or exceeds the safe size limit.");
  }

  let manifest: OfflineBackupManifest | null = null;
  let stateBytes: Uint8Array | null = null;
  let failure: OfflineBackupValidationError | null = null;
  const seenPaths = new Set<string>();
  const completedMedia = new Set<string>();
  const stateChunks: Uint8Array[] = [];
  let stateLength = 0;
  let expectedMediaByPath: Map<string, OfflineBackupMediaManifest> | null = null;

  const reject = (message: string) => {
    failure ??= new OfflineBackupValidationError(message);
    return failure;
  };
  const appendStateChunk = (chunk: Uint8Array) => {
    stateLength += chunk.length;
    if (stateLength > MAX_BACKUP_BYTES) throw reject("The backup command data is too large to restore safely.");
    stateChunks.push(chunk);
  };
  const combinedStateBytes = () => {
    const bytes = new Uint8Array(stateLength);
    let offset = 0;
    for (const chunk of stateChunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return bytes;
  };

  const unzip = new Unzip((file) => {
    if (failure) {
      file.terminate();
      return;
    }
    const path = file.name;
    if (seenPaths.has(path)) {
      reject("The backup contains duplicate files.");
      file.terminate();
      return;
    }
    seenPaths.add(path);
    if (path !== MANIFEST_PATH && path !== STATE_PATH) {
      try {
        requireSafePath(path);
      } catch (error) {
        failure = error instanceof OfflineBackupValidationError ? error : reject("The backup contains an unsafe file path.");
        file.terminate();
        return;
      }
      if (!manifest || !expectedMediaByPath?.has(path)) {
        reject("The backup contains unexpected files.");
        file.terminate();
        return;
      }
    }
    if (path === MANIFEST_PATH || path === STATE_PATH) {
      const chunks: Uint8Array[] = [];
      let length = 0;
      file.ondata = (error, chunk, final) => {
        if (error) throw reject("The backup file is damaged or incomplete.");
        if (chunk.length) {
          length += chunk.length;
          if (length > MAX_BACKUP_BYTES) throw reject("The backup metadata is too large to restore safely.");
          chunks.push(chunk);
        }
        if (!final) return;
        const bytes = new Uint8Array(length);
        let offset = 0;
        for (const part of chunks) {
          bytes.set(part, offset);
          offset += part.length;
        }
        if (path === MANIFEST_PATH) {
          manifest = parseManifest(bytes);
          expectedMediaByPath = new Map(manifest.media.map((item) => [item.path, item]));
          if (expectedMediaByPath.size !== manifest.media.length) throw reject("The backup media list contains an invalid or duplicate file.");
        } else {
          appendStateChunk(bytes);
          stateBytes = combinedStateBytes();
        }
      };
      file.start();
      return;
    }
    const media = expectedMediaByPath?.get(path);
    if (!media) {
      reject("The backup contains unexpected files.");
      file.terminate();
      return;
    }
    let bytesRead = 0;
    const hasher = sha256.create();
    file.ondata = (error, chunk, final) => {
      if (error) throw reject("The backup file is damaged or incomplete.");
      if (chunk.length) {
        bytesRead += chunk.length;
        if (bytesRead > media.bytes) throw reject(`The backup media file ${media.path} did not pass its integrity check.`);
        hasher.update(chunk);
        onMediaChunk?.(media, chunk, false);
      }
      if (!final) return;
      if (bytesRead !== media.bytes || bytesToHex(hasher.digest()) !== media.sha256) {
        throw reject(`The backup media file ${media.path} did not pass its integrity check.`);
      }
      completedMedia.add(media.path);
      onMediaChunk?.(media, new Uint8Array(), true);
    };
    file.start();
  });
  unzip.register(UnzipPassThrough);
  unzip.register(UnzipInflate);

  try {
    await readChunks((chunk, isFinal) => {
      if (failure) throw failure;
      unzip.push(chunk, isFinal);
      if (failure) throw failure;
    });
  } catch (error) {
    if (error instanceof OfflineBackupValidationError) throw error;
    throw new OfflineBackupValidationError("The backup file is damaged or incomplete.");
  }
  if (failure) throw failure;
  const parsedManifest = manifest as OfflineBackupManifest | null;
  if (!parsedManifest || !stateBytes) {
    throw new OfflineBackupValidationError("The backup is missing its manifest or command data.");
  }
  if (hashBackupBytes(stateBytes) !== parsedManifest.stateSha256) {
    throw new OfflineBackupValidationError("The backup command data did not pass its integrity check.");
  }
  if (completedMedia.size !== parsedManifest.media.length || parsedManifest.media.some((file) => !completedMedia.has(file.path))) {
    throw new OfflineBackupValidationError("The backup is missing one or more media files.");
  }
  const state = parseBackupState(stateBytes);
  validateManifestAgainstState(parsedManifest, state, completedMedia.size);
  return { manifest: parsedManifest, state };
}

export function createOfflineBackupArchive(
  state: FocusState,
  media: OfflineBackupMediaFile[] = [],
  createdAt = new Date().toISOString(),
): { archive: Uint8Array; manifest: OfflineBackupManifest } {
  if (media.length > MAX_BACKUP_MEDIA_FILES) {
    throw new OfflineBackupValidationError("This device has too many custom media files to place safely in one backup.");
  }
  const fileMap: Record<string, Uint8Array> = {};
  const stateBytes = strToU8(JSON.stringify(cloneBackupState(state)));
  const seenPaths = new Set<string>();
  const mediaManifest = media.map((file) => {
    requireSafePath(file.path);
    if (!file.bytes.length || seenPaths.has(file.path)) {
      throw new OfflineBackupValidationError("The backup media list contains an invalid or duplicate file.");
    }
    seenPaths.add(file.path);
    fileMap[file.path] = file.bytes;
    return { path: file.path, bytes: file.bytes.length, sha256: hashBackupBytes(file.bytes) };
  });
  const manifest: OfflineBackupManifest = {
    format: FOCUS_COMMAND_BACKUP_FORMAT,
    backupVersion: FOCUS_COMMAND_BACKUP_VERSION,
    createdAt,
    statePath: STATE_PATH,
    stateSha256: hashBackupBytes(stateBytes),
    appSchemaVersion: state.schemaVersion,
    summary: buildSummary(state, mediaManifest.length),
    media: mediaManifest,
  };
  const archive = zipSync({
    [MANIFEST_PATH]: strToU8(JSON.stringify(manifest)),
    [STATE_PATH]: stateBytes,
    ...fileMap,
  }, { level: 6 });
  if (archive.length > MAX_BACKUP_BYTES) {
    throw new OfflineBackupValidationError("This backup is too large to create safely on this device.");
  }
  return { archive, manifest };
}

export function parseOfflineBackupArchive(archive: Uint8Array): ParsedOfflineBackup {
  if (!archive.length || archive.length > MAX_BACKUP_BYTES) {
    throw new OfflineBackupValidationError("The selected backup file is empty or exceeds the safe size limit.");
  }
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(archive);
  } catch {
    throw new OfflineBackupValidationError("The backup file is damaged or incomplete.");
  }
  const manifestBytes = entries[MANIFEST_PATH];
  const stateBytes = entries[STATE_PATH];
  if (!manifestBytes || !stateBytes) {
    throw new OfflineBackupValidationError("The backup is missing its manifest or command data.");
  }
  const manifest = parseManifest(manifestBytes);
  if (hashBackupBytes(stateBytes) !== manifest.stateSha256) {
    throw new OfflineBackupValidationError("The backup command data did not pass its integrity check.");
  }
  let state: FocusState;
  try {
    const parsedState = JSON.parse(strFromU8(stateBytes)) as Partial<FocusState>;
    // Revision activity history was introduced after the initial offline-backup format.
    // Preserve all valid older backups by treating the missing append-only ledger as empty;
    // no past activity is reconstructed or invented during restore.
    if (!Array.isArray(parsedState.srsActivityLog)) parsedState.srsActivityLog = [];
    // Character milestones were introduced after the initial offline-backup format.
    // A missing collection is hydrated as empty and then safely reconstructed from
    // immutable progression data by the central compatibility layer.
    if (!Array.isArray(parsedState.characterMilestones)) parsedState.characterMilestones = [];
    // Shadow Gate records and locally-written doorways are optional in older
    // backup files. Treat an absent collection as empty rather than rejecting
    // a valid backup or creating any historical data.
    if (!Array.isArray(parsedState.shadowGateEntries)) parsedState.shadowGateEntries = [];
    if (!Array.isArray(parsedState.shadowGatePersonalDoorways)) parsedState.shadowGatePersonalDoorways = [];
    // Mistake Ledger records are optional in older valid backups. Missing
    // collections begin empty; historic mistakes and status events are never inferred.
    if (!Array.isArray(parsedState.mistakeLedgerEntries)) parsedState.mistakeLedgerEntries = [];
    if (!Array.isArray(parsedState.mistakeLedgerActivityLog)) parsedState.mistakeLedgerActivityLog = [];
    if (!Array.isArray(parsedState.personalGraphs)) parsedState.personalGraphs = [];
    state = parsedState as FocusState;
  } catch {
    throw new OfflineBackupValidationError("The backup command data cannot be read.");
  }
  assertStateShape(state);
  if (state.schemaVersion > manifest.appSchemaVersion) {
    throw new OfflineBackupValidationError("This backup requires a newer version of Focus Command.");
  }
  if (manifest.media.length > MAX_BACKUP_MEDIA_FILES) {
    throw new OfflineBackupValidationError("The backup contains too many media files.");
  }
  const allowedPaths = new Set([MANIFEST_PATH, STATE_PATH, ...manifest.media.map((file) => file.path)]);
  if (Object.keys(entries).some((path) => !allowedPaths.has(path))) {
    throw new OfflineBackupValidationError("The backup contains unexpected files.");
  }
  const media = manifest.media.map((file) => {
    requireSafePath(file.path);
    const bytes = entries[file.path];
    if (!bytes || bytes.length !== file.bytes || hashBackupBytes(bytes) !== file.sha256) {
      throw new OfflineBackupValidationError(`The backup media file ${file.path} did not pass its integrity check.`);
    }
    return { path: file.path, bytes };
  });
  const expectedSummary = buildSummary(state, media.length);
  if (JSON.stringify(expectedSummary) !== JSON.stringify(manifest.summary)) {
    throw new OfflineBackupValidationError("The backup record summary does not match its data.");
  }
  return { manifest, state, media };
}
