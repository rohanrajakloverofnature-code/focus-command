import type { EmotionalPatternForecast } from "@/lib/focus-command";

export interface ForecastMotivationMessage {
  headline: string;
  detail: string;
}

export function getForecastMotivationMessages(forecast: EmotionalPatternForecast): ForecastMotivationMessage[] {
  if (!forecast.available) {
    return [
      { headline: "Begin your reflection baseline.", detail: "Complete a mission and log its optional debrief to start your on-device forecast." },
      { headline: "Your pattern is waiting for input.", detail: "Each reflection adds a concrete data point to your personal focus and energy trends." },
      { headline: "Observe without pressure.", detail: "There are no targets to hit—just honest logs of focus, energy, and friction." },
    ];
  }

  // Extract signals for deeper analysis
  const signalsMap = new Map(forecast.signals.map(s => [s.label.toLowerCase(), s]));
  const focusSignal = signalsMap.get("focus");
  const motivationSignal = signalsMap.get("motivation");
  const claritySignal = signalsMap.get("clarity");
  const stressSignal = signalsMap.get("stress load");
  const distractionSignal = signalsMap.get("distraction");

  const sampleDesc = `${forecast.sampleSize} reflection${forecast.sampleSize === 1 ? "" : "s"}`;
  const confText = forecast.confidence === "grounded" ? "grounded" : forecast.confidence === "emerging" ? "forming" : "early";

  const pool: ForecastMotivationMessage[] = [];

  // Data-driven insight categories based on outlook & signal analysis
  if (forecast.outlook === "momentum") {
    if (focusSignal && focusSignal.value >= 75) {
      pool.push(
        { headline: "High focus is driving momentum.", detail: `Across your last ${sampleDesc}, your reported focus averaging ${focusSignal.value}% is powering a strong upward trend.` },
        { headline: "Capitalize on peak clarity.", detail: `With clarity holding strong and ${confText} confidence from ${sampleDesc}, now is the ideal window for deep work.` }
      );
    }
    if (motivationSignal && motivationSignal.value >= 70) {
      pool.push(
        { headline: "Motivation meets clear output.", detail: `Your ${confText} forecast (${sampleDesc}) indicates high drive; channel this energy into your primary objective.` },
        { headline: "Sustain your current rhythm.", detail: `Your logged momentum is steady across ${sampleDesc}. Protect this block from unnecessary task switching.` }
      );
    }
    pool.push(
      { headline: "Momentum is active.", detail: `Your ${confText} forecast from ${sampleDesc} favors another defined focus block while conditions are favorable.` },
      { headline: "Keep the next target precise.", detail: `Your supportive signals outweigh load across ${sampleDesc}. Commit to one well-scoped task.` },
      { headline: "Turn active flow into consistency.", detail: `The forecast score (${forecast.score}/100) reflects strong alignment between focus and motivation.` }
    );
  } else if (forecast.outlook === "steady") {
    if (stressSignal && stressSignal.value >= 60) {
      pool.push(
        { headline: "Balanced despite elevated load.", detail: `Even with stress registering around ${stressSignal.value}%, your overall balance score (${forecast.score}/100) remains steady across ${sampleDesc}.` },
        { headline: "Maintain your anchor.", detail: `Your steady forecast (${sampleDesc}) shows that consistent execution is buffering against recent task friction.` }
      );
    }
    if (claritySignal && claritySignal.value >= 70) {
      pool.push(
        { headline: "Clear direction keeps you steady.", detail: `Your ${confText} trend across ${sampleDesc} shows high clarity; keep your next task equally straightforward.` },
        { headline: "Calm consistency is your edge.", detail: `With a balance score of ${forecast.score}/100 from ${sampleDesc}, repeatable blocks will compound your progress.` }
      );
    }
    pool.push(
      { headline: "Strengthen the steady pattern.", detail: `Your ${confText} forecast from ${sampleDesc} is stable—one consistent block reinforces it.` },
      { headline: "Consistency is your advantage.", detail: `Logged signals across ${sampleDesc} show healthy equilibrium between focus and demand.` },
      { headline: "Build quietly on what works.", detail: `A calm, uninterrupted session is the most reliable way to preserve this steady outlook.` }
    );
  } else if (forecast.outlook === "recovery") {
    if (distractionSignal && distractionSignal.value >= 60) {
      pool.push(
        { headline: "Distraction load calls for a reset.", detail: `Your recent ${sampleDesc} indicate attention drift averaging ${distractionSignal.value}%. Simplify your workspace before starting.` },
        { headline: "Clear the noise first.", detail: `With recovery indicated by your ${confText} forecast, reducing distractions will yield a cleaner next session.` }
      );
    }
    if (focusSignal && focusSignal.value < 50) {
      pool.push(
        { headline: "Focus needs a lower hurdle.", detail: `Your focus score (${focusSignal.value}%) across ${sampleDesc} suggests breaking your next objective into smaller pieces.` },
        { headline: "Gentle pacing supports recovery.", detail: `Your on-device forecast (${sampleDesc}) favors a shorter, lower-pressure session to rebuild rhythm.` }
      );
    }
    pool.push(
      { headline: "Make the next step smaller.", detail: `Your ${confText} forecast from ${sampleDesc} suggests a gentle reset before tackling demanding tasks.` },
      { headline: "Clarity first, intensity second.", detail: `Use one small, well-defined task to ease the friction recorded in your last ${sampleDesc}.` },
      { headline: "A lightweight beginning counts.", detail: `The forecast (${forecast.score}/100) points toward recovery—opt for a manageable action over a heavy push.` }
    );
  } else if (forecast.outlook === "fragile") {
    if (stressSignal && stressSignal.value >= 65) {
      pool.push(
        { headline: "High stress load detected.", detail: `Your ${sampleDesc} show stress averaging ${stressSignal.value}%. Consider lowering session duration or task complexity.` },
        { headline: "Protect your energy reserves.", detail: `With load signals outweighing supportive ones in your ${confText} forecast, prioritize friction reduction.` }
      );
    }
    pool.push(
      { headline: "Reduce friction before the next block.", detail: `Your ${confText} forecast from ${sampleDesc} contains more reported load signals right now.` },
      { headline: "Choose the smallest useful action.", detail: `A short, concrete task can create a positive signal without requiring an all-or-nothing effort.` },
      { headline: "Create easier operating conditions.", detail: `Your recent ${sampleDesc} reflect strain; use this data as a cue to simplify your immediate environment.` }
    );
  } else {
    pool.push(
      { headline: "Your pattern is warming up.", detail: `The forecast has ${sampleDesc}; a few more honest debriefs will sharpen your trend lines.` },
      { headline: "Give the forecast a clear signal.", detail: `Complete a short session followed by your reflection to keep your ${confText} model building.` },
      { headline: "Progress begins with observation.", detail: `Your on-device pattern summary is learning directly from what you log across ${sampleDesc}.` }
    );
  }

  // Ensure variety and fallback
  return pool;
}
