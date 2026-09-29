import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { strToU8, Zip, ZipDeflate, ZipPassThrough } from "fflate";

import {
  createOfflineBackupManifest,
  FOCUS_COMMAND_BACKUP_EXTENSION,
  MAX_BACKUP_BYTES,
  MAX_BACKUP_MEDIA_FILES,
  OfflineBackupMediaManifest,
  OfflineBackupValidationError,
  ParsedOfflineBackupPreview,
  remapHistoricMilestonePortraitUris,
  streamOfflineBackupArchive,
} from "@/lib/offline-backup-format";
import { SOUND_ROLE_IDS, type FocusState, type SoundRoleId } from "@/lib/focus-command";
import type { CharacterCinematicVariant } from "@/lib/character-development";

const BACKUP_CACHE_DIRECTORY = new Directory(Paths.cache, "focus-command-backups");
const CINEMATIC_DIRECTORY = new Directory(Paths.document, "focus-command-cinematics");
const SOUND_DIRECTORY = new Directory(Paths.document, "focus-command-sounds");
const PORTRAIT_DIRECTORY = new Directory(Paths.document, "focus-command-portraits");

const CINEMATIC_PREFIX = "media/cinematics/";
const SOUND_PREFIX = "media/sounds/";
const CINEMATIC_MUSIC_PREFIX = "media/cinematic-music/";
const FORM_PREFIX = "media/forms/";
const LAUNCH_PREFIX = "media/launch/";
const BACKUP_WRITE_CHUNK_BYTES = 512 * 1024;

export interface OfflineBackupPreview {
  archiveUri: string;
  fileName: string;
  backup: ParsedOfflineBackupPreview;
}

export interface OfflineRestoreMaterialization {
  state: FocusState;
  createdUris: string[];
}

function safeFileName(name: string, fallback: string): string {
  const normalized = name.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function fileExtension(name: string, fallback: string): string {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  return /^[a-z0-9]{2,5}$/.test(extension) ? extension : fallback;
}

function timestampFileStem() {
  return new Date().toISOString().replace(/[:.]/g, "-").replace("T", "-").replace("Z", "");
}

interface OfflineBackupMediaSource {
  uri: string;
  path: string;
  bytes: number;
  sha256: string;
}

async function yieldToRuntime(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

async function inspectLocalMedia(uri: string, archivePath: string): Promise<OfflineBackupMediaSource> {
  const file = new File(uri);
  if (!file.exists || !file.size) {
    throw new OfflineBackupValidationError(`The local media file for ${archivePath} is unavailable. Reassign it before creating a backup.`);
  }
  const size = file.size;
  const hasher = sha256.create();
  const handle = file.open();
  try {
    let bytesRead = 0;
    while (bytesRead < size) {
      const chunk = handle.readBytes(Math.min(BACKUP_WRITE_CHUNK_BYTES, size - bytesRead));
      if (!chunk.length) throw new OfflineBackupValidationError(`The local media file for ${archivePath} could not be read completely.`);
      hasher.update(chunk);
      bytesRead += chunk.length;
      await yieldToRuntime();
    }
  } finally {
    handle.close();
  }
  return { uri, path: archivePath, bytes: size, sha256: bytesToHex(hasher.digest()) };
}

export async function collectOfflineBackupMediaSources(state: FocusState): Promise<OfflineBackupMediaSource[]> {
  const media: OfflineBackupMediaSource[] = [];
  for (const [variant, override] of Object.entries(state.profile.localCinematicOverrides)) {
    if (!override?.uri) continue;
    const extension = fileExtension(override.name, "mp4");
    media.push(await inspectLocalMedia(override.uri, `${CINEMATIC_PREFIX}${variant}.${extension}`));
  }
  for (const role of SOUND_ROLE_IDS) {
    const setting = state.profile.soundRoles[role];
    if (!setting?.customUri) continue;
    const extension = fileExtension(setting.customName ?? "", "mp3");
    media.push(await inspectLocalMedia(setting.customUri, `${SOUND_PREFIX}${role}.${extension}`));
  }
  for (const [variant, pair] of Object.entries(state.profile.localCinematicMusicOverrides)) {
    for (const slot of ["duringVideo", "postVideo"] as const) {
      const override = pair?.[slot];
      if (!override?.uri) continue;
      const extension = fileExtension(override.name, "mp3");
      media.push(await inspectLocalMedia(override.uri, `${CINEMATIC_MUSIC_PREFIX}${variant}-${slot}.${extension}`));
    }
  }
  for (const form of state.profile.customCharacterForms) {
    const formPrefix = `${FORM_PREFIX}${safeFileName(form.id, "form")}/`;
    if (form.portrait?.uri) media.push(await inspectLocalMedia(form.portrait.uri, `${formPrefix}portrait.${fileExtension(form.portrait.name, "png")}`));
    if (form.video?.uri) media.push(await inspectLocalMedia(form.video.uri, `${formPrefix}video.${fileExtension(form.video.name, "mp4")}`));
    for (const slot of ["duringVideo", "postVideo"] as const) {
      const override = form.music[slot];
      if (override?.uri) media.push(await inspectLocalMedia(override.uri, `${formPrefix}${slot}.${fileExtension(override.name, "mp3")}`));
    }
  }
  if (state.profile.launchAnimation.visual?.uri) {
    const visual = state.profile.launchAnimation.visual;
    media.push(await inspectLocalMedia(visual.uri, `${LAUNCH_PREFIX}visual.${fileExtension(visual.name, "gif")}`));
  }
  if (state.profile.launchAnimation.audio?.uri) {
    const audio = state.profile.launchAnimation.audio;
    media.push(await inspectLocalMedia(audio.uri, `${LAUNCH_PREFIX}audio.${fileExtension(audio.name, "mp3")}`));
  }
  if (media.length > MAX_BACKUP_MEDIA_FILES || new Set(media.map((item) => item.path)).size !== media.length) {
    throw new OfflineBackupValidationError("The custom media list is too large or contains conflicting file names.");
  }
  return media;
}

export async function createAndShareOfflineBackup(state: FocusState): Promise<{ uri: string; fileName: string }> {
  const media = await collectOfflineBackupMediaSources(state);
  const { hydrated: _hydrated, ...persistable } = state;
  const stateBytes = strToU8(JSON.stringify(persistable));
  const estimatedBytes = stateBytes.length + media.reduce((total, item) => total + item.bytes, 0) + 1024 * 1024;
  if (estimatedBytes > MAX_BACKUP_BYTES) {
    throw new OfflineBackupValidationError("This backup is too large to create safely on this device.");
  }
  if (Paths.availableDiskSpace > 0 && estimatedBytes * 1.15 > Paths.availableDiskSpace) {
    throw new OfflineBackupValidationError("This device does not have enough free space to create the complete backup.");
  }
  const manifest = createOfflineBackupManifest(
    state,
    stateBytes,
    media.map(({ path, bytes, sha256: checksum }) => ({ path, bytes, sha256: checksum })),
  );
  BACKUP_CACHE_DIRECTORY.create({ idempotent: true, intermediates: true });
  const fileName = `FocusCommand-backup-${timestampFileStem()}.${FOCUS_COMMAND_BACKUP_EXTENSION}`;
  const destination = new File(BACKUP_CACHE_DIRECTORY, fileName);
  if (destination.exists) destination.delete();
  destination.create({ intermediates: true });
  const output = destination.open();
  let archiveError: Error | null = null;
  let resolveArchiveFinished!: () => void;
  let rejectArchiveFinished!: (error: Error) => void;
  const archiveFinished = new Promise<void>((resolve, reject) => {
    resolveArchiveFinished = resolve;
    rejectArchiveFinished = reject;
  });
  const archive = new Zip((error, chunk, final) => {
    if (error) {
      archiveError = error;
      rejectArchiveFinished(error);
      return;
    }
    if (chunk.length) output.writeBytes(chunk);
    if (final) resolveArchiveFinished();
  });
  let creationFailure: unknown = null;
  try {
    const manifestEntry = new ZipDeflate("manifest.json", { level: 1 });
    archive.add(manifestEntry);
    manifestEntry.push(strToU8(JSON.stringify(manifest)), true);

    const stateEntry = new ZipDeflate("state/focus-command.json", { level: 1 });
    archive.add(stateEntry);
    stateEntry.push(stateBytes, true);

    for (const source of media) {
      const entry = new ZipPassThrough(source.path);
      archive.add(entry);
      const input = new File(source.uri).open();
      try {
        let bytesRead = 0;
        const hasher = sha256.create();
        while (bytesRead < source.bytes) {
          const chunk = input.readBytes(Math.min(BACKUP_WRITE_CHUNK_BYTES, source.bytes - bytesRead));
          if (!chunk.length) throw new OfflineBackupValidationError(`The local media file for ${source.path} changed during backup creation.`);
          bytesRead += chunk.length;
          hasher.update(chunk);
          entry.push(chunk, bytesRead === source.bytes);
          await yieldToRuntime();
        }
        if (bytesToHex(hasher.digest()) !== source.sha256) {
          throw new OfflineBackupValidationError(`The local media file for ${source.path} changed during backup creation. Please try again.`);
        }
      } finally {
        input.close();
      }
    }
    archive.end();
    await archiveFinished;
  } catch (error) {
    creationFailure = error;
    archive.terminate();
  } finally {
    output.close();
  }
  if (creationFailure || archiveError) {
    if (destination.exists) destination.delete();
    if (creationFailure instanceof OfflineBackupValidationError) throw creationFailure;
    throw new OfflineBackupValidationError("Focus Command could not finish the backup archive.");
  }
  if (!destination.exists || !destination.size || destination.size > MAX_BACKUP_BYTES) {
    if (destination.exists) destination.delete();
    throw new OfflineBackupValidationError("Focus Command could not write a complete backup file on this device.");
  }
  if (!(await Sharing.isAvailableAsync())) {
    throw new OfflineBackupValidationError("This device cannot open a save/share sheet for the backup file.");
  }
  await Sharing.shareAsync(destination.uri, {
    mimeType: "application/vnd.focuscommand.backup",
    dialogTitle: "Save Focus Command backup",
    UTI: "public.zip-archive",
  });
  return { uri: destination.uri, fileName };
}

export async function chooseAndValidateOfflineBackup(): Promise<OfflineBackupPreview | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/vnd.focuscommand.backup", "application/zip", "application/octet-stream", "*/*"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const file = new File(asset.uri);
  if (!file.exists || !file.size) {
    throw new OfflineBackupValidationError("The selected backup file is no longer available. Please choose it again.");
  }
  const backup = await streamOfflineBackupArchive(file.size, (onChunk) => readFileChunks(file, onChunk));
  return { archiveUri: asset.uri, fileName: asset.name || "Focus Command backup", backup };
}

const BACKUP_READ_CHUNK_BYTES = 256 * 1024;

async function readFileChunks(file: File, onChunk: (chunk: Uint8Array, isFinal: boolean) => void): Promise<void> {
  const size = file.size;
  if (!size) throw new OfflineBackupValidationError("The selected backup file is no longer available. Please choose it again.");
  const handle = file.open();
  try {
    let bytesRead = 0;
    while (bytesRead < size) {
      const chunk = handle.readBytes(Math.min(BACKUP_READ_CHUNK_BYTES, size - bytesRead));
      if (!chunk.length) throw new OfflineBackupValidationError("The backup file is damaged or incomplete.");
      bytesRead += chunk.length;
      onChunk(chunk, bytesRead === size);
    }
  } finally {
    handle.close();
  }
}

function mediaEntryForPrefix(backup: ParsedOfflineBackupPreview, prefix: string, key: string) {
  const matches = backup.manifest.media.filter((file) => file.path.startsWith(`${prefix}${key}.`));
  if (matches.length > 1) throw new OfflineBackupValidationError("The backup contains conflicting media files.");
  return matches[0] ?? null;
}

function createRestoredMediaFile(directory: Directory, name: string): File {
  directory.create({ idempotent: true, intermediates: true });
  const file = new File(directory, name);
  if (file.exists) file.delete();
  file.create({ intermediates: true });
  return file;
}

interface RestoreTarget {
  directory: Directory;
  name: string;
  apply: (uri: string) => void;
}

/**
 * Copies media files before state replacement. On error, all newly copied files are
 * removed and the existing application state remains untouched.
 */
export async function materializeOfflineBackupMedia(backup: ParsedOfflineBackupPreview, archiveUri: string): Promise<OfflineRestoreMaterialization> {
  let state = JSON.parse(JSON.stringify(backup.state)) as FocusState;
  const createdUris: string[] = [];
  const restoredPortraitUris = new Map<string, string>();
  const restoreStamp = timestampFileStem();
  const targets = new Map<string, RestoreTarget>();
  const writtenMedia = new Map<string, File>();
  const registerTarget = (entry: OfflineBackupMediaManifest | null, directory: Directory, name: string, apply: (uri: string) => void) => {
    if (!entry) return false;
    targets.set(entry.path, { directory, name, apply });
    return true;
  };
  try {
    for (const [variant, override] of Object.entries(state.profile.localCinematicOverrides)) {
      const entry = mediaEntryForPrefix(backup, CINEMATIC_PREFIX, variant);
      const historicUri = override?.uri;
      if (!override || !registerTarget(entry, CINEMATIC_DIRECTORY, `backup-${restoreStamp}-${safeFileName(variant, "cinematic")}.${fileExtension(entry?.path ?? "", "mp4")}`, (uri) => {
        state.profile.localCinematicOverrides[variant as CharacterCinematicVariant] = { uri, name: override.name };
        if (historicUri) restoredPortraitUris.set(historicUri, uri);
      })) {
        delete state.profile.localCinematicOverrides[variant as CharacterCinematicVariant];
      }
    }
    for (const role of SOUND_ROLE_IDS) {
      const setting = state.profile.soundRoles[role];
      const entry = setting?.customUri ? mediaEntryForPrefix(backup, SOUND_PREFIX, role) : null;
      if (!setting || !registerTarget(entry, SOUND_DIRECTORY, `backup-${restoreStamp}-${safeFileName(role, "sound")}.${fileExtension(entry?.path ?? "", "mp3")}`, (uri) => {
        state.profile.soundRoles[role as SoundRoleId] = { ...setting, customUri: uri };
      })) {
        if (setting) state.profile.soundRoles[role as SoundRoleId] = { ...setting, customUri: null, customName: null };
      }
    }
    for (const [variant, pair] of Object.entries(state.profile.localCinematicMusicOverrides)) {
      if (!pair) continue;
      const restoredPair = state.profile.localCinematicMusicOverrides[variant as CharacterCinematicVariant];
      if (!restoredPair) continue;
      const duringEntry = pair.duringVideo?.uri ? mediaEntryForPrefix(backup, CINEMATIC_MUSIC_PREFIX, `${variant}-duringVideo`) : null;
      const postEntry = pair.postVideo?.uri ? mediaEntryForPrefix(backup, CINEMATIC_MUSIC_PREFIX, `${variant}-postVideo`) : null;
      if (pair.duringVideo && !registerTarget(duringEntry, SOUND_DIRECTORY, `backup-${restoreStamp}-${safeFileName(`${variant}-during`, "music")}.${fileExtension(duringEntry?.path ?? "", "mp3")}`, (uri) => {
        restoredPair.duringVideo = { ...pair.duringVideo!, uri };
      })) pair.duringVideo = null;
      if (pair.postVideo && !registerTarget(postEntry, SOUND_DIRECTORY, `backup-${restoreStamp}-${safeFileName(`${variant}-post`, "music")}.${fileExtension(postEntry?.path ?? "", "mp3")}`, (uri) => {
        restoredPair.postVideo = { ...pair.postVideo!, uri };
      })) pair.postVideo = null;
    }
    state.profile.customCharacterForms = state.profile.customCharacterForms.map((form) => {
      const prefix = `${FORM_PREFIX}${safeFileName(form.id, "form")}/`;
      const historicPortraitUri = form.portrait?.uri;
      const restored = { ...form, portrait: form.portrait, video: form.video, music: { ...form.music } };
      const registerFormTarget = <T extends { uri: string; name: string }>(key: "portrait" | "video" | "duringVideo" | "postVideo", original: T | null, directory: Directory, fallbackExtension: string, set: (value: T | null) => void) => {
        if (!original?.uri) return;
        const entry = mediaEntryForPrefix(backup, prefix, key);
        if (!registerTarget(entry, directory, `backup-${restoreStamp}-${safeFileName(`${form.id}-${key}`, "form")}.${fileExtension(entry?.path ?? "", fallbackExtension)}`, (uri) => {
          const value = { ...original, uri };
          set(value);
          if (key === "portrait" && historicPortraitUri) restoredPortraitUris.set(historicPortraitUri, uri);
        })) set(null);
      };
      registerFormTarget("portrait", form.portrait, PORTRAIT_DIRECTORY, "png", (value) => { restored.portrait = value; });
      registerFormTarget("video", form.video, CINEMATIC_DIRECTORY, "mp4", (value) => { restored.video = value; });
      registerFormTarget("duringVideo", form.music.duringVideo, SOUND_DIRECTORY, "mp3", (value) => { restored.music.duringVideo = value; });
      registerFormTarget("postVideo", form.music.postVideo, SOUND_DIRECTORY, "mp3", (value) => { restored.music.postVideo = value; });
      return restored;
    });
    const launchVisual = state.profile.launchAnimation.visual;
    const launchAudio = state.profile.launchAnimation.audio;
    if (launchVisual && !registerTarget(mediaEntryForPrefix(backup, LAUNCH_PREFIX, "visual"), CINEMATIC_DIRECTORY, `backup-${restoreStamp}-launch.${fileExtension(mediaEntryForPrefix(backup, LAUNCH_PREFIX, "visual")?.path ?? "", "gif")}`, (uri) => {
      state.profile.launchAnimation.visual = { ...launchVisual, uri };
    })) state.profile.launchAnimation.visual = null;
    if (launchAudio && !registerTarget(mediaEntryForPrefix(backup, LAUNCH_PREFIX, "audio"), SOUND_DIRECTORY, `backup-${restoreStamp}-launch.${fileExtension(mediaEntryForPrefix(backup, LAUNCH_PREFIX, "audio")?.path ?? "", "mp3")}`, (uri) => {
      state.profile.launchAnimation.audio = { ...launchAudio, uri };
    })) state.profile.launchAnimation.audio = null;

    if (targets.size !== backup.manifest.media.length) {
      throw new OfflineBackupValidationError("The backup contains media that is not linked to its saved app data.");
    }

    const archive = new File(archiveUri);
    await streamOfflineBackupArchive(archive.size ?? 0, (onChunk) => readFileChunks(archive, onChunk), (media, chunk, final) => {
      const target = targets.get(media.path);
      if (!target) return;
      let file = writtenMedia.get(media.path);
      if (!file) {
        file = createRestoredMediaFile(target.directory, target.name);
        writtenMedia.set(media.path, file);
        createdUris.push(file.uri);
      }
      if (chunk.length) {
        const handle = file.open();
        try {
          handle.offset = file.size ?? 0;
          handle.writeBytes(chunk);
        } finally {
          handle.close();
        }
      }
      if (final) {
        writtenMedia.delete(media.path);
        if (!file.exists || file.size !== media.bytes) {
          if (file.exists) file.delete();
          throw new OfflineBackupValidationError("Focus Command could not restore one of the backup media files.");
        }
        target.apply(file.uri);
      }
    });
    state = remapHistoricMilestonePortraitUris(state, restoredPortraitUris);
    return { state, createdUris };
  } catch (error) {
    for (const uri of createdUris) {
      const file = new File(uri);
      if (file.exists) file.delete();
    }
    throw error;
  }
}

export function discardMaterializedOfflineBackup(materialized: OfflineRestoreMaterialization): void {
  for (const uri of materialized.createdUris) {
    const file = new File(uri);
    if (file.exists) file.delete();
  }
}
