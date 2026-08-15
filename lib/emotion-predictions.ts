import type { EmotionalPatternForecast, Reflection } from "./focus-command";



export const PREDICTION_LABEL_MAX_LENGTH = 11;



export type PredictionIconName =
  
  | "star.fill" | "target" | "flame.fill" | "shield.fill" | "cloud.fill" | "circle.grid.cross.fill"

  | "bolt.fill" | "timer" | "arrow.clockwise" | "figure.run" | "book.closed.fill" | "gift.fill";



export interface EmotionPrediction {
  
  id: string;
  
  label: string;
  
  icon: PredictionIconName;
  
  accent: string;
  
  track: string;
  
}



type TrackId =
  
  | "flow" | "focus" | "steady" | "clarity" | "return" | "energy" | "protect"

  | "friction" | "focus_recover" | "clarity_recover" | "drive" | "stress" | "noise"

  | "shift" | "warming" | "mixed";



type Track = { title: string; readings: EmotionPrediction[] };



function makeTrack(id: TrackId, title: string, icons: [PredictionIconName, PredictionIconName, PredictionIconName], accent: string, labels: [string, string, string]): Track {
  
  return {
    
    title,
    
    readings: labels.map((label, index) => ({ id: `${id}-${index}`, label, icon: icons[index]!, accent, track: title })),
    
  };
  
}



const TRACKS: Record<TrackId, Track> = {
  
  flow: makeTrack("flow", "Flow momentum", ["star.fill", "target", "flame.fill"], "#B79CFF", ["FLOW AHEAD", "CLEAR PATH", "MOMENTUM UP"]),
  
  focus: makeTrack("focus", "Focused momentum", ["target", "timer", "bolt.fill"], "#7DD3FC", ["FOCUS SET", "SHARP PATH", "QUIET DRIVE"]),
  
  steady: makeTrack("steady", "Steady balance", ["shield.fill", "cloud.fill", "circle.grid.cross.fill"], "#8DE7C7", ["STEADY NOW", "CALM PACE", "EVEN KEEL"]),
  
  clarity: makeTrack("clarity", "Stable clarity", ["book.closed.fill", "target", "shield.fill"], "#93C5FD", ["CRISP ROUTE", "CLEAR ROUTE", "CENTERED"]),
  
  return: makeTrack("return", "Recovery return", ["cloud.fill", "arrow.clockwise", "gift.fill"], "#C4B5FD", ["CALM RETURN", "EASING", "SOFT LAND"]),
  
  energy: makeTrack("energy", "Energy recovery", ["bolt.fill", "timer", "flame.fill"], "#FCD34D", ["GENTLE", "SLOW BUILD", "RESTORE"]),
  
  protect: makeTrack("protect", "Protective reset", ["shield.fill", "target", "cloud.fill"], "#FDA4AF", ["LOWER LOAD", "GUARD FOCUS", "QUIET FIRST"]),
  
  friction: makeTrack("friction", "Friction guard", ["figure.run", "shield.fill", "arrow.clockwise"], "#F9A8D4", ["CLEAR SPACE", "BLOCK NOISE", "REMOVE DRAG"]),
  
  focus_recover: makeTrack("focus_recover", "Focus recovery", ["circle.grid.cross.fill", "target", "star.fill"], "#A5B4FC", ["FOCUS BACK", "RECENTER", "ONE STEP"]),
  
  clarity_recover: makeTrack("clarity_recover", "Clarity recovery", ["book.closed.fill", "target", "timer"], "#67E8F9", ["CLARITY UP", "PATH OPENS", "SIMPLE NEXT"]),
  
  drive: makeTrack("drive", "Motivation build", ["flame.fill", "bolt.fill", "star.fill"], "#FDBA74", ["DRIVE BACK", "INNER SPARK", "PURPOSE"]),
  
  stress: makeTrack("stress", "Stress easing", ["cloud.fill", "shield.fill", "timer"], "#86EFAC", ["STRESS EASE", "LOAD EASES", "BREATHE"]),
  
  noise: makeTrack("noise", "Distraction easing", ["circle.grid.cross.fill", "cloud.fill", "target"], "#D8B4FE", ["NOISE EASES", "MIND CLEARS", "LESS PULL"]),
  
  shift: makeTrack("shift", "Emotional shift", ["arrow.clockwise", "cloud.fill", "star.fill"], "#5EEAD4", ["BETTER NOW", "CALM LANDS", "GOOD TURN"]),
  
  warming: makeTrack("warming", "Pattern warming", ["timer", "circle.grid.cross.fill", "book.closed.fill"], "#C4B5FD", ["WARMING UP", "SIGNALS UP", "READ AHEAD"]),
  
  mixed: makeTrack("mixed", "Mixed pattern", ["book.closed.fill", "cloud.fill", "star.fill"], "#CBD5E1", ["READ GENTLY", "HOLD LIGHT", "CURIOUS"]),
  
};



export const EMOTION_PREDICTION_TRACK_COUNT = Object.keys(TRACKS).length;

export const EMOTION_PREDICTION_LIBRARY_COUNT = Object.values(TRACKS).flatMap((track) => trac





























