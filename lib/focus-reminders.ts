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
const CUSTOM_AUDIO_CHANNEL_ID = "focus-command-custom-audio-reminders";
type ReminderKind = "daily_mission" | "revision" | "multiplier" | "achievement";
type NotificationSoundSelection = { enabled: boolean; customUri: string | null };

function nativeNotificationSound(selection: NotificationSoundSelection) {
  // Runtime document files cannot be registered as native iOS/Android notification sounds.
  // Foreground delivery is handled by FocusNotificationAudioBridge; background delivery must not silently fall back to the default tone.
  return selection.enabled && !selection.customUri ? "default" : undefined;
}

function notificationChannelId(selection: NotificationSoundSelection) {
  return selection.customUri ? CUSTOM_AUDIO_CHANNEL_ID : CHANNEL_ID;
}

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
      lightColor: "#A78BFA",
      sound: "default",
    });
    await Notifications.setNotificationChannelAsync(CUSTOM_AUDIO_CHANNEL_ID, {
      name: "Focus Command custom-audio reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 150, 80, 150],
      lightColor: "#A78BFA",
      sound: null,
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

type ReminderSoundRoles = {
  dailyMissionReminder: NotificationSoundSelection;
  revisionReminder: NotificationSoundSelection;
  multiplierReminder: NotificationSoundSelection;
  achievementRecap: NotificationSoundSelection;
};

function soundForKind(kind: ReminderKind, roles: ReminderSoundRoles) {
  if (kind === "daily_mission") return roles.dailyMissionReminder;
  if (kind === "revision") return roles.revisionReminder;
  if (kind === "multiplier") return roles.multiplierReminder;
  return roles.achievementRecap;
}

function message(kind: ReminderKind, title: string) {
  if (kind === "daily_mission") return { title: "Command check-in · Focus Command", body: "Choose one clear mission and protect the next focused block.", url: "/missions?compose=1" };
  if (kind === "revision") return { title: "Revision due · Focus Command", body: `Review ${title} to protect your recall chain.`, url: "/revisions" };
  if (kind === "multiplier") return { title: "Multiplier active · Focus Command", body: `${title} is active today. Put it to work in your next mission.`, url: "/(tabs)/rewards" };
  return { title: "Achievement logged · Focus Command", body: `${title} is now part of your command history.`, url: "/(tabs)/dashboard" };
}

export async function refreshScheduledReminderSounds(roles: ReminderSoundRoles): Promise<void> {
  try {
    if (!await prepareNotifications()) return;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(scheduled.map(async (item) => {
      const kind = item.content.data?.kind;
      if (kind !== "daily_mission" && kind !== "revision" && kind !== "multiplier" && kind !== "achievement") return;
      const selection = soundForKind(kind, roles);
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: item.content.title ?? undefined,
          subtitle: item.content.subtitle ?? undefined,
          body: item.content.body ?? undefined,
          data: item.content.data ?? {},
          categoryIdentifier: item.content.categoryIdentifier ?? undefined,
          badge: item.content.badge ?? undefined,
          sound: nativeNotificationSound(selection),
        },
        trigger: { ...(item.trigger as object), channelId: notificationChannelId(selection) } as Notifications.NotificationTriggerInput,
      });
    }));
  } catch {
    // Existing reminders are best-effort refreshed; the next newly scheduled reminder always uses the latest role.
  }
}

export async function enableFocusReminders(): Promise<boolean> {
  try {
    return await prepareNotifications();
  } catch {
    return false;
  }
}

export async function configureDailyMissionReminder(enabled: boolean, time: string, notificationSound: NotificationSoundSelection): Promise<string | null> {
  try {
    await cancelKind("daily_mission");
    if (!enabled || !await prepareNotifications()) return null;
    const { hour, minute } = timeParts(time);
    const content = message("daily_mission", "");
    return Notifications.scheduleNotificationAsync({
      content: { ...content, sound: nativeNotificationSound(notificationSound), data: { ...content, kind: "daily_mission" } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: notificationChannelId(notificationSound) },
    });
  } catch {
    return null;
  }
}

export async function scheduleRevisionReminder(title: string, dueAt: string, rules: NotificationRules, notificationSound: NotificationSoundSelection): Promise<string | null> {
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
      content: { ...content, sound: nativeNotificationSound(notificationSound), data: { ...content, kind: "revision" } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: notificationChannelId(notificationSound) },
    });
  } catch {
    return null;
  }
}

export async function scheduleMultiplierReminder(rewardTitle: string, rules: NotificationRules, notificationSound: NotificationSoundSelection): Promise<string | null> {
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
      content: { ...content, sound: nativeNotificationSound(notificationSound), data: { ...content, kind: "multiplier" } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: tomorrow, channelId: notificationChannelId(notificationSound) },
    });
  } catch {
    return null;
  }
}

export async function scheduleAchievementRecap(title: string, rules: NotificationRules, notificationSound: NotificationSoundSelection): Promise<string | null> {
  if (!rules.achievementEnabled) return null;
  try {
    const allowed = await prepareNotifications();
    if (!allowed) return null;
    const content = message("achievement", title);
    return Notifications.scheduleNotificationAsync({
      content: { ...content, sound: nativeNotificationSound(notificationSound), data: { ...content, kind: "achievement" } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, repeats: false, channelId: notificationChannelId(notificationSound) },
    });
  } catch {
    return null;
  }
}
