import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { assertLaunchAudioDuration } from "../lib/launch-animation-validation";

const component = readFileSync(resolve(process.cwd(), "components/launch-animation.tsx"), "utf8");
const settings = readFileSync(resolve(process.cwd(), "app/settings.tsx"), "utf8");
const backup = readFileSync(resolve(process.cwd(), "lib/offline-backup.ts"), "utf8");

describe("Launch Animation customization", () => {
  it("accepts exactly five and ten seconds, but rejects values outside the approved range", () => {
    expect(() => assertLaunchAudioDuration(5)).not.toThrow();
    expect(() => assertLaunchAudioDuration(10)).not.toThrow();
    expect(() => assertLaunchAudioDuration(4.999)).toThrow("5.0 to 10.0");
    expect(() => assertLaunchAudioDuration(10.001)).toThrow("5.0 to 10.0");
    expect(() => assertLaunchAudioDuration(Number.NaN)).toThrow("unknown");
  });

  it("keeps the default transparent fire path while providing a guarded GIF/WebP and audio pair", () => {
    expect(component).toContain('require("../assets/images/launch-fire-alpha.webp")');
    expect(component).toContain("hasCustomLaunchMedia");
    expect(component).toContain("customVisualRef.current?.startAnimating()");
    expect(component).toContain("launchAnimation.visual?.uri && launchAnimation.audio?.uri");
  });

  it("uses one persisted switch to bypass the entire launch sequence before quote selection", () => {
    expect(component).toContain("if (!launchAnimation.enabled)");
    expect(component).toContain("onFinished?.()");
    expect(settings).toContain("Launch animation");
    expect(settings).toContain("launchAnimation.enabled");
  });

  it("retains the quote handoff while preventing the old fire crackle from overlapping custom media", () => {
    expect(component).toContain("if (hasCustomLaunchMedia) playCustomLaunchMedia();");
    expect(component).toContain("else playFireAudio();");
    expect(component).toContain("if (hasCustomLaunchMedia) stopCustomLaunchMedia();");
    expect(component).toContain("playQuoteTransitionAudio();");
  });

  it("includes the selected local launch visual and audio in the existing offline backup and restore path", () => {
    expect(backup).toContain('const LAUNCH_PREFIX = "media/launch/"');
    expect(backup).toContain("state.profile.launchAnimation.visual?.uri");
    expect(backup).toContain("state.profile.launchAnimation.audio?.uri");
    expect(backup).toContain("state.profile.launchAnimation.visual = { ...launchVisual, uri };");
    expect(backup).toContain("state.profile.launchAnimation.audio = { ...launchAudio, uri };");
  });
});
