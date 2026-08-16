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

  it("keeps the approved premium compact slots contained without sacrificing readable prediction copy", () => {
    expect(source).toContain('capsule: { width: EMOTION_PREDICTION_CAPSULE_WIDTH, minHeight: 42');
    expect(source).toContain('const resolvedSurfaceColor = surfaceColor ?? "#14122C"');
    expect(source).toContain('style={[styles.capsule, { backgroundColor: resolvedSurfaceColor, borderColor: `${resolvedAccentColor}9A` }]}');
    expect(source).toContain("predictionIcon: { width: 20");
    expect(source).toContain("flexShrink: 0, overflow: \"hidden\" }");
    expect(source).toContain("chevronFrame: { width: 19");
    expect(source).toContain("backgroundColor: \"#0F1022A8\", flexShrink: 0");
    expect(source).toContain("capsuleGlow:");
    expect(source).toContain("accentRail:");
    expect(source).toContain("iconHalo:");
  });

  it("keeps a memoized ticker boundary and resets rotation only when the prediction identity set changes", () => {
    expect(source).toContain("export const EmotionPredictionTicker = memo(function EmotionPredictionTicker");
    expect(source).toContain("const key = useMemo(() => predictions.map((prediction) => prediction.id).join(\"|\"), [predictions]);");
    expect(source).toContain("useEffect(() => { setIndex(0); }, [key]);");
    expect(source).toContain("}, [key, opacity, predictions.length, reduceMotion]);");
  });
});
