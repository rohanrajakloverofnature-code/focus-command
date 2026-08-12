import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const assetPath = resolve(process.cwd(), "assets/images/launch-fire-alpha.webp");
const launchComponentPath = resolve(process.cwd(), "components/launch-animation.tsx");

describe("Native launch fire asset", () => {
  it("keeps the transparent fire as a compact multi-frame WebP rather than a static image", () => {
    const asset = readFileSync(assetPath);
    const container = asset.toString("latin1");

    expect(statSync(assetPath).size).toBeLessThan(1_000_000);
    expect(container.includes("ANIM")).toBe(true);
    expect((container.match(/ANMF/g) ?? []).length).toBeGreaterThan(1);
    expect((container.match(/ALPH/g) ?? []).length).toBeGreaterThan(1);
  });

  it("uses the animated WebP with autoplay in the root-only launch component", () => {
    const component = readFileSync(launchComponentPath, "utf8");

    expect(component).toContain('require("../assets/images/launch-fire-alpha.webp")');
    expect(component).toContain("<Image autoplay");
  });
});
