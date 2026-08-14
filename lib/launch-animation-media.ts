import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { createAudioPlayer } from "expo-audio";

import type { LocalCinematicAudioOverride, LocalCinematicOverride } from "@/lib/focus-command";
import { assertLaunchAudioDuration } from "@/lib/launch-animation-validation";

const ANIMATED_VISUAL_TYPES = ["image/gif", "image/webp"];
const AUDIO_TYPES = ["audio/*", "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/aac"];

function safeExtension(name: string, fallback: string, mimeType?: string | null) {
  const candidate = name.split(".").pop()?.toLowerCase();
  if (candidate && /^[a-z0-9]{2,5}$/.test(candidate)) return candidate;
  if (mimeType?.includes("gif")) return "gif";
  if (mimeType?.includes("webp")) return "webp";
  if (mimeType?.includes("wav")) return "wav";
  if (mimeType?.includes("mp4") || mimeType?.includes("aac")) return "m4a";
  return fallback;
}

function launchDirectory() {
  const documentsDirectory = FileSystem.documentDirectory;
  if (!documentsDirectory) throw new Error("The device did not provide a persistent documents directory.");
  return `${documentsDirectory}focus-command-launch-animation/`;
}

async function persistSelectedFile(asset: DocumentPicker.DocumentPickerAsset, kind: "visual" | "audio", fallbackExtension: string): Promise<LocalCinematicOverride> {
  const sourceInfo = await FileSystem.getInfoAsync(asset.uri);
  if (!sourceInfo.exists || !sourceInfo.size) throw new Error("The selected file is no longer available. Please choose it again.");
  const targetDirectory = launchDirectory();
  await FileSystem.makeDirectoryAsync(targetDirectory, { intermediates: true });
  const extension = safeExtension(asset.name, fallbackExtension, asset.mimeType);
  const targetUri = `${targetDirectory}launch-${kind}-${Date.now()}.${extension}`;
  try {
    await FileSystem.copyAsync({ from: asset.uri, to: targetUri });
    const copiedInfo = await FileSystem.getInfoAsync(targetUri);
    if (!copiedInfo.exists || !copiedInfo.size) throw new Error("The selected file could not be copied into Focus Command.");
    return { uri: targetUri, name: asset.name || `launch-${kind}.${extension}` };
  } catch (error) {
    const copiedInfo = await FileSystem.getInfoAsync(targetUri);
    if (copiedInfo.exists) await FileSystem.deleteAsync(targetUri, { idempotent: true });
    throw error;
  }
}

async function readAudioDurationSeconds(uri: string): Promise<number> {
  const player = createAudioPlayer(uri);
  try {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const duration = Number(player.duration);
      if (Number.isFinite(duration) && duration > 0) return duration;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error("The selected launch audio duration could not be read. Please choose another file.");
  } finally {
    try {
      player.remove();
    } catch {
      // A failed validation player must never leave a partially saved setting.
    }
  }
}

export async function pickAndPersistLaunchAnimationVisual(): Promise<LocalCinematicOverride | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ANIMATED_VISUAL_TYPES, copyToCacheDirectory: true, multiple: false });
  if (result.canceled || !result.assets?.[0]) return null;
  return persistSelectedFile(result.assets[0], "visual", "gif");
}

export async function pickAndPersistLaunchAnimationAudio(): Promise<LocalCinematicAudioOverride | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: AUDIO_TYPES, copyToCacheDirectory: true, multiple: false });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const durationSeconds = await readAudioDurationSeconds(asset.uri);
  assertLaunchAudioDuration(durationSeconds);
  const persisted = await persistSelectedFile(asset, "audio", "mp3");
  return { ...persisted, durationSeconds };
}

export async function removePersistedLaunchAnimationMedia(uri: string): Promise<void> {
  const documentsDirectory = FileSystem.documentDirectory;
  if (!documentsDirectory || !uri.startsWith(`${documentsDirectory}focus-command-launch-animation/`)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Resetting custom launch media must always leave the bundled fire fallback available.
  }
}
