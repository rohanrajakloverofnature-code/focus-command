import { Redirect } from "expo-router";

export default function ActivityCalendarCompatibilityRoute() {
  return <Redirect href="/missions?mode=calendar" />;
}
