import { describe, expect, it } from "vitest";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

import { createInitialState, type FocusState } from "../lib/focus-command";
import {
  createOfflineBackupArchive,
  hashBackupBytes,
  OfflineBackupValidationError,
  parseOfflineBackupArchive,
} from "../lib/offline-backup-format";

function createPopulatedState(): FocusState {
  const state = createInitialState();
  state.hydrated = true;
  state.missions = [{ id: "mission_backup", title: "Archive mission" } as FocusState["missions"][number]];
  state.missionCompletions = [{ id: "completion_backup", missionId: "mission_backup", completedAt: "2026-08-14T08:00:00.000Z" } as FocusState["missionCompletions"][number]];
  state.reflections = [{ id: "reflection_backup", missionId: "mission_backup", completionId: "completion_backup", rating: 4.5 } as unknown as FocusState["reflections"][number]];
  state.journals = [{ id: "journal_backup", title: "A complete command log", body: "Long-form local journal data remains in the archive." } as unknown as FocusState["journals"][number]];
  state.distractionLogs = [{ id: "friction_backup", missionId: "mission_backup", occurredAt: "2026-08-14T07:30:00.000Z", category: "phone" } as unknown as FocusState["distractionLogs"][number]];
  state.progression = [{ id: "xp_backup", sourceCompletionId: "completion_backup", amount: 80 } as unknown as FocusState["progression"][number]];
  return state;
}

function mutateArchive(archive: Uint8Array, mutate: (entries: Record<string, Uint8Array>) => void): Uint8Array {
  const entries = unzipSync(archive);
  mutate(entries);
  return zipSync(entries, { level: 6 });
}

function readManifest(entries: Record<string, Uint8Array>) {
  return JSON.parse(strFromU8(entries["manifest.json"])) as Record<string, unknown>;
}

function writeManifest(entries: Record<string, Uint8Array>, manifest: Record<string, unknown>) {
  entries["manifest.json"] = strToU8(JSON.stringify(manifest));
}

describe("offline Focus Command backup format", () => {
  it("round-trips a complete local command snapshot and included media without changing data", () => {
    const state = createPopulatedState();
    const cinematic = strToU8("portable-cinematic-bytes");
    const sound = strToU8("portable-sound-bytes");
    const { archive, manifest } = createOfflineBackupArchive(state, [
      { path: "media/cinematics/recruit.mp4", bytes: cinematic },
      { path: "media/sounds/missionWin.mp3", bytes: sound },
    ], "2026-08-14T08:10:00.000Z");

    const parsed = parseOfflineBackupArchive(archive);

    expect(parsed.manifest).toEqual(manifest);
    expect(parsed.state).toEqual({ ...state, hydrated: false });
    expect(parsed.manifest.summary).toEqual({ missions: 1, completions: 1, reflections: 1, journals: 1, mediaFiles: 2 });
    expect(parsed.media).toEqual([
      { path: "media/cinematics/recruit.mp4", bytes: cinematic },
      { path: "media/sounds/missionWin.mp3", bytes: sound },
    ]);
  });

  it("rejects a damaged state payload before any restore can begin", () => {
    const { archive } = createOfflineBackupArchive(createPopulatedState());
    const damaged = mutateArchive(archive, (entries) => {
      entries["state.json"][0] ^= 0xff;
    });

    expect(() => parseOfflineBackupArchive(damaged)).toThrow(/integrity check/i);
  });

  it("rejects media whose checksum no longer matches the validated manifest", () => {
    const { archive } = createOfflineBackupArchive(createPopulatedState(), [{ path: "media/sounds/system.mp3", bytes: strToU8("original-sound") }]);
    const damaged = mutateArchive(archive, (entries) => {
      entries["media/sounds/system.mp3"][0] ^= 0xff;
    });

    expect(() => parseOfflineBackupArchive(damaged)).toThrow(/media file .* integrity check/i);
  });

  it("rejects unexpected archive content even if all expected data remains valid", () => {
    const { archive } = createOfflineBackupArchive(createPopulatedState());
    const expanded = mutateArchive(archive, (entries) => {
      entries["unexpected.txt"] = strToU8("not part of a Focus Command backup");
    });

    expect(() => parseOfflineBackupArchive(expanded)).toThrow(/unexpected files/i);
  });

  it("rejects a future-state backup rather than partially importing it", () => {
    const { archive } = createOfflineBackupArchive(createPopulatedState());
    const future = mutateArchive(archive, (entries) => {
      const state = JSON.parse(strFromU8(entries["state.json"])) as Record<string, unknown>;
      state.schemaVersion = 99_999;
      entries["state.json"] = strToU8(JSON.stringify(state));
      const manifest = readManifest(entries);
      manifest.stateSha256 = hashBackupBytes(entries["state.json"]);
      writeManifest(entries, manifest);
    });

    expect(() => parseOfflineBackupArchive(future)).toThrow(/newer version/i);
  });

  it("rejects a manifest whose displayed record counts do not match its state", () => {
    const { archive } = createOfflineBackupArchive(createPopulatedState());
    const mislabelled = mutateArchive(archive, (entries) => {
      const manifest = readManifest(entries);
      manifest.summary = { missions: 999, completions: 0, reflections: 0, journals: 0, mediaFiles: 0 };
      writeManifest(entries, manifest);
    });

    expect(() => parseOfflineBackupArchive(mislabelled)).toThrow(/summary does not match/i);
  });

  it("refuses unsafe media paths and duplicate archive media at creation time", () => {
    const state = createPopulatedState();

    expect(() => createOfflineBackupArchive(state, [{ path: "../private-data.mp4", bytes: strToU8("x") }])).toThrow(OfflineBackupValidationError);
    expect(() => createOfflineBackupArchive(state, [
      { path: "media/cinematics/recruit.mp4", bytes: strToU8("a") },
      { path: "media/cinematics/recruit.mp4", bytes: strToU8("b") },
    ])).toThrow(/duplicate/i);
  });
});
