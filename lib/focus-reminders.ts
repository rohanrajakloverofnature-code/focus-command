import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { NotificationRules, SoundRoleId, SoundRoleSettings } from "@/lib/focus-command";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type ReminderKind = "daily_mission" | "revision" | "multiplier" | "achievement";

type ReminderSoundRole = Extract<SoundRoleId, "dailyReminder" | "revisionReminder" | "multiplierReminder" | "achievementReminder">;

const SOUND_ROLE_FOR_KIND: Record<ReminderKind, ReminderSoundRole> = {
  daily_mission: "dailyReminder",
  revision: "revisionReminder",
  multiplier: "multiplierReminder",
  achievement: "achievementReminder",
};

const GENERAL_CHANNEL_ID = "focus-command-general";

function timeParts(value: string, fallback = "09:00") {
  const [hourText, minuteText] = (value || fallback).split(":");
  const hour = Math.min(23, Math.max(0, Number(hourText)));
  const minute = Math.min(59, Math.max(0, Number(minuteText)));
  return { hour: Number.isFinite(hour) ? hour : 9, minute: Number.isFinite(minute) ? minute : 0 };
}

function soundSignature(sound: SoundRoleSettings) {
  const source = sound.enabled ? sound.customUri ?? `bundled-${sound.style}` : "silent";
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  return hash.toString(36);
}

function channelName(kind: ReminderKind) {
  if (kind === "daily_mission") return "Daily mission briefings";
  if (kind === "revision") return "Revision reminders";
  if (kind === "multiplier") return "Multiplier activation";
  return "Achievement recaps";
}

async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(GENERAL_CHANNEL_ID, {
      name: "Focus Command notifications",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 150, 80, 150],
      lightColor: "#A78BFA",
      sound: "default",
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
}

async function prepareNotification(kind: ReminderKind, sound: SoundRoleSettings): Promise<{ allowed: boolean; channelId?: string }> {
  const allowed = await ensureNotificationPermission();
  if (!allowed || Platform.OS !== "android") return { allowed };
  const channelId = `focus-command-${kind}-${soundSignature(sound)}`;
  try {
    await Notifications.setNotificationChannelAsync(channelId, {
      name: channelName(kind),
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 150, 80, 150],
      lightColor: "#A78BFA",
      sound: sound.enabled ? sound.customUri ?? "default" : null,
    });
    return { allowed, channelId };
  } catch {
    return { allowed, channelId: GENERAL_CHANNEL_ID };
  }
}

async function cancelKind(kind: ReminderKind) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter((item) => item.content.data?.kind === kind).map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
}

function message(kind: ReminderKind, title: string) {
  if (kind === "daily_mission") return { title: "Command check-in · Focus Command", body: "Choose one clear mission and protect the next focused block.", url: "/missions?compose=1" };
  if (kind === "revision") return { title: "Revision due · Focus Command", body: `Review ${title} to protect your recall chain.`, url: "/revisions" };
  if (kind === "multiplier") return { title: "Multiplier active · Focus Command", body: `${title} is active today. Put it to work in your next mission.`, url: "/(tabs)/rewards" };
  return { title: "Achievement logged · Focus Command", body: `${title} is now part of your command history.`, url: "/(tabs)/dashboard" };
}

function contentSound(sound: SoundRoleSettings) {
  return sound.enabled ? sound.customUri ?? "default" : undefined;
}

export async function refreshScheduledReminderSounds(soundRoles: Record<SoundRoleId, SoundRoleSettings>): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const item of scheduled) {
      const kind = item.content.data?.kind;
      if (kind !== "daily_mission" && kind !== "revision" && kind !== "multiplier" && kind !== "achievement") continue;
      const role = SOUND_ROLE_FOR_KIND[kind];
      const setting = soundRoles[role];
      const prepared = await prepareNotification(kind, setting);
      if (!prepared.allowed || !item.trigger) continue;
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
      const trigger = Platform.OS === "android" && typeof item.trigger === "object"
        ? { ...item.trigger, channelId: prepared.channelId }
        : item.trigger;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: item.content.title ?? undefined,
          subtitle: item.content.subtitle ?? undefined,
          body: item.content.body ?? undefined,
          data: { ...item.content.data, kind, soundRole: role },
          sound: contentSound(setting),
        },
        trigger: trigger as Notifications.NotificationTriggerInput,
      });
    }
  } catch {
    // A stale platform notification must not block the setting itself from saving.
  }
}

export async function enableFocusReminders(): Promise<boolean> {
  try {
    return await ensureNotificationPermission();
  } catch {
    return false;
  }
}

export async function configureDailyMissionReminder(enabled: boolean, time: string, notificationSound: SoundRoleSettings): Promise<string | null> {
  try {
    await cancelKind("daily_mission");
    if (!enabled) return null;
    const prepared = await prepareNotification("daily_mission", notificationSound);
    if (!prepared.allowed) return null;
    const { hour, minute } = timeParts(time);
    const content = message("daily_mission", "");
    return Notifications.scheduleNotificationAsync({
      content: { ...content, sound: contentSound(notificationSound), data: { ...content, kind: "daily_mission", soundRole: "dailyReminder" } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: prepared.channelId },
    });
  } catch {
    return null;
  }
}

export async function scheduleRevisionReminder(title: string, dueAt: string, rules: NotificationRules, notificationSound: SoundRoleSettings): Promise<string | null> {
  if (!rules.revisionEnabled) return null;
  try {
    const prepared = await prepareNotification("revision", notificationSound);
    if (!prepared.allowed) return null;
    const date = new Date(dueAt);
    const { hour, minute } = timeParts(rules.revisionTime);
    date.setHours(hour, minute, 0, 0);
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return null;
    const content = message("revision", title);
    return Notifications.scheduleNotificationAsync({
      content: { ...content, sound: contentSound(notificationSound), data: { ...content, kind: "revision", soundRole: "revisionReminder" } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: prepared.channelId },
    });
  } catch {
    return null;
  }
}

export async function scheduleMultiplierReminder(rewardTitle: string, rules: NotificationRules, notificationSound: SoundRoleSettings): Promise<string | null> {
  if (!rules.multiplierEnabled) return null;
  try {
    const prepared = await prepareNotification("multiplier", notificationSound);
    if (!prepared.allowed) return null;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const { hour, minute } = timeParts(rules.dailyMissionTime, "08:00");
    tomorrow.setHours(hour, minute, 0, 0);
    const content = message("multiplier", rewardTitle);
    return Notifications.scheduleNotificationAsync({
      content: { ...content, sound: contentSound(notificationSound), data: { ...content, kind: "multiplier", soundRole: "multiplierReminder" } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: tomorrow, channelId: prepared.channelId },
    });
  } catch {
    return null;
  }
}

export async function scheduleAchievementRecap(title: string, rules: NotificationRules, notificationSound: SoundRoleSettings): Promise<string | null> {
  if (!rules.achievementEnabled) return null;
  try {
    const prepared = await prepareNotification("achievement", notificationSound);
    if (!prepared.allowed) return null;
    const content = message("achievement", title);
    return Notifications.scheduleNotificationAsync({
      content: { ...content, sound: contentSound(notificationSound), data: { ...content, kind: "achievement", soundRole: "achievementReminder" } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, repeats: false, channelId: prepared.channelId },
    });
  } catch {
    return null;
  }
}
