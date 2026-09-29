import AsyncStorage from "@react-native-async-storage/async-storage";

import type { FocusState } from "./focus-command";

export const LEGACY_FOCUS_STATE_STORAGE_KEY = "focus-command-state-v1";
const FOCUS_STATE_STORAGE_PREFIX = "focus-command-state-v2";
const FOCUS_STATE_MANIFEST_KEY = `${FOCUS_STATE_STORAGE_PREFIX}:manifest`;
const FOCUS_STATE_STORAGE_VERSION = 1;

type PersistedFocusState = Omit<FocusState, "hydrated">;
type PersistedFocusStateKey = keyof PersistedFocusState;

type PersistenceManifest = {
  version: typeof FOCUS_STATE_STORAGE_VERSION;
  fields: PersistedFocusStateKey[];
};

export interface FocusStatePersistenceCache {
  references: Partial<Record<PersistedFocusStateKey, unknown>>;
  serialized: Partial<Record<PersistedFocusStateKey, string>>;
  fields: PersistedFocusStateKey[] | null;
}

export function createFocusStatePersistenceCache(): FocusStatePersistenceCache {
  return { references: {}, serialized: {}, fields: null };
}

function fieldStorageKey(field: PersistedFocusStateKey): string {
  return `${FOCUS_STATE_STORAGE_PREFIX}:field:${String(field)}`;
}

function persistableState(state: FocusState): PersistedFocusState {
  const { hydrated: _hydrated, ...persistable } = state;
  return persistable;
}

function isPersistenceManifest(value: unknown): value is PersistenceManifest {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PersistenceManifest>;
  return candidate.version === FOCUS_STATE_STORAGE_VERSION
    && Array.isArray(candidate.fields)
    && candidate.fields.length > 0
    && candidate.fields.every((field) => typeof field === "string" && field.length > 0);
}

export async function loadPersistedFocusState(): Promise<Partial<FocusState> | null> {
  const manifestRaw = await AsyncStorage.getItem(FOCUS_STATE_MANIFEST_KEY);
  if (manifestRaw) {
    try {
      const manifest = JSON.parse(manifestRaw) as unknown;
      if (!isPersistenceManifest(manifest)) throw new Error("invalid manifest");
      const pairs = await AsyncStorage.multiGet(manifest.fields.map(fieldStorageKey));
      const state: Record<string, unknown> = {};
      for (let index = 0; index < manifest.fields.length; index += 1) {
        const raw = pairs[index]?.[1];
        if (raw === null || raw === undefined) throw new Error("missing persisted field");
        state[manifest.fields[index]] = JSON.parse(raw) as unknown;
      }
      return state as Partial<FocusState>;
    } catch {
      // A legacy snapshot remains a last-resort recovery path if a device ever
      // interrupts a storage migration or a platform storage transaction fails.
    }
  }

  const legacyRaw = await AsyncStorage.getItem(LEGACY_FOCUS_STATE_STORAGE_KEY);
  if (!legacyRaw) return null;
  return JSON.parse(legacyRaw) as Partial<FocusState>;
}

/**
 * Persists only top-level state domains whose immutable reference changed.
 * AsyncStorage.multiSet commits changed domains and their manifest together on
 * native platforms, eliminating repeated whole-history JSON serialization.
 */
export async function persistFocusStateIncrementally(
  state: FocusState,
  cache: FocusStatePersistenceCache,
  force = false,
): Promise<void> {
  const persistable = persistableState(state);
  const fields = Object.keys(persistable) as PersistedFocusStateKey[];
  const nextReferences: Partial<Record<PersistedFocusStateKey, unknown>> = {};
  const nextSerialized: Partial<Record<PersistedFocusStateKey, string>> = {};
  const writes: Array<readonly [string, string]> = [];

  for (const field of fields) {
    const value = persistable[field];
    const unchangedReference = !force && cache.fields !== null && Object.is(cache.references[field], value);
    let serialized = unchangedReference ? cache.serialized[field] : undefined;
    if (serialized === undefined) serialized = JSON.stringify(value);
    if (force || cache.serialized[field] !== serialized) {
      writes.push([fieldStorageKey(field), serialized] as const);
    }
    nextReferences[field] = value;
    nextSerialized[field] = serialized;
  }

  const sameFieldSet = cache.fields !== null
    && cache.fields.length === fields.length
    && cache.fields.every((field, index) => field === fields[index]);
  if (!writes.length && sameFieldSet) return;

  const manifest: PersistenceManifest = { version: FOCUS_STATE_STORAGE_VERSION, fields };
  writes.push([FOCUS_STATE_MANIFEST_KEY, JSON.stringify(manifest)] as const);
  await AsyncStorage.multiSet(writes);
  cache.references = nextReferences;
  cache.serialized = nextSerialized;
  cache.fields = fields;
}

export async function clearPersistedFocusState(): Promise<void> {
  const manifestRaw = await AsyncStorage.getItem(FOCUS_STATE_MANIFEST_KEY);
  let fields: string[] = [];
  if (manifestRaw) {
    try {
      const manifest = JSON.parse(manifestRaw) as unknown;
      if (isPersistenceManifest(manifest)) fields = manifest.fields.map(fieldStorageKey);
    } catch {
      fields = [];
    }
  }
  await AsyncStorage.multiRemove([LEGACY_FOCUS_STATE_STORAGE_KEY, FOCUS_STATE_MANIFEST_KEY, ...fields]);
}
