import { beforeEach, describe, expect, it, vi } from "vitest";

const { storage, multiSet, multiRemove } = vi.hoisted(() => {
  const hoistedStorage = new Map<string, string>();
  return {
    storage: hoistedStorage,
    multiSet: vi.fn(async (pairs: readonly (readonly [string, string])[]) => {
      for (const [key, value] of pairs) hoistedStorage.set(key, value);
    }),
    multiRemove: vi.fn(async (keys: readonly string[]) => {
      for (const key of keys) hoistedStorage.delete(key);
    }),
  };
});

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => { storage.set(key, value); }),
    removeItem: vi.fn(async (key: string) => { storage.delete(key); }),
    multiGet: vi.fn(async (keys: readonly string[]) => keys.map((key) => [key, storage.get(key) ?? null] as const)),
    multiSet,
    multiRemove,
  },
}));

import { createInitialState, type FocusState } from "../lib/focus-command";
import {
  clearPersistedFocusState,
  createFocusStatePersistenceCache,
  LEGACY_FOCUS_STATE_STORAGE_KEY,
  loadPersistedFocusState,
  persistFocusStateIncrementally,
} from "../lib/focus-state-persistence";

describe("incremental Focus Command persistence", () => {
  beforeEach(() => {
    storage.clear();
    multiSet.mockClear();
    multiRemove.mockClear();
  });

  it("writes all domains once, then writes only a changed immutable domain plus the manifest", async () => {
    const initial = { ...createInitialState(), hydrated: true };
    const cache = createFocusStatePersistenceCache();

    await persistFocusStateIncrementally(initial, cache);
    const initialPairs = multiSet.mock.calls[0][0];
    expect(initialPairs.length).toBeGreaterThan(20);

    const updated = {
      ...initial,
      journals: [{ id: "journal_changed", title: "Changed" } as unknown as FocusState["journals"][number]],
    };
    await persistFocusStateIncrementally(updated, cache);
    const changedKeys = multiSet.mock.calls[1][0].map(([key]) => key);

    expect(changedKeys).toHaveLength(2);
    expect(changedKeys.some((key) => key.endsWith(":field:journals"))).toBe(true);
    expect(changedKeys.some((key) => key.endsWith(":manifest"))).toBe(true);
    expect(changedKeys.some((key) => key.endsWith(":field:missionCompletions"))).toBe(false);
  });

  it("hydrates the new sharded state and keeps the original monolithic key as a fallback", async () => {
    const initial = { ...createInitialState(), hydrated: true };
    const cache = createFocusStatePersistenceCache();
    await persistFocusStateIncrementally(initial, cache);

    expect(await loadPersistedFocusState()).toMatchObject({ schemaVersion: initial.schemaVersion, profile: initial.profile });

    await clearPersistedFocusState();
    const { hydrated: _hydrated, ...legacy } = initial;
    storage.set(LEGACY_FOCUS_STATE_STORAGE_KEY, JSON.stringify(legacy));
    expect(await loadPersistedFocusState()).toMatchObject({ schemaVersion: initial.schemaVersion, profile: initial.profile });
  });
});
