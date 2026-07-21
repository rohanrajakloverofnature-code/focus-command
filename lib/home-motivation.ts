import type { EmotionalPatternForecast } from "@/lib/focus-command";

export interface ForecastMotivationMessage {
  headline: string;
  detail: string;
}

export function getForecastMotivationMessages(forecast: EmotionalPatternForecast): ForecastMotivationMessage[] {
  if (!forecast.available) {
    return [
      { headline: "Start your first signal.", detail: "Complete one mission and its optional debrief to begin building your private on-device pattern forecast." },
      { headline: "One block creates a baseline.", detail: "Your forecast becomes more personal as you add focus, energy, and friction reflections." },
      { headline: "Log what feels true.", detail: "There is no target score—your own ratings are the only input to the forecast." },
    ];
  }

  const confidence = forecast.confidence === "grounded" ? "grounded" : forecast.confidence === "emerging" ? "forming" : "early";
  const signalCount = `${forecast.sampleSize} reflection${forecast.sampleSize === 1 ? "" : "s"}`;
  const messages: Record<EmotionalPatternForecast["outlook"], ForecastMotivationMessage[]> = {
    momentum: [
      { headline: "Protect your momentum.", detail: `Your ${confidence} forecast from ${signalCount} favors another defined focus block.` },
      { headline: "Keep the next target clear.", detail: "Your recent focus and motivation signals are supporting forward motion—choose one meaningful task." },
      { headline: "Turn progress into consistency.", detail: "The forecast is trending with you. Begin before the conditions change." },
    ],
    steady: [
      { headline: "Strengthen the steady pattern.", detail: `Your ${confidence} forecast from ${signalCount} is stable—one consistent block reinforces it.` },
      { headline: "Consistency is your advantage.", detail: "Your logged signals are balanced enough for a clear, achievable next task." },
      { headline: "Build on what is working.", detail: "A calm, focused block is the most direct way to preserve a steady forecast." },
    ],
    recovery: [
      { headline: "Make the next step smaller.", detail: `Your ${confidence} forecast from ${signalCount} suggests a gentle reset before a demanding block.` },
      { headline: "Clarity first, intensity second.", detail: "Use one small, well-defined task to reduce the friction your recent debriefs recorded." },
      { headline: "A clear beginning counts.", detail: "The forecast favors a manageable next action over a large unstructured push." },
    ],
    fragile: [
      { headline: "Reduce friction before the next block.", detail: `Your ${confidence} forecast from ${signalCount} contains more reported load signals right now.` },
      { headline: "Choose the smallest useful action.", detail: "A short, concrete task can create a new signal without asking for an all-or-nothing session." },
      { headline: "Create easier conditions first.", detail: "Use your reflection data as a cue to simplify the task, environment, or first step." },
    ],
    warming_up: [
      { headline: "Your pattern is warming up.", detail: `The forecast has ${signalCount}; a few more honest debriefs will make its signal clearer.` },
      { headline: "Give the forecast a useful next signal.", detail: "A short mission followed by your own reflection is enough to keep the pattern building." },
      { headline: "Progress begins with observation.", detail: "The on-device forecast is learning from what you choose to record—not from assumptions." },
    ],
  };

  return messages[forecast.outlook];
}
