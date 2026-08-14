import type { FocusState } from "@/lib/focus-command";
import { OfflineBackupValidationError, type ParsedOfflineBackup } from "@/lib/offline-backup-format";

const WEB_UNAVAILABLE_MESSAGE = "Offline backup files are available in the installed Focus Command app on Android or iOS.";

export interface OfflineBackupPreview {
  archiveUri: string;
  fileName: string;
  backup: ParsedOfflineBackup;
}

export interface OfflineRestoreMaterialization {
  state: FocusState;
  createdUris: string[];
}

export async function createAndShareOfflineBackup(_state: FocusState): Promise<{ uri: string; fileName: string }> {
  throw new OfflineBackupValidationError(WEB_UNAVAILABLE_MESSAGE);
}

export async function chooseAndValidateOfflineBackup(): Promise<OfflineBackupPreview | null> {
  throw new OfflineBackupValidationError(WEB_UNAVAILABLE_MESSAGE);
}

export function materializeOfflineBackupMedia(_backup: ParsedOfflineBackup): OfflineRestoreMaterialization {
  throw new OfflineBackupValidationError(WEB_UNAVAILABLE_MESSAGE);
}

export function discardMaterializedOfflineBackup(_materialized: OfflineRestoreMaterialization): void {
  // No local media can be created in the web preview.
}
