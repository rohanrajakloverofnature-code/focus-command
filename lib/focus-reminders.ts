import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { NotificationRules } from "@/lib/focus-command";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const CHANNEL_ID = "focus-command-reminders";
type ReminderKind = "daily_mission" | "revision" | "multiplier" | "achievement";

function timeParts(value: string, fallback = "09:00") {
  const [hourText, minuteText] = (value || fallback).split(":");
  const hour = Math.min(23, Math.max(0, Number(hourText)));
  const minute = Math.min(59, Math.max(0, Number(minuteText)));
  return { hour: Number.isFinite(hour) ? hour : 9, minute: Number.isFinite(minute) ? minute : 0 };
}

async function prepareNotifications(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Focus Command reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 150, 80, 150],
      lightColor: "#39C6E8",
      sound: "default",
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
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

export async function enableFocusReminders(): Promise<boolean> {
  try {
    return await prepareNotifications();
  } catch {
    return false;
  }
}

export async function configureDailyMissionReminder(enabled: boolean, time: string, notificationSoundEnabled = true): Promise<string | null> {
  try {
    await cancelKind("daily_mission");
    if (!enabled || !await prepareNotifications()) return null;
    const { hour, minute } = timeParts(time);
    const content = message("daily_mission", "");
    return Notifications.scheduleNotificationAsync({
      content: { ...content, sound: notificationSoundEnabled ? "default" : undefined, data: { ...content, kind: "daily_mission" } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL_ID },
    });
  } catch {
    return null;
  }
}

export async function scheduleRevisionReminder(title: string, dueAt: string, rules: NotificationRules, notificationSoundEnabled = true): Promise<string | null> {
  if (!rules.revisionEnabled) return null;
  try {
    const allowed = await prepareNotifications();
    if (!allowed) return null;
    const date = new Date(dueAt);
    const { hour, minute } = timeParts(rules.revisionTime);
    date.setHours(hour, minute, 0, 0);
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return null;
    const content = message("revision", title);
    return Notifications.scheduleNotificationAsync({
      content: { ...content, sound: notificationSoundEnabled ? "default" : undefined, data: { ...content, kind: "revision" } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID },
    });
  } catch {
    return null;
  }
}

export async function scheduleMultiplierReminder(rewardTitle: string, rules: NotificationRules, notificationSoundEnabled = true): Promise<string | null> {
  if (!rules.multiplierEnabled) return null;
  try {
    const allowed = await prepareNotifications();
    if (!allowed) return null;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const { hour, minute } = timeParts(rules.dailyMissionTime, "08:00");
    tomorrow.setHours(hour, minute, 0, 0);
    const content = message("multiplier", rewardTitle);
    return Notifications.scheduleNotificationAsync({
      content: { ...content, sound: notificationSoundEnabled ? "default" : undefined, data: { ...content, kind: "multiplier" } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: tomorrow, channelId: CHANNEL_ID },
    });
  } catch {
    return null;
  }
}

export async function scheduleAchievementRecap(title: string, rules: NotificationRules, notificationSoundEnabled = true): Promise<string | null> {
  if (!rules.achievementEnabled) return null;
  try {
    const allowed = await prepareNotifications();
    if (!allowed) return null;
    const content = message("achievement", title);
    return Notifications.scheduleNotificationAsync({
      content: { ...content, sound: notificationSoundEnabled ? "default" : undefined, data: { ...content, kind: "achievement" } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, repeats: false, channelId: CHANNEL_ID },
    });
  } catch {
    return null;
  }
}
