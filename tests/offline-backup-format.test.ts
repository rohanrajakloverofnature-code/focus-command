import { describe, expect, it } from "vitest";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

import { createInitialState, type FocusState } from "../lib/focus-command";
import {
  createOfflineBackupArchive,
  hashBackupBytes,
  OfflineBackupValidationError,
  parseOfflineBackupArchive,
  remapHistoricMilestonePortraitUris,
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
  state.srsActivityLog = [{ id: "revision_activity_backup", topicId: "revision_backup", missionId: "mission_backup", subject: "Math", topic: "Vectors", phase: "emerging", actionDate: "2026-08-14", occurredAt: "2026-08-14T08:00:00.000Z" }];
  state.profile.characterCinematicColors = { tactical: { accent: "#16C7E8", backdrop: "#061423", rod: "#F0C75E", aura: "#16C7E833", support: "#6E5AE6", energy: "#68E2FF", metallic: "#F0C75E", atmosphere: "#071B2D", frame: "#020914" } };
  state.profile.tickerColorPreferences = { miniAchievement: { source: "character", surface: null, accent: null }, prediction: { source: "custom", surface: "#17102B", accent: "#16C7E8" } };
  state.profile.homeProfileCardColorPreference = { source: "custom", surface: "#101820", accent: "#F0C75E" };
  state.characterMilestones = [{ id: "milestone_backup", sourceProgressionEventId: "xp_backup", formKey: "custom:arcane_commander", formName: "Arcane Commander", portraitUri: "file:///portraits/arcane.png", achievedAt: "2026-08-14T08:00:00.000Z", levelAtAchievement: 600, totalPowerAtAchievement: 120_000 }];
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
    expect(parsed.state.profile.characterCinematicColors).toEqual(state.profile.characterCinematicColors);
    expect(parsed.state.profile.tickerColorPreferences).toEqual(state.profile.tickerColorPreferences);
    expect(parsed.state.profile.homeProfileCardColorPreference).toEqual(state.profile.homeProfileCardColorPreference);
    expect(parsed.state.characterMilestones).toEqual(state.characterMilestones);
  });

  it("remaps only restored custom-form portrait URIs inside historic milestone snapshots", () => {
    const state = createPopulatedState();
    const remapped = remapHistoricMilestonePortraitUris(state, new Map([["file:///portraits/arcane.png", "file:///restored/arcane.png"]]));

    expect(remapped.characterMilestones[0]).toMatchObject({
      portraitUri: "file:///restored/arcane.png",
      sourceProgressionEventId: "xp_backup",
      totalPowerAtAchievement: 120_000,
    });
    expect(state.characterMilestones[0].portraitUri).toBe("file:///portraits/arcane.png");
    expect(remapHistoricMilestonePortraitUris(state, new Map())).toBe(state);
  });

  it("restores older valid backup files without a revision activity ledger as an empty ledger", () => {
    const { archive } = createOfflineBackupArchive(createPopulatedState());
    const legacy = mutateArchive(archive, (entries) => {
      const state = JSON.parse(strFromU8(entries["state.json"])) as Record<string, unknown>;
      delete state.srsActivityLog;
      const stateBytes = strToU8(JSON.stringify(state));
      entries["state.json"] = stateBytes;
      const manifest = readManifest(entries);
      manifest.stateSha256 = hashBackupBytes(stateBytes);
      writeManifest(entries, manifest);
    });

    expect(parseOfflineBackupArchive(legacy).state.srsActivityLog).toEqual([]);
  });

  it("round-trips built-in form music plus a complete custom form media set", () => {
    const state = createPopulatedState();
    state.profile.localCinematicMusicOverrides = {
      tactical: {
        duringVideo: { uri: "file:///sounds/tactical-during.mp3", name: "tactical-during.mp3", durationSeconds: 10.25 },
        postVideo: { uri: "file:///sounds/tactical-after.mp3", name: "tactical-after.mp3", durationSeconds: 7.5 },
      },
    };
    state.profile.customCharacterForms = [{
      id: "arcane_commander",
      name: "Arcane Commander",
      activationLevel: 600,
      portrait: { uri: "file:///portraits/arcane.png", name: "arcane.png" },
      video: { uri: "file:///cinematics/arcane.mp4", name: "arcane.mp4" },
      music: {
        duringVideo: { uri: "file:///sounds/arcane-during.mp3", name: "arcane-during.mp3", durationSeconds: 10.4 },
        postVideo: { uri: "file:///sounds/arcane-after.mp3", name: "arcane-after.mp3", durationSeconds: 7.1 },
      },
      createdAt: "2026-08-14T00:00:00.000Z",
    }];
    const media = [
      "media/cinematic-music/tactical-duringVideo.mp3",
      "media/cinematic-music/tactical-postVideo.mp3",
      "media/forms/arcane_commander/portrait.png",
      "media/forms/arcane_commander/video.mp4",
      "media/forms/arcane_commander/duringVideo.mp3",
      "media/forms/arcane_commander/postVideo.mp3",
    ].map((path) => ({ path, bytes: strToU8(path) }));

    const parsed = parseOfflineBackupArchive(createOfflineBackupArchive(state, media).archive);

    expect(parsed.state.profile.localCinematicMusicOverrides.tactical?.duringVideo?.durationSeconds).toBe(10.25);
    expect(parsed.state.profile.customCharacterForms[0]).toMatchObject({ id: "arcane_commander", activationLevel: 600 });
    expect(parsed.media.map((file) => file.path)).toEqual(media.map((file) => file.path));
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
