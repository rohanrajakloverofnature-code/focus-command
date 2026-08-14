import type { FocusState } from "./focus-command";

export const GOOGLE_SHEETS_MAX_CELL_CHARACTERS = 50_000;
const SAFE_SHEETS_CELL_CHARACTERS = 48_000;
const PAYLOAD_CHUNK_KEY_PREFIX = "payloadChunk:";
const PAYLOAD_CHUNK_COUNT_KEY = "payloadChunkCount";
const TRUNCATED_READABLE_VALUE_SUFFIX = "\n\n[Truncated in this readable Google Sheets tab. The complete value is preserved in the App_State snapshot.]";

export interface GoogleSheetsValueRange {
  range: string;
  values: string[][];
}

function limitReadableCell(value: string): string {
  if (value.length <= SAFE_SHEETS_CELL_CHARACTERS) return value;
  const availableCharacters = SAFE_SHEETS_CELL_CHARACTERS - TRUNCATED_READABLE_VALUE_SUFFIX.length;
  return `${value.slice(0, Math.max(0, availableCharacters))}${TRUNCATED_READABLE_VALUE_SUFFIX}`;
}

function stringifyCell(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return limitReadableCell(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return limitReadableCell(JSON.stringify(value));
}

function objectRows(items: unknown[]) {
  const records = items.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item));
  const columns = Array.from(new Set(records.flatMap((record) => Object.keys(record))));
  if (!columns.length) return [["No records"]];
  return [columns.map(limitReadableCell), ...records.map((record) => columns.map((column) => stringifyCell(record[column])))];
}

function chunkPayload(payload: string): string[] {
  if (!payload.length) return [""];
  const chunks: string[] = [];
  for (let offset = 0; offset < payload.length; offset += SAFE_SHEETS_CELL_CHARACTERS) {
    chunks.push(payload.slice(offset, offset + SAFE_SHEETS_CELL_CHARACTERS));
  }
  return chunks;
}

function makeAppStateRows(state: FocusState) {
  const serializedPayload = JSON.stringify({ ...state, hydrated: true });
  const payloadChunks = chunkPayload(serializedPayload);
  const rows: string[][] = [
    ["key", "value"],
    ["schemaVersion", String(state.schemaVersion)],
    ["updatedAt", new Date().toISOString()],
  ];

  if (payloadChunks.length === 1) {
    rows.push(["payload", payloadChunks[0]]);
  } else {
    rows.push([PAYLOAD_CHUNK_COUNT_KEY, String(payloadChunks.length)]);
    payloadChunks.forEach((chunk, index) => {
      rows.push([`${PAYLOAD_CHUNK_KEY_PREFIX}${String(index + 1).padStart(6, "0")}`, chunk]);
    });
  }

  return rows;
}

export function makeFocusWorkbookValueRanges(state: FocusState): GoogleSheetsValueRange[] {
  return [
    { range: "App_State!A1", values: makeAppStateRows(state) },
    { range: "Missions!A1", values: objectRows(state.missions) },
    { range: "Reflections!A1", values: objectRows(state.reflections) },
    { range: "Revisions!A1", values: objectRows(state.srsTopics) },
    { range: "Bosses!A1", values: objectRows(state.bosses) },
    { range: "Journal!A1", values: objectRows(state.journals) },
    { range: "Rewards!A1", values: objectRows(state.rewards) },
    { range: "Transactions!A1", values: objectRows(state.transactions) },
    { range: "Inventory!A1", values: objectRows(state.inventory) },
    { range: "Progression!A1", values: objectRows(state.progression) },
    { range: "Lifeline!A1", values: objectRows(state.lifeline) },
    {
      range: "Settings!A1",
      values: [
        ["key", "value"],
        ["profile", stringifyCell(state.profile)],
        ["combo", stringifyCell(state.combo)],
        ["customQuestions", stringifyCell(state.customQuestions)],
        ["customGraphs", stringifyCell(state.customGraphs)],
      ],
    },
  ];
}

export function assembleFocusWorkbookPayload(records: Map<string, string>): string | null {
  const legacyPayload = records.get("payload");
  if (legacyPayload) return legacyPayload;

  const expectedChunkCount = Number(records.get(PAYLOAD_CHUNK_COUNT_KEY));
  if (!Number.isInteger(expectedChunkCount) || expectedChunkCount < 1) return null;
  const chunks = Array.from({ length: expectedChunkCount }, (_, index) => records.get(`${PAYLOAD_CHUNK_KEY_PREFIX}${String(index + 1).padStart(6, "0")}`));
  return chunks.every((chunk): chunk is string => typeof chunk === "string") ? chunks.join("") : null;
}
