import type { EmotionalPatternForecast, ForecastOutlook, Reflection } from "./focus-command";



export interface ForecastMotivationMessage {
  
  headline: string;
  
  detail: string;
  
}



type LibraryMessage = ForecastMotivationMessage & { id: string };



const library = (prefix: string, headlines: string[], details: string[]): LibraryMessage[] => (
  
  headlines.map((headline, index) => ({ id: `${prefix}-${index}`, headline, detail: details[index]! }))
  
);



const FORECAST_LIBRARY: Record<ForecastOutlook, LibraryMessage[]> = {
  
  momentum: library("momentum", [
    
    "Your focus is finding its current.", "Clarity is giving effort a direction.", "Drive is meeting a workable pace.", "A calmer rhythm is supporting progress.", "Energy and attention are moving together.",
    
    "The supportive signals are holding.", "Quiet confidence is appearing.", "Your emotional signals are aligning.", "The next focus window looks open.", "Momentum is present; protect its edges.",
    
  ], [
    
    "The recent emotional pattern supports a defined block while attention still feels available.", "Use the steadier emotional window for one meaningful step before the pattern changes.", "Your reflections suggest momentum stays useful when the next action remains specific.", "Let the current emotional balance guide a focused start instead of adding pressure.", "The next session can build on this supportive pattern with one clear point of entry.",
    
    "Protect the conditions that recently made focus feel more natural and less forced.", "A deliberate next block can use the present focus without turning it into a demand.", "Keep the next step narrow enough for motivation and clarity to stay together.", "Recent reflections point toward a usable balance between inner drive and mental space.", "A little less switching and friction can help the current lift remain steady.",
    
  ]),
  
  steady: library("steady", [
    
    "Your emotional ground is holding steady.", "Clarity is giving the day a stable center.", "A calm pace is working in your favor.", "Your pattern has found an anchor.", "The emotional signals are broadly balanced.",
    
    "Attention is settling into a reliable rhythm.", "There is useful steadiness beneath the noise.", "Your recent pattern supports staying the course.", "Quiet consistency is becoming visible.", "Your center is easier to return to.",
    
  ], [
    
    "A consistent, well-defined session fits the balance you have recently been building.", "Keep the next step simple enough for the present emotional balance to remain intact.", "Recent reflections suggest steady effort is more useful than forcing a surge.", "Return to the kind of small, direct start that kept focus and pressure in balance.", "Use this stable base for a clear task rather than spending the window deciding.",
    
    "A focused block with few moving parts can reinforce what the reflections already show.", "Let an uncomplicated next action preserve the emotional room you currently have.", "One measured session can keep clarity, motivation, and pressure from drifting apart.", "The emotional data favors a repeatable pace over a heavier push right now.", "Choose a bounded task and let the existing balance do more of the work.",
    
  ]),
  
  recovery: library("recovery", [
    
    "A gentler start suits the current pattern.", "Clarity can return through a smaller step.", "Your emotional pattern is asking for a reset.", "Give the next block more breathing space.", "Energy may respond to a lighter entry.",
    
    "Focus can rebuild without forcing intensity.", "The next useful move can be quiet and small.", "A kinder pace is still a real direction.", "Restoring the conditions matters first.", "Your rhythm can return one step at a time.",
    
  ], [
    
    "Recent reflection signals suggest beginning with a small, clear action before adding demand.", "Reduce the number of decisions around the next session and let focus rebuild gradually.", "A lower-pressure entry can create room for motivation and attention to recover.", "Recent load signals favor a calm beginning with fewer distractions and less friction.", "Choose an action that feels easy to begin, then let the emotional pattern guide what follows.",
    
    "A short, defined session is more aligned with the current emotional recovery signal.", "Lowering friction first gives clarity and motivation a better chance to return together.", "Your reflections suggest reducing pr
























