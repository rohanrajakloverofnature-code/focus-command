import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "components/emotion-prediction-ticker.tsx"), "utf8");

describe("EmotionPredictionTicker regression contract", () => {
  it("keeps the approved three-second, reduced-motion-safe rotation", () => {
    expect(source).toContain("if (reduceMotion || predictions.length < 2) return;");
    expect(source).toContain("}, 3_000);");
    expect(source).toContain("return () => clearInterval(rotation);");
  });

  it("opens a contained Prediction Library rather than navigating away", () => {
    expect(source).toContain("<TapFeedback onPress={() => setVisible(true)}");
    expect(source).toContain("<Modal visible={visible} transparent animationType=\"fade\"");
    expect(source).toContain("EMOTION PREDICTION LIBRARY");
    expect(source).toContain("CURRENT THREE-READING SET");
  });

  it("retains the strict compact-width and no-text-scaling safety contract", () => {
    expect(source).toContain("export const EMOTION_PREDICTION_CAPSULE_WIDTH = 132;");
    expect(source).toContain("numberOfLines={1} ellipsizeMode=\"clip\" maxFontSizeMultiplier={1}");
    expect(source).toContain("capsulePressable: { width: EMOTION_PREDICTION_CAPSULE_WIDTH, flexShrink: 0 }");
    expect(source).toContain("predictionLabel: { flex: 1, minWidth: 0");
  });
});
