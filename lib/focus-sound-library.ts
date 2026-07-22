import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";

import type { SoundRoleId } from "@/lib/focus-command";

const AUDIO_TYPES = ["audio/*", "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/aac"];

function safeExtension(name: string, mimeType?: string | null) {
  const candidate = name.split(".").pop()?.toLowerCase();
  if (candidate && /^[a-z0-9]{2,5}$/.test(candidate)) return candidate;
  if (mimeType?.includes("wav")) return "wav";
  if (mimeType?.includes("mp4") || mimeType?.includes("aac")) return "m4a";
  return "mp3";
}

export interface SelectedSoundFile {
  uri: string;
  name: string;
}

export async function removePersistedFocusSound(uri: string): Promise<void> {
  const documentsDirectory = FileSystem.documentDirectory;
  if (!documentsDirectory || !uri.startsWith(`${documentsDirectory}focus-command-sounds/`)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Removing a local file must never block returning to the bundled cue.
  }
}

export async function pickAndPersistFocusSound(role: SoundRoleId): Promise<SelectedSoundFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: AUDIO_TYPES,
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const documentsDirectory = FileSystem.documentDirectory;
  if (!documentsDirectory) throw new Error("The device did not provide a persistent documents directory.");

  const targetDirectory = `${documentsDirectory}focus-command-sounds/`;
  await FileSystem.makeDirectoryAsync(targetDirectory, { intermediates: true });
  const sourceInfo = await FileSystem.getInfoAsync(asset.uri);
  if (!sourceInfo.exists) throw new Error("The selected audio file is no longer available. Please choose it again.");

  const extension = safeExtension(asset.name, asset.mimeType);
  const targetUri = `${targetDirectory}${role}-${Date.now()}.${extension}`;
  try {
    await FileSystem.copyAsync({ from: asset.uri, to: targetUri });
    const copiedInfo = await FileSystem.getInfoAsync(targetUri);
    if (!copiedInfo.exists || !copiedInfo.size) throw new Error("The selected audio file could not be copied into Focus Command.");
    return { uri: targetUri, name: asset.name || `${role}.${extension}` };
  } catch (error) {
    const copiedInfo = await FileSystem.getInfoAsync(targetUri);
    if (copiedInfo.exists) await FileSystem.deleteAsync(targetUri, { idempotent: true });
    throw error;
  }
}
