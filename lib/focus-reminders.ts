import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const CHANNEL_ID = "focus-command-reminders";

async function prepareNotifications(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Focus Command reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 150, 80, 150],
      lightColor: "#39C6E8",
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
}

export async function enableFocusReminders(): Promise<boolean> {
  try {
    return await prepareNotifications();
  } catch {
    return false;
  }
}

export async function scheduleRevisionReminder(title: string, dueAt: string): Promise<string | null> {
  const allowed = await prepareNotifications();
  if (!allowed) return null;
  const date = new Date(dueAt);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return null;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Revision due · Focus Command",
      body: `Review ${title} to protect your recall chain.`,
      data: { url: "/revisions" },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID },
  });
}

export async function scheduleMultiplierReminder(rewardTitle: string): Promise<string | null> {
  const allowed = await prepareNotifications();
  if (!allowed) return null;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Multiplier active · Focus Command",
      body: `${rewardTitle} is active today. Put it to work in your next mission.`,
      data: { url: "/(tabs)/rewards" },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: tomorrow, channelId: CHANNEL_ID },
  });
}
