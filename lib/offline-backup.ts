import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import {
  createOfflineBackupArchive,
  FOCUS_COMMAND_BACKUP_EXTENSION,
  OfflineBackupMediaFile,
  OfflineBackupValidationError,
  parseOfflineBackupArchive,
  ParsedOfflineBackup,
  remapHistoricMilestonePortraitUris,
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
  backup: ParsedOfflineBackup;
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
  const backup = parseOfflineBackupArchive(await file.bytes());
  return { archiveUri: asset.uri, fileName: asset.name || "Focus Command backup", backup };
}

function mediaEntryForPrefix(backup: ParsedOfflineBackup, prefix: string, key: string) {
  return backup.media.find((file) => file.path.startsWith(`${prefix}${key}.`)) ?? null;
}

function restoreMediaOverride<T extends { uri: string; name: string }>(backup: ParsedOfflineBackup, prefix: string, key: string, original: T | null | undefined, directory: Directory, restoreStamp: string, fallbackExtension: string, createdUris: string[]): T | null {
  const entry = original?.uri ? mediaEntryForPrefix(backup, prefix, key) : null;
  if (!original || !entry) return null;
  const extension = fileExtension(entry.path, fallbackExtension);
  const file = createRestoredMediaFile(directory, `backup-${restoreStamp}-${safeFileName(key, "media")}.${extension}`, entry.bytes);
  createdUris.push(file.uri);
  return { ...original, uri: file.uri };
}

function createRestoredMediaFile(directory: Directory, name: string, bytes: Uint8Array): File {
  directory.create({ idempotent: true, intermediates: true });
  const file = new File(directory, name);
  if (file.exists) file.delete();
  file.create({ intermediates: true });
  file.write(bytes);
  if (!file.exists || file.size !== bytes.length) {
    if (file.exists) file.delete();
    throw new OfflineBackupValidationError("Focus Command could not restore one of the backup media files.");
  }
  return file;
}

/**
 * Copies media files before state replacement. On error, all newly copied files are
 * removed and the existing application state remains untouched.
 */
export function materializeOfflineBackupMedia(backup: ParsedOfflineBackup): OfflineRestoreMaterialization {
  let state = JSON.parse(JSON.stringify(backup.state)) as FocusState;
  const createdUris: string[] = [];
  const restoredPortraitUris = new Map<string, string>();
  const restoreStamp = timestampFileStem();
  try {
    for (const [variant, override] of Object.entries(state.profile.localCinematicOverrides)) {
      const entry = mediaEntryForPrefix(backup, CINEMATIC_PREFIX, variant);
      if (!override || !entry) {
        delete state.profile.localCinematicOverrides[variant as CharacterCinematicVariant];
        continue;
      }
      const extension = fileExtension(entry.path, "mp4");
      const file = createRestoredMediaFile(CINEMATIC_DIRECTORY, `backup-${restoreStamp}-${safeFileName(variant, "cinematic")}.${extension}`, entry.bytes);
      createdUris.push(file.uri);
      state.profile.localCinematicOverrides[variant as CharacterCinematicVariant] = { uri: file.uri, name: override.name };
    }
    for (const role of SOUND_ROLE_IDS) {
      const setting = state.profile.soundRoles[role];
      const entry = setting?.customUri ? mediaEntryForPrefix(backup, SOUND_PREFIX, role) : null;
      if (!setting || !entry) {
        if (setting) state.profile.soundRoles[role as SoundRoleId] = { ...setting, customUri: null, customName: null };
        continue;
      }
      const extension = fileExtension(entry.path, "mp3");
      const file = createRestoredMediaFile(SOUND_DIRECTORY, `backup-${restoreStamp}-${safeFileName(role, "sound")}.${extension}`, entry.bytes);
      createdUris.push(file.uri);
      state.profile.soundRoles[role as SoundRoleId] = { ...setting, customUri: file.uri };
    }
    for (const [variant, pair] of Object.entries(state.profile.localCinematicMusicOverrides)) {
      if (!pair) continue;
      const duringVideo = restoreMediaOverride(backup, CINEMATIC_MUSIC_PREFIX, `${variant}-duringVideo`, pair.duringVideo, SOUND_DIRECTORY, restoreStamp, "mp3", createdUris);
      const postVideo = restoreMediaOverride(backup, CINEMATIC_MUSIC_PREFIX, `${variant}-postVideo`, pair.postVideo, SOUND_DIRECTORY, restoreStamp, "mp3", createdUris);
      state.profile.localCinematicMusicOverrides[variant as CharacterCinematicVariant] = { duringVideo, postVideo };
    }
    state.profile.customCharacterForms = state.profile.customCharacterForms.map((form) => {
      const prefix = `${FORM_PREFIX}${safeFileName(form.id, "form")}/`;
      const historicPortraitUri = form.portrait?.uri;
      const portrait = restoreMediaOverride(backup, prefix, "portrait", form.portrait, PORTRAIT_DIRECTORY, restoreStamp, "png", createdUris);
      const video = restoreMediaOverride(backup, prefix, "video", form.video, CINEMATIC_DIRECTORY, restoreStamp, "mp4", createdUris);
      const duringVideo = restoreMediaOverride(backup, prefix, "duringVideo", form.music.duringVideo, SOUND_DIRECTORY, restoreStamp, "mp3", createdUris);
      const postVideo = restoreMediaOverride(backup, prefix, "postVideo", form.music.postVideo, SOUND_DIRECTORY, restoreStamp, "mp3", createdUris);
      if (historicPortraitUri && portrait?.uri) restoredPortraitUris.set(historicPortraitUri, portrait.uri);
      return { ...form, portrait, video, music: { duringVideo, postVideo } };
    });
    state = remapHistoricMilestonePortraitUris(state, restoredPortraitUris);
    state.profile.launchAnimation.visual = restoreMediaOverride(backup, LAUNCH_PREFIX, "visual", state.profile.launchAnimation.visual, CINEMATIC_DIRECTORY, restoreStamp, "gif", createdUris);
    state.profile.launchAnimation.audio = restoreMediaOverride(backup, LAUNCH_PREFIX, "audio", state.profile.launchAnimation.audio, SOUND_DIRECTORY, restoreStamp, "mp3", createdUris);
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
