import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import {
  createOfflineBackupArchive,
  FOCUS_COMMAND_BACKUP_EXTENSION,
  OfflineBackupMediaFile,
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

async function readLocalMedia(uri: string, archivePath: string): Promise<OfflineBackupMediaFile> {
  const file = new File(uri);
  if (!file.exists || !file.size) {
    throw new OfflineBackupValidationError(`The local media file for ${archivePath} is unavailable. Reassign it before creating a backup.`);
  }
  return { path: archivePath, bytes: await file.bytes() };
}

export async function collectOfflineBackupMedia(state: FocusState): Promise<OfflineBackupMediaFile[]> {
  const media: OfflineBackupMediaFile[] = [];
  for (const [variant, override] of Object.entries(state.profile.localCinematicOverrides)) {
    if (!override?.uri) continue;
    const extension = fileExtension(override.name, "mp4");
    media.push(await readLocalMedia(override.uri, `${CINEMATIC_PREFIX}${variant}.${extension}`));
  }
  for (const role of SOUND_ROLE_IDS) {
    const setting = state.profile.soundRoles[role];
    if (!setting?.customUri) continue;
    const extension = fileExtension(setting.customName ?? "", "mp3");
    media.push(await readLocalMedia(setting.customUri, `${SOUND_PREFIX}${role}.${extension}`));
  }
  for (const [variant, pair] of Object.entries(state.profile.localCinematicMusicOverrides)) {
    for (const slot of ["duringVideo", "postVideo"] as const) {
      const override = pair?.[slot];
      if (!override?.uri) continue;
      const extension = fileExtension(override.name, "mp3");
      media.push(await readLocalMedia(override.uri, `${CINEMATIC_MUSIC_PREFIX}${variant}-${slot}.${extension}`));
    }
  }
  for (const form of state.profile.customCharacterForms) {
    const formPrefix = `${FORM_PREFIX}${safeFileName(form.id, "form")}/`;
    if (form.portrait?.uri) media.push(await readLocalMedia(form.portrait.uri, `${formPrefix}portrait.${fileExtension(form.portrait.name, "png")}`));
    if (form.video?.uri) media.push(await readLocalMedia(form.video.uri, `${formPrefix}video.${fileExtension(form.video.name, "mp4")}`));
    for (const slot of ["duringVideo", "postVideo"] as const) {
      const override = form.music[slot];
      if (override?.uri) media.push(await readLocalMedia(override.uri, `${formPrefix}${slot}.${fileExtension(override.name, "mp3")}`));
    }
  }
  if (state.profile.launchAnimation.visual?.uri) {
    const visual = state.profile.launchAnimation.visual;
    media.push(await readLocalMedia(visual.uri, `${LAUNCH_PREFIX}visual.${fileExtension(visual.name, "gif")}`));
  }
  if (state.profile.launchAnimation.audio?.uri) {
    const audio = state.profile.launchAnimation.audio;
    media.push(await readLocalMedia(audio.uri, `${LAUNCH_PREFIX}audio.${fileExtension(audio.name, "mp3")}`));
  }
  return media;
}

export async function createAndShareOfflineBackup(state: FocusState): Promise<{ uri: string; fileName: string }> {
  const media = await collectOfflineBackupMedia(state);
  const { archive } = createOfflineBackupArchive(state, media);
  BACKUP_CACHE_DIRECTORY.create({ idempotent: true, intermediates: true });
  const fileName = `FocusCommand-backup-${timestampFileStem()}.${FOCUS_COMMAND_BACKUP_EXTENSION}`;
  const destination = new File(BACKUP_CACHE_DIRECTORY, fileName);
  if (destination.exists) destination.delete();
  destination.create({ intermediates: true });
  destination.write(archive);
  if (!destination.exists || destination.size !== archive.length) {
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
  return backup.manifest.media.find((file) => file.path.startsWith(`${prefix}${key}.`)) ?? null;
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
      if (!override || !registerTarget(entry, CINEMATIC_DIRECTORY, `backup-${restoreStamp}-${safeFileName(variant, "cinematic")}.${fileExtension(entry?.path ?? "", "mp4")}`, (uri) => {
        state.profile.localCinematicOverrides[variant as CharacterCinematicVariant] = { uri, name: override.name };
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
