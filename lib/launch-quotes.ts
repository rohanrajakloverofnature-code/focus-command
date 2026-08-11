import type { EmotionalPatternForecast, WellbeingInsight } from "@/lib/focus-command";

export const LAUNCH_QUOTE_HISTORY_KEY = "focus-command-launch-quote-history-v1";
export const LAUNCH_QUOTE_HISTORY_LIMIT = 72;

export type LaunchQuoteTheme =
  | "calm"
  | "clarity"
  | "consistency"
  | "first_steps"
  | "focus"
  | "momentum"
  | "recovery"
  | "resilience";

export interface LaunchQuote {
  id: string;
  theme: LaunchQuoteTheme;
  text: string;
}

const quotePool: Record<LaunchQuoteTheme, LaunchQuote[]> = {
  momentum: [
    { id: "momentum-01", theme: "momentum", text: "Momentum is not noise. Give it one clear direction." },
    { id: "momentum-02", theme: "momentum", text: "The signal is rising. Turn this opening into deliberate work." },
    { id: "momentum-03", theme: "momentum", text: "A strong rhythm is already forming. Protect the next focused hour." },
    { id: "momentum-04", theme: "momentum", text: "Use today’s forward pull for the task that matters most." },
    { id: "momentum-05", theme: "momentum", text: "Progress has traction. Aim it at one meaningful target." },
    { id: "momentum-06", theme: "momentum", text: "When the path is moving, precision becomes your advantage." },
    { id: "momentum-07", theme: "momentum", text: "The work is responding to you. Meet it with another steady block." },
    { id: "momentum-08", theme: "momentum", text: "Carry the current forward—one intentional action at a time." },
  ],
  focus: [
    { id: "focus-01", theme: "focus", text: "One target. One block. Let everything else wait." },
    { id: "focus-02", theme: "focus", text: "Attention becomes power when you give it a single job." },
    { id: "focus-03", theme: "focus", text: "Choose the next useful action, then stay with it." },
    { id: "focus-04", theme: "focus", text: "The clearest path begins when you stop opening new doors." },
    { id: "focus-05", theme: "focus", text: "Guard the next few minutes. They can change the whole session." },
    { id: "focus-06", theme: "focus", text: "Let the task become smaller than your attention, not larger." },
    { id: "focus-07", theme: "focus", text: "Depth starts with a decision to remain present." },
    { id: "focus-08", theme: "focus", text: "Settle into the work until the noise loses its claim on you." },
  ],
  consistency: [
    { id: "consistency-01", theme: "consistency", text: "Quiet repetition is still a form of strength." },
    { id: "consistency-02", theme: "consistency", text: "A dependable next step is enough to build a remarkable week." },
    { id: "consistency-03", theme: "consistency", text: "Keep the promise that only today can keep." },
    { id: "consistency-04", theme: "consistency", text: "Small returns, repeated honestly, become a powerful record." },
    { id: "consistency-05", theme: "consistency", text: "The work does not need spectacle. It needs your return." },
    { id: "consistency-06", theme: "consistency", text: "Make this session another vote for the person you are becoming." },
    { id: "consistency-07", theme: "consistency", text: "Reliable effort outlasts the mood that started it." },
    { id: "consistency-08", theme: "consistency", text: "Consistency is simply courage made repeatable." },
  ],
  clarity: [
    { id: "clarity-01", theme: "clarity", text: "Name the next move clearly, then give it your full attention." },
    { id: "clarity-02", theme: "clarity", text: "A precise beginning makes the rest of the work lighter." },
    { id: "clarity-03", theme: "clarity", text: "You do not need every answer—only the next honest action." },
    { id: "clarity-04", theme: "clarity", text: "Clarity grows when the next step is allowed to be simple." },
    { id: "clarity-05", theme: "clarity", text: "Make the task visible enough that you can begin without bargaining." },
    { id: "clarity-06", theme: "clarity", text: "A calm plan can carry more force than a rushed burst." },
    { id: "clarity-07", theme: "clarity", text: "Reduce the decision. Start the work that remains." },
    { id: "clarity-08", theme: "clarity", text: "The first clear instruction is often all your momentum needs." },
  ],
  recovery: [
    { id: "recovery-01", theme: "recovery", text: "Begin gently. A smaller step can still restore your rhythm." },
    { id: "recovery-02", theme: "recovery", text: "Lower the hurdle, not the standard of care you give yourself." },
    { id: "recovery-03", theme: "recovery", text: "A calm restart is still a restart." },
    { id: "recovery-04", theme: "recovery", text: "Choose the lightest useful task and let it rebuild trust." },
    { id: "recovery-05", theme: "recovery", text: "You can return to the work without demanding a perfect return." },
    { id: "recovery-06", theme: "recovery", text: "Make room for a focused ten minutes before asking for more." },
    { id: "recovery-07", theme: "recovery", text: "Recovery is progress when it helps you meet the next step." },
    { id: "recovery-08", theme: "recovery", text: "Start where your energy is, then let action do the rest." },
  ],
  calm: [
    { id: "calm-01", theme: "calm", text: "Slow the rush. The next useful action is still waiting for you." },
    { id: "calm-02", theme: "calm", text: "A quieter pace can make the work possible again." },
    { id: "calm-03", theme: "calm", text: "Set the pressure down. Keep only the next task in view." },
    { id: "calm-04", theme: "calm", text: "Calm is not retreat; it is how you choose the right next move." },
    { id: "calm-05", theme: "calm", text: "Let the noise pass. Your next deliberate minute still counts." },
    { id: "calm-06", theme: "calm", text: "You can work with care without carrying every demand at once." },
    { id: "calm-07", theme: "calm", text: "Settle the field, then choose one thing worth finishing." },
    { id: "calm-08", theme: "calm", text: "A measured beginning can be more powerful than a forced sprint." },
  ],
  resilience: [
    { id: "resilience-01", theme: "resilience", text: "You are allowed to begin again with more wisdom than before." },
    { id: "resilience-02", theme: "resilience", text: "Resistance is a signal, not a verdict. Take the next step anyway." },
    { id: "resilience-03", theme: "resilience", text: "The hard day is not the whole story. Make one useful mark on it." },
    { id: "resilience-04", theme: "resilience", text: "Return to the work in a way that you can sustain." },
    { id: "resilience-05", theme: "resilience", text: "Strength often looks like choosing a practical next move." },
    { id: "resilience-06", theme: "resilience", text: "You do not need a flawless day to build a capable life." },
    { id: "resilience-07", theme: "resilience", text: "Meet the friction with structure, patience, and one clear action." },
    { id: "resilience-08", theme: "resilience", text: "A steady return is stronger than an all-or-nothing promise." },
  ],
  first_steps: [
    { id: "first-steps-01", theme: "first_steps", text: "Every command begins with one small action you can actually take." },
    { id: "first-steps-02", theme: "first_steps", text: "Start the record with a task simple enough to finish today." },
    { id: "first-steps-03", theme: "first_steps", text: "The first honest session gives tomorrow something to build on." },
    { id: "first-steps-04", theme: "first_steps", text: "You do not need a history to begin; one focused block is enough." },
    { id: "first-steps-05", theme: "first_steps", text: "Open with a manageable win, then let the pattern reveal itself." },
    { id: "first-steps-06", theme: "first_steps", text: "Make the next task real. Progress can start there." },
    { id: "first-steps-07", theme: "first_steps", text: "Your first data point can also be your first act of discipline." },
    { id: "first-steps-08", theme: "first_steps", text: "Begin before you feel fully ready; the work will teach you the way." },
  ],
};

const allQuotes = Object.values(quotePool).flat();

function signalAverage(insight: WellbeingInsight, id: string) {
  return insight.signals.find((signal) => signal.id === id)?.average ?? 0;
}

export function getLaunchQuoteThemes(forecast: EmotionalPatternForecast, wellbeing: WellbeingInsight): LaunchQuoteTheme[] {
  if (!forecast.available && !wellbeing.available) return ["first_steps", "clarity", "consistency"];

  const highLoad = signalAverage(wellbeing, "stress") >= 3.6
    || signalAverage(wellbeing, "distraction") >= 3.6
    || signalAverage(wellbeing, "friction") >= 3.6;
  const strongFocus = signalAverage(wellbeing, "focus") >= 3.7;
  const strongClarity = signalAverage(wellbeing, "clarity") >= 3.7;
  const supportiveBalance = wellbeing.available && wellbeing.balanceScore >= 68;
  const easingTrend = wellbeing.available && wellbeing.trend.direction === "easing";

  if (highLoad || easingTrend || forecast.outlook === "fragile" || forecast.outlook === "recovery") {
    return ["recovery", "calm", "resilience"];
  }
  if (forecast.outlook === "momentum" || (supportiveBalance && wellbeing.trend.direction === "rising")) {
    return ["momentum", strongFocus ? "focus" : "consistency", strongClarity ? "clarity" : "focus"];
  }
  if (forecast.outlook === "steady" || supportiveBalance) {
    return ["consistency", strongClarity ? "clarity" : "focus", "momentum"];
  }
  return ["clarity", "resilience", "first_steps"];
}

export function selectLaunchQuote({
  forecast,
  wellbeing,
  recentQuoteIds = [],
  seed = Date.now(),
}: {
  forecast: EmotionalPatternForecast;
  wellbeing: WellbeingInsight;
  recentQuoteIds?: string[];
  seed?: number;
}): LaunchQuote {
  const contextualQuotes = getLaunchQuoteThemes(forecast, wellbeing).flatMap((theme) => quotePool[theme]);
  const unseenContextualQuotes = contextualQuotes.filter((quote) => !recentQuoteIds.includes(quote.id));
  const unseenAnyQuote = allQuotes.filter((quote) => !recentQuoteIds.includes(quote.id));
  const candidates = unseenContextualQuotes.length ? unseenContextualQuotes : unseenAnyQuote.length ? unseenAnyQuote : contextualQuotes;
  const safeIndex = Math.abs(Math.floor(seed)) % candidates.length;
  return candidates[safeIndex] ?? quotePool.first_steps[0];
}

export function parseLaunchQuoteHistory(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return Array.from(new Set(parsed.filter((item): item is string => typeof item === "string"))).slice(-LAUNCH_QUOTE_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

export function nextLaunchQuoteHistory(history: string[], quoteId: string): string[] {
  return Array.from(new Set([...history.filter((id) => id !== quoteId), quoteId])).slice(-LAUNCH_QUOTE_HISTORY_LIMIT);
}
