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

import { pickAndPersistCinematicVideo, removePersistedCinematicVideo } from "../lib/focus-cinematic-library";

describe("offline character cinematic lifecycle", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getDocumentAsync.mockReset();
    makeDirectoryAsync.mockReset();
    copyAsync.mockReset();
    deleteAsync.mockReset();
    getInfoAsync.mockReset();
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);
  });

  it("copies a selected character video into durable local storage with its visible filename", async () => {
    getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///cache/recruit.mov", name: "Recruit ascent.mov", mimeType: "video/quicktime" }],
    });
    makeDirectoryAsync.mockResolvedValue(undefined);
    copyAsync.mockResolvedValue(undefined);
    getInfoAsync
      .mockResolvedValueOnce({ exists: true, size: 2048 })
      .mockResolvedValueOnce({ exists: true, size: 2048 });

    await expect(pickAndPersistCinematicVideo("tactical")).resolves.toEqual({
      uri: "file:///documents/focus-command-cinematics/tactical-1700000000000.mov",
      name: "Recruit ascent.mov",
    });
    expect(getDocumentAsync).toHaveBeenCalledWith(expect.objectContaining({ type: expect.arrayContaining(["video/*", "video/mp4"]), copyToCacheDirectory: true, multiple: false }));
    expect(copyAsync).toHaveBeenCalledWith({
      from: "file:///cache/recruit.mov",
      to: "file:///documents/focus-command-cinematics/tactical-1700000000000.mov",
    });
  });

  it("leaves the bundled cinematic untouched on cancel and only removes app-owned video files", async () => {
    getDocumentAsync.mockResolvedValue({ canceled: true, assets: null });
    await expect(pickAndPersistCinematicVideo("shadow")).resolves.toBeNull();
    expect(copyAsync).not.toHaveBeenCalled();

    await removePersistedCinematicVideo("file:///documents/focus-command-cinematics/shadow.mp4");
    expect(deleteAsync).toHaveBeenCalledWith("file:///documents/focus-command-cinematics/shadow.mp4", { idempotent: true });
    deleteAsync.mockClear();
    await removePersistedCinematicVideo("file:///cache/another-app.mp4");
    expect(deleteAsync).not.toHaveBeenCalled();
  });

  it("rejects a selected file that is no longer available without creating an override", async () => {
    getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///cache/missing.mp4", name: "missing.mp4", mimeType: "video/mp4" }],
    });
    makeDirectoryAsync.mockResolvedValue(undefined);
    getInfoAsync.mockResolvedValueOnce({ exists: false, size: 0 });

    await expect(pickAndPersistCinematicVideo("commandEvolution")).rejects.toThrow("no longer available");
    expect(copyAsync).not.toHaveBeenCalled();
  });
});
