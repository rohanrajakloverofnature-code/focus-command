import { createAudioPlayer } from "expo-audio";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";

import { assertCharacterMusicDuration, type CharacterMusicSlot } from "@/lib/character-music-validation";
import type { LocalCinematicAudioOverride, LocalCinematicOverride } from "@/lib/focus-command";

const IMAGE_TYPES = ["image/png"];
const VIDEO_TYPES = ["video/*", "video/mp4", "video/quicktime", "video/x-m4v"];
const AUDIO_TYPES = ["audio/*", "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/aac"];

export { assertCharacterMusicDuration, type CharacterMusicSlot } from "@/lib/character-music-validation";

function safeExtension(name: string, mimeType?: string | null, fallback = "bin") {
  const candidate = name.split(".").pop()?.toLowerCase();
  if (candidate && /^[a-z0-9]{2,5}$/.test(candidate)) return candidate;
  if (mimeType?.includes("png")) return "png";
  if (mimeType?.includes("quicktime")) return "mov";
  if (mimeType?.includes("m4v")) return "m4v";
  if (mimeType?.includes("wav")) return "wav";
  if (mimeType?.includes("mp4") || mimeType?.includes("aac")) return "m4a";
  return fallback;
}

function cleanKey(value: string) {
  return value.replace(/[^a-z0-9_-]/gi, "_").slice(0, 64) || "form";
}

function mediaDirectory(kind: "portraits" | "cinematics" | "sounds") {
  const documentsDirectory = FileSystem.documentDirectory;
  if (!documentsDirectory) throw new Error("The device did not provide a persistent documents directory.");
  return `${documentsDirectory}focus-command-${kind}/`;
}

async function pickAndPersistMedia({
  type,
  kind,
  storageKey,
  fallbackExtension,
}: {
  type: string[];
  kind: "portraits" | "cinematics" | "sounds";
  storageKey: string;
  fallbackExtension: string;
}): Promise<LocalCinematicOverride | null> {
  const result = await DocumentPicker.getDocumentAsync({ type, copyToCacheDirectory: true, multiple: false });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const targetDirectory = mediaDirectory(kind);
  await FileSystem.makeDirectoryAsync(targetDirectory, { intermediates: true });
  const sourceInfo = await FileSystem.getInfoAsync(asset.uri);
  if (!sourceInfo.exists || !sourceInfo.size) throw new Error("The selected file is no longer available. Please choose it again.");

  const extension = safeExtension(asset.name, asset.mimeType, fallbackExtension);
  const targetUri = `${targetDirectory}${cleanKey(storageKey)}-${Date.now()}.${extension}`;
  try {
    await FileSystem.copyAsync({ from: asset.uri, to: targetUri });
    const copiedInfo = await FileSystem.getInfoAsync(targetUri);
    if (!copiedInfo.exists || !copiedInfo.size) throw new Error("The selected file could not be copied into Focus Command.");
    return { uri: targetUri, name: asset.name || `${cleanKey(storageKey)}.${extension}` };
  } catch (error) {
    const copiedInfo = await FileSystem.getInfoAsync(targetUri);
    if (copiedInfo.exists) await FileSystem.deleteAsync(targetUri, { idempotent: true });
    throw error;
  }
}

export async function pickAndPersistCharacterPortrait(formId: string): Promise<LocalCinematicOverride | null> {
  return pickAndPersistMedia({ type: IMAGE_TYPES, kind: "portraits", storageKey: `${formId}-portrait`, fallbackExtension: "png" });
}

export async function pickAndPersistCharacterVideo(formId: string): Promise<LocalCinematicOverride | null> {
  return pickAndPersistMedia({ type: VIDEO_TYPES, kind: "cinematics", storageKey: `${formId}-video`, fallbackExtension: "mp4" });
}

async function readAudioDurationSeconds(uri: string): Promise<number> {
  const player = createAudioPlayer(uri);
  try {
    // Native metadata may arrive just after player construction. Waiting briefly
    // avoids accepting a zero-duration stream while retaining deterministic cleanup.
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const duration = Number(player.duration);
      if (Number.isFinite(duration) && duration > 0) return duration;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error("The selected audio duration could not be read. Please choose another file.");
  } finally {
    try {
      player.remove();
    } catch {
      // Validation cleanup must never leave a selected file in a partially saved state.
    }
  }
}

export async function pickAndPersistCharacterMusic(formId: string, slot: CharacterMusicSlot): Promise<LocalCinematicAudioOverride | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: AUDIO_TYPES, copyToCacheDirectory: true, multiple: false });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const sourceInfo = await FileSystem.getInfoAsync(asset.uri);
  if (!sourceInfo.exists || !sourceInfo.size) throw new Error("The selected audio file is no longer available. Please choose it again.");
  const durationSeconds = await readAudioDurationSeconds(asset.uri);
  assertCharacterMusicDuration(slot, durationSeconds);

  const extension = safeExtension(asset.name, asset.mimeType, "mp3");
  const targetDirectory = mediaDirectory("sounds");
  await FileSystem.makeDirectoryAsync(targetDirectory, { intermediates: true });
  const targetUri = `${targetDirectory}${cleanKey(formId)}-${slot}-${Date.now()}.${extension}`;
  try {
    await FileSystem.copyAsync({ from: asset.uri, to: targetUri });
    const copiedInfo = await FileSystem.getInfoAsync(targetUri);
    if (!copiedInfo.exists || !copiedInfo.size) throw new Error("The selected audio file could not be copied into Focus Command.");
    return { uri: targetUri, name: asset.name || `${cleanKey(formId)}-${slot}.${extension}`, durationSeconds };
  } catch (error) {
    const copiedInfo = await FileSystem.getInfoAsync(targetUri);
    if (copiedInfo.exists) await FileSystem.deleteAsync(targetUri, { idempotent: true });
    throw error;
  }
}

export async function removePersistedCharacterMedia(uri: string): Promise<void> {
  const documentsDirectory = FileSystem.documentDirectory;
  if (!documentsDirectory || !uri.startsWith(`${documentsDirectory}focus-command-`)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Removing an obsolete local asset must never interrupt the remaining cinematic configuration.
  }
}
