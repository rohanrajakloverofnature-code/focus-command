import { readFileSync } from "node:fs";

import { join } from "node:path";

import { describe, expect, it } from "vitest";



const focusCommandSource = readFileSync(join(process.cwd(), "lib", "focus-command.tsx"), "utf8");

const missionSource = readFileSync(join(process.cwd(), "app", "mission", "[id].tsx"), "utf8");

const missionResultSource = readFileSync(join(process.cwd(), "app", "mission-result", "[id].tsx"), "utf8");



describe("Mission touch-to-action latency contracts", () => {
  
  it("commits the completion immediately while deferring only subscriber follow-up for the confirmed mission-result transition", () => {
    
    const finishMissionStart = focusCommandSource.indexOf("const finishMission = useCallback");
    
    const finishMissionSource = focusCommandSource.slice(finishMissionStart, focusCommandSource.indexOf("const completeRevision", finishMissionStart));
    

    
    expect(focusCommandSource).toContain("const deferNextStateNotification = useRef(false)");
    
    expect(focusCommandSource).toContain("deferredNotificationTimer.current = setTimeout(notifySubscribers, 0)");
    
    expect(focusCommandSource).toContain("options?: { deferSubscriberNotification?: boolean }");
    
    expect(finishMissionSource).toContain("{ deferSubscriberNotification: true }");
    
    expect(finishMissionSource).toContain("return withQueuedOperation({");
    
    expect(focusCommandSource).toContain("pendingPersistence.current = state");
    
  });
  

  
  it("begins the existing result navigation before optional success audio and reminder preparation", () => {
    
    const navigationIndex = missionSource.indexOf("router.replace({ pathname: \"/mission-result/[id]\"");
    
    const deferredAudioIndex = missionSource.indexOf("void playFocusSuccessCue(soundEnabled, missionWinSound)");
    
    const deferredReminderIndex = missionSource.indexOf("void scheduleAchievementRecap(mission.title, notificationRules, achievementRecapSound)");
    

    
    expect(missionSource).toContain("requestAnimationFrame(() => {");
    
    expect(navigationIndex).toBeGreaterThan(-1);
    
    expect(deferredAudioIndex).toBeGreaterThan(navigationIndex);
    
    expect(deferredReminderIndex).toBeGreaterThan(navigationIndex);
    
    expect(missionSource).not.toContain("await playFocusSuccessCue(soundEnabled, missionWinSound)");
    
    expect(missionSource).not.toContain("await scheduleAchievementRecap(mission.title, notificationRules, achievementRecapSound)");
    
  });
  

  
  it("keeps a successfully queued result locked against rapid repeat confirmation while failed submissions remain retryable", () => {
    
    expect(missionSource).toContain("let navigationQueued = false");
    
    expect(missionSource).toContain("navigationQueued = true");
    
    expect(missionSource).toContain("if (!navigationQueued) {");
    
    expect(missionSource).toContain("submissionLock.current = false");
    
  });
  

  
  it("keeps the result route behind an exact snapshot rather than a full provider subscription", () => {
    
    expect(missionResultSource).toContain("type MissionResultSnapshot");
    
    expect(missionResultSource).toContain("useFocusCommandSelector((state) => selectMissionResultSnapshot(state, id, completionId), hasSameMissionResultSnapshot)");
    
    expect(missionResultSource).toContain("const fallbackCompletion = completionId && !completion");
    
    expect(missionResultSource).toContain("useFocusCommandReady()");
    
    expect(missionResultSource).not.toContain("useFocusCommand()");
    
  });
  
});









































