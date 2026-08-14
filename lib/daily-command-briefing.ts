import {
  getCurrentCombo,
  getDailyProgress,
  getEnergy,
  getPendingRevisions,
  toLocalDate,
  type FocusState,
  type Mission,
} from "./focus-command";

export type DailyCommandPriorityKind = "active_mission" | "due_mission" | "revision" | "boss" | "mission_board" | "deploy";

export interface DailyCommandBriefing {
  greeting: string;
  localTime: string;
  openMissionCount: number;
  dailyTarget: { earned: number; target: number };
  energyPercent: number;
  streakDays: number;
  priority: {
    kind: DailyCommandPriorityKind;
    title: string;
    detail: string;
    actionLabel: string;
    route: string;
  };
}

function missionRoute(mission: Mission): string {
  return `/mission/${mission.id}`;
}

function morningLine(hour: number, targetComplete: boolean, hasOpenMissions: boolean): string {
  if (targetComplete) return "Target secured. Choose the next decisive move.";
  if (!hasOpenMissions) return "Your board is clear. Set the next objective.";
  if (hour < 12) return "Build momentum before noon.";
  if (hour < 17) return "Protect the next focused block.";
  return "Close the day with intention.";
}

function getLocalClock(referenceIso: string, timeZone: string): { hour: number; label: string } {
  const reference = new Date(referenceIso);
  const numericParts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(reference);
  const hour = Number(numericParts.find((part) => part.type === "hour")?.value ?? 0);
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(reference);
  return { hour: Number.isFinite(hour) ? hour : 0, label };
}

function getPriority(state: FocusState, today: string): DailyCommandBriefing["priority"] {
  const activeMission = state.missions
    .filter((mission) => mission.status === "active" || mission.status === "paused")
    .sort((left, right) => {
      if (left.status !== right.status) return left.status === "active" ? -1 : 1;
      return String(left.startedAt ?? left.createdAt).localeCompare(String(right.startedAt ?? right.createdAt));
    })[0];
  if (activeMission) {
    const paused = activeMission.status === "paused";
    return {
      kind: "active_mission",
      title: activeMission.title,
      detail: paused ? "Mission paused — return when ready." : "Mission in progress — protect the focus block.",
      actionLabel: paused ? "Open mission" : "Resume mission",
      route: missionRoute(activeMission),
    };
  }

  const dueMission = state.missions
    .filter((mission) => mission.status === "planned" && Boolean(mission.dueAt) && (mission.dueAt as string).slice(0, 10) <= today)
    .sort((left, right) => String(left.dueAt).localeCompare(String(right.dueAt)))[0];
  if (dueMission) {
    return {
      kind: "due_mission",
      title: dueMission.title,
      detail: dueMission.dueAt?.slice(0, 10) === today ? "Due today." : "Past its due date.",
      actionLabel: "Open mission",
      route: missionRoute(dueMission),
    };
  }

  const pendingRevision = getPendingRevisions(state)[0];
  if (pendingRevision) {
    return {
      kind: "revision",
      title: `Review: ${pendingRevision.topic}`,
      detail: `${pendingRevision.subject} revision is due.`,
      actionLabel: "Review now",
      route: `/revisions?topic=${pendingRevision.id}`,
    };
  }

  const activeBoss = state.bosses
    .filter((boss) => boss.status === "active")
    .sort((left, right) => String(left.deadlineAt ?? "9999-12-31").localeCompare(String(right.deadlineAt ?? "9999-12-31")))[0];
  if (activeBoss) {
    return {
      kind: "boss",
      title: activeBoss.title,
      detail: activeBoss.deadlineAt ? "Active campaign with a deadline." : "Active campaign awaiting its next move.",
      actionLabel: "Open campaign",
      route: "/bosses",
    };
  }

  const plannedMission = state.missions.find((mission) => mission.status === "planned");
  if (plannedMission) {
    return {
      kind: "mission_board",
      title: "Choose your next mission",
      detail: `${state.missions.filter((mission) => mission.status === "planned").length} mission${state.missions.filter((mission) => mission.status === "planned").length === 1 ? "" : "s"} ready to deploy.`,
      actionLabel: "Open mission board",
      route: "/missions?filter=open",
    };
  }

  return {
    kind: "deploy",
    title: "Deploy your first mission",
    detail: "Set one clear objective for today.",
    actionLabel: "Deploy mission",
    route: "/missions?compose=1",
  };
}

/**
 * Derives a compact, fully offline Home briefing from the same state helpers that
 * power the existing mission, energy, daily-target, revision, and combo views.
 */
export function getDailyCommandBriefing(state: FocusState, referenceIso = new Date().toISOString()): DailyCommandBriefing {
  const referenceDate = toLocalDate(referenceIso, state.profile.timezone);
  const clock = getLocalClock(referenceIso, state.profile.timezone);
  const dailyTarget = getDailyProgress(state);
  const energy = getEnergy(state);
  const combo = getCurrentCombo(state, referenceDate);
  const openMissionCount = state.missions.filter((mission) => mission.status !== "completed").length;
  const streakDays = !state.combo.lastActiveDate || combo.missedDays >= 3
    ? 0
    : Math.max(0, state.combo.qualifyingStreak - combo.missedDays);

  return {
    greeting: morningLine(clock.hour, dailyTarget.progress >= 1, openMissionCount > 0),
    localTime: clock.label,
    openMissionCount,
    dailyTarget: { earned: dailyTarget.earned, target: dailyTarget.target },
    energyPercent: energy.maximum > 0 ? Math.round((energy.remaining / energy.maximum) * 100) : 0,
    streakDays,
    priority: getPriority(state, referenceDate),
  };
}
