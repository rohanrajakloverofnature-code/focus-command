import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";

import type { CharacterCinematicVariant } from "@/lib/character-development";

const VIDEO_TYPES = ["video/*", "video/mp4", "video/quicktime", "video/x-m4v"];

function safeExtension(name: string, mimeType?: string | null) {
  const candidate = name.split(".").pop()?.toLowerCase();
  if (candidate && /^[a-z0-9]{2,5}$/.test(candidate)) return candidate;
  if (mimeType?.includes("quicktime")) return "mov";
  if (mimeType?.includes("m4v")) return "m4v";
  return "mp4";
}

export interface SelectedCinematicVideo {
  uri: string;
  name: string;
}

export async function removePersistedCinematicVideo(uri: string): Promise<void> {
  const documentsDirectory = FileSystem.documentDirectory;
  if (!documentsDirectory || !uri.startsWith(`${documentsDirectory}focus-command-cinematics/`)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Removing a local video must never stop the bundled default cinematic from playing.
  }
}

export async function pickAndPersistCinematicVideo(variant: CharacterCinematicVariant): Promise<SelectedCinematicVideo | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: VIDEO_TYPES,
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const documentsDirectory = FileSystem.documentDirectory;
  if (!documentsDirectory) throw new Error("The device did not provide a persistent documents directory.");

  const targetDirectory = `${documentsDirectory}focus-command-cinematics/`;
  await FileSystem.makeDirectoryAsync(targetDirectory, { intermediates: true });
  const sourceInfo = await FileSystem.getInfoAsync(asset.uri);
  if (!sourceInfo.exists) throw new Error("The selected video file is no longer available. Please choose it again.");

  const extension = safeExtension(asset.name, asset.mimeType);
  const targetUri = `${targetDirectory}${variant}-${Date.now()}.${extension}`;
  try {
    await FileSystem.copyAsync({ from: asset.uri, to: targetUri });
    const copiedInfo = await FileSystem.getInfoAsync(targetUri);
    if (!copiedInfo.exists || !copiedInfo.size) throw new Error("The selected video could not be copied into Focus Command.");
    return { uri: targetUri, name: asset.name || `${variant}.${extension}` };
  } catch (error) {
    const copiedInfo = await FileSystem.getInfoAsync(targetUri);
    if (copiedInfo.exists) await FileSystem.deleteAsync(targetUri, { idempotent: true });
    throw error;
  }
}
