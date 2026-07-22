import { beforeEach, describe, expect, it, vi } from "vitest";

const nativeMocks = vi.hoisted(() => ({
  getDocumentAsync: vi.fn(),
  makeDirectoryAsync: vi.fn(),
  copyAsync: vi.fn(),
  deleteAsync: vi.fn(),
  getInfoAsync: vi.fn(),
}));

const { getDocumentAsync, makeDirectoryAsync, copyAsync, deleteAsync, getInfoAsync } = nativeMocks;

vi.mock("expo-document-picker", () => ({ getDocumentAsync: nativeMocks.getDocumentAsync }));
vi.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file:///documents/",
  makeDirectoryAsync: nativeMocks.makeDirectoryAsync,
  copyAsync: nativeMocks.copyAsync,
  deleteAsync: nativeMocks.deleteAsync,
  getInfoAsync: nativeMocks.getInfoAsync,
}));

import { pickAndPersistFocusSound, removePersistedFocusSound } from "../lib/focus-sound-library";

describe("native custom sound file lifecycle", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getDocumentAsync.mockReset();
    makeDirectoryAsync.mockReset();
    copyAsync.mockReset();
    deleteAsync.mockReset();
    getInfoAsync.mockReset();
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);
  });

  it("copies a chosen cached audio file into durable app storage and returns its visible filename", async () => {
    getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///cache/alert.wav", name: "Alert tone.wav", mimeType: "audio/wav" }],
    });
    makeDirectoryAsync.mockResolvedValue(undefined);
    copyAsync.mockResolvedValue(undefined);
    getInfoAsync
      .mockResolvedValueOnce({ exists: true, size: 2048 })
      .mockResolvedValueOnce({ exists: true, size: 2048 });

    await expect(pickAndPersistFocusSound("revisionReminder")).resolves.toEqual({
      uri: "file:///documents/focus-command-sounds/revisionReminder-1700000000000.wav",
      name: "Alert tone.wav",
    });
    expect(getDocumentAsync).toHaveBeenCalledWith(expect.objectContaining({ copyToCacheDirectory: true, multiple: false }));
    expect(copyAsync).toHaveBeenCalledWith({
      from: "file:///cache/alert.wav",
      to: "file:///documents/focus-command-sounds/revisionReminder-1700000000000.wav",
    });
  });

  it("does not alter any role when the picker is canceled and removes only Focus Command-owned custom files", async () => {
    getDocumentAsync.mockResolvedValue({ canceled: true, assets: null });
    await expect(pickAndPersistFocusSound("dailyMissionReminder")).resolves.toBeNull();
    expect(copyAsync).not.toHaveBeenCalled();

    await removePersistedFocusSound("file:///documents/focus-command-sounds/daily.mp3");
    expect(deleteAsync).toHaveBeenCalledWith("file:///documents/focus-command-sounds/daily.mp3", { idempotent: true });
    deleteAsync.mockClear();
    await removePersistedFocusSound("file:///cache/other-app.mp3");
    expect(deleteAsync).not.toHaveBeenCalled();
  });

  it("rejects an unavailable source and removes a partial copied file rather than persisting a broken assignment", async () => {
    getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///cache/broken.mp3", name: "broken.mp3", mimeType: "audio/mpeg" }],
    });
    makeDirectoryAsync.mockResolvedValue(undefined);
    getInfoAsync.mockResolvedValueOnce({ exists: false, size: 0 });

    await expect(pickAndPersistFocusSound("achievementRecap")).rejects.toThrow("no longer available");
    expect(copyAsync).not.toHaveBeenCalled();
  });
});
