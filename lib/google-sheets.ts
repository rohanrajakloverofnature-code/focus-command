import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { FocusState } from "@/lib/focus-command";
import { assembleFocusWorkbookPayload, makeFocusWorkbookValueRanges } from "@/lib/google-sheets-payload";

const ACCESS_TOKEN_KEY = "focus-command.google.access-token";
const REFRESH_TOKEN_KEY = "focus-command.google.refresh-token";
const EXPIRY_KEY = "focus-command.google.token-expiry";
const SELECTED_WORKBOOK_KEY = "focus-command.google.selected-workbook";
const SHEETS_API = "https://sheets.googleapis.com/v4";

export const FOCUS_SHEET_TABS = [
  "App_State",
  "Missions",
  "Reflections",
  "Revisions",
  "Bosses",
  "Journal",
  "Rewards",
  "Transactions",
  "Inventory",
  "Progression",
  "Lifeline",
  "Settings",
] as const;

export interface GoogleTokenBundle {
  accessToken: string;
  refreshToken?: string | null;
  expiresIn?: number | null;
}

export interface GoogleWorkbook {
  spreadsheetId: string;
  spreadsheetName: string;
}

export interface FocusWorkbookMetadata {
  updatedAt: string | null;
  schemaVersion: number | null;
  payload: FocusState | null;
}

interface SheetsErrorResponse {
  error?: { message?: string; status?: string };
}

function tokenStorageKey(key: string) {
  return key.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function setSensitiveValue(key: string, value: string) {
  if (Platform.OS === "web") {
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(tokenStorageKey(key), value);
}

async function getSensitiveValue(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof sessionStorage === "undefined" ? null : sessionStorage.getItem(key);
  }
  return SecureStore.getItemAsync(tokenStorageKey(key));
}

async function removeSensitiveValue(key: string) {
  if (Platform.OS === "web") {
    if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(tokenStorageKey(key));
}

export async function saveGoogleTokens(tokens: GoogleTokenBundle) {
  await setSensitiveValue(ACCESS_TOKEN_KEY, tokens.accessToken);
  if (tokens.refreshToken) await setSensitiveValue(REFRESH_TOKEN_KEY, tokens.refreshToken);
  if (tokens.expiresIn) await setSensitiveValue(EXPIRY_KEY, String(Date.now() + tokens.expiresIn * 1_000));
}

export async function saveSelectedFocusWorkbook(workbook: GoogleWorkbook) {
  await setSensitiveValue(SELECTED_WORKBOOK_KEY, JSON.stringify(workbook));
}

export async function getSelectedFocusWorkbook(): Promise<GoogleWorkbook | null> {
  try {
    const raw = await getSensitiveValue(SELECTED_WORKBOOK_KEY);
    if (!raw) return null;
    const workbook = JSON.parse(raw) as Partial<GoogleWorkbook>;
    if (!workbook.spreadsheetId || !workbook.spreadsheetName) return null;
    return { spreadsheetId: workbook.spreadsheetId, spreadsheetName: workbook.spreadsheetName };
  } catch {
    return null;
  }
}

export async function clearSelectedFocusWorkbook() {
  await removeSensitiveValue(SELECTED_WORKBOOK_KEY);
}

export async function getGoogleAccessToken(): Promise<string | null> {
  const token = await getSensitiveValue(ACCESS_TOKEN_KEY);
  const expiry = Number(await getSensitiveValue(EXPIRY_KEY) ?? 0);
  if (expiry && expiry < Date.now() + 30_000) return null;
  return token;
}

export async function refreshGoogleAccessToken(clientId: string): Promise<string | null> {
  const refreshToken = await getSensitiveValue(REFRESH_TOKEN_KEY);
  if (!clientId || !refreshToken) return null;
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
    });
    if (!response.ok) return null;
    const token = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number };
    if (!token.access_token) return null;
    await saveGoogleTokens({
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? refreshToken,
      expiresIn: token.expires_in ?? null,
    });
    return token.access_token;
  } catch {
    return null;
  }
}

export async function clearGoogleTokens() {
  await Promise.all([removeSensitiveValue(ACCESS_TOKEN_KEY), removeSensitiveValue(REFRESH_TOKEN_KEY), removeSensitiveValue(EXPIRY_KEY)]);
}

async function sheetsRequest<T>(accessToken: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${SHEETS_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as SheetsErrorResponse;
    throw new Error(error.error?.message ?? `Google Sheets request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getSpreadsheet(accessToken: string, spreadsheetId: string): Promise<GoogleWorkbook> {
  const result = await sheetsRequest<{ spreadsheetId: string; properties: { title: string } }>(
    accessToken,
    `/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=spreadsheetId,properties.title`,
  );
  return { spreadsheetId: result.spreadsheetId, spreadsheetName: result.properties.title };
}

export async function createFocusWorkbook(accessToken: string, title = "Focus Command Data") : Promise<GoogleWorkbook> {
  const result = await sheetsRequest<{ spreadsheetId: string; properties: { title: string } }>(accessToken, "/spreadsheets", {
    method: "POST",
    body: JSON.stringify({
      properties: { title },
      sheets: FOCUS_SHEET_TABS.map((sheetTitle) => ({ properties: { title: sheetTitle } })),
    }),
  });
  return { spreadsheetId: result.spreadsheetId, spreadsheetName: result.properties.title };
}

export async function ensureFocusTabs(accessToken: string, spreadsheetId: string) {
  const metadata = await sheetsRequest<{ sheets?: Array<{ properties?: { title?: string } }> }>(
    accessToken,
    `/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties.title`,
  );
  const existing = new Set(metadata.sheets?.map((sheet) => sheet.properties?.title).filter(Boolean) as string[]);
  const missing = FOCUS_SHEET_TABS.filter((title) => !existing.has(title));
  if (!missing.length) return;
  await sheetsRequest(accessToken, `/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({ requests: missing.map((title) => ({ addSheet: { properties: { title } } })) }),
  });
}

export async function writeFocusWorkbook(accessToken: string, workbook: GoogleWorkbook, state: FocusState) {
  await ensureFocusTabs(accessToken, workbook.spreadsheetId);
  await sheetsRequest(accessToken, `/spreadsheets/${encodeURIComponent(workbook.spreadsheetId)}/values:batchClear`, {
    method: "POST",
    body: JSON.stringify({ ranges: FOCUS_SHEET_TABS.map((tab) => `'${tab}'!A:AZ`) }),
  });
  await sheetsRequest(accessToken, `/spreadsheets/${encodeURIComponent(workbook.spreadsheetId)}/values:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({ valueInputOption: "RAW", data: makeFocusWorkbookValueRanges(state) }),
  });
}

export async function getFocusWorkbookMetadata(accessToken: string, spreadsheetId: string): Promise<FocusWorkbookMetadata> {
  const response = await sheetsRequest<{ values?: string[][] }>(
    accessToken,
    `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent("App_State!A:B")}`,
  );
  const records = new Map(response.values?.map((row) => [row[0], row[1]]) ?? []);
  const rawPayload = assembleFocusWorkbookPayload(records);
  let payload: FocusState | null = null;
  if (rawPayload) {
    try {
      const parsed: unknown = JSON.parse(rawPayload);
      if (parsed && typeof parsed === "object" && "profile" in parsed && "missions" in parsed) payload = parsed as FocusState;
    } catch {
      payload = null;
    }
  }
  const rawSchemaVersion = Number(records.get("schemaVersion"));
  return {
    updatedAt: records.get("updatedAt") ?? null,
    schemaVersion: Number.isFinite(rawSchemaVersion) ? rawSchemaVersion : null,
    payload,
  };
}

export async function readFocusWorkbook(accessToken: string, spreadsheetId: string): Promise<FocusState> {
  const metadata = await getFocusWorkbookMetadata(accessToken, spreadsheetId);
  if (!metadata.payload) throw new Error("This spreadsheet does not contain a valid Focus Command data snapshot.");
  return metadata.payload;
}
