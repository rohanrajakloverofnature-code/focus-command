import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { compareLocalDates, formatMonthLabel, formatReadableLocalDate, isIsoLocalDate, localDateParts, localDateFromParts, monthGrid } from "@/lib/calendar-date";

type CalendarDatePickerProps = {
  mode: "single" | "range";
  startDate: string;
  endDate?: string;
  onChange: (startDate: string, endDate?: string) => void;
  optionalEndDate?: boolean;
};

function todayLocalDate() {
  return new Date().toISOString().slice(0, 10);
}

export function CalendarDatePicker({ mode, startDate, endDate, onChange, optionalEndDate = false }: CalendarDatePickerProps) {
  const colors = useColors();
  const initialMonth = isIsoLocalDate(startDate) ? startDate : todayLocalDate();
  const [monthDate, setMonthDate] = useState(initialMonth);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const days = useMemo(() => monthGrid(monthDate), [monthDate]);
  const { year, month } = localDateParts(monthDate);
  const goMonth = (delta: number) => setMonthDate(localDateFromParts(year, month + delta, 1));
  const selectDay = (date: string) => {
    if (!date) return;
    if (mode === "single") {
      onChange(date);
      return;
    }
    if (!rangeStart || (endDate && rangeStart === startDate)) {
      setRangeStart(date);
      onChange(date, optionalEndDate ? "" : date);
      return;
    }
    if (compareLocalDates(date, rangeStart) < 0) {
      setRangeStart(date);
      onChange(date, optionalEndDate ? "" : date);
      return;
    }
    onChange(rangeStart, date);
    setRangeStart(null);
  };
  const selectedStart = rangeStart ?? startDate;
  const isSelected = (date: string) => date && (date === selectedStart || date === endDate || (Boolean(endDate) && date > selectedStart && date < (endDate ?? selectedStart)));

  return <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.background }]}>
    <View style={styles.monthHeader}>
      <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => goMonth(-1)} style={[styles.navButton, { borderColor: colors.border }]}><Text style={[styles.navText, { color: colors.primary }]}>‹</Text></Pressable>
      <Text style={[styles.monthLabel, { color: colors.foreground }]}>{formatMonthLabel(monthDate)}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => goMonth(1)} style={[styles.navButton, { borderColor: colors.border }]}><Text style={[styles.navText, { color: colors.primary }]}>›</Text></Pressable>
    </View>
    <View style={styles.weekRow}>{["S", "M", "T", "W", "T", "F", "S"].map((label, index) => <Text key={`${label}-${index}`} style={[styles.weekLabel, { color: colors.muted }]}>{label}</Text>)}</View>
    <View style={styles.grid}>{days.map((date, index) => <Pressable key={`${date || "blank"}-${index}`} disabled={!date} onPress={() => selectDay(date)} accessibilityRole={date ? "button" : undefined} accessibilityLabel={date ? formatReadableLocalDate(date) : undefined} style={[styles.day, { borderColor: colors.border }, date && isSelected(date) ? { backgroundColor: `${colors.primary}28`, borderColor: colors.primary } : null]}><Text style={[styles.dayText, { color: date ? isSelected(date) ? colors.primary : colors.foreground : "transparent" }]}>{date ? Number(date.slice(8, 10)) : "0"}</Text></Pressable>)}</View>
    <View style={styles.selectionRow}>
      <Text style={[styles.selectionText, { color: colors.muted }]}>{mode === "single" ? `Selected: ${formatReadableLocalDate(startDate)}` : `Start: ${formatReadableLocalDate(selectedStart)}${endDate ? ` · End: ${formatReadableLocalDate(endDate)}` : ""}`}</Text>
      {mode === "range" && rangeStart ? <Text style={[styles.selectionHint, { color: colors.primary }]}>Choose the end date</Text> : null}
    </View>
    {mode === "range" && optionalEndDate && endDate ? <Pressable onPress={() => { setRangeStart(null); onChange(startDate, ""); }}><Text style={[styles.clearText, { color: colors.warning }]}>Clear end date</Text></Pressable> : null}
  </View>;
}

export function CalendarDateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  return <View style={styles.fieldWrap}>
    <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`Choose ${label}`} onPress={() => setOpen((current) => !current)} style={[styles.fieldButton, { borderColor: open ? colors.primary : colors.border, backgroundColor: colors.background }]}><Text style={[styles.fieldValue, { color: value ? colors.foreground : colors.muted }]}>{value ? formatReadableLocalDate(value) : "Choose a date"}</Text><Text style={[styles.fieldAction, { color: colors.primary }]}>{open ? "CLOSE" : "CALENDAR"}</Text></Pressable>
    {open ? <CalendarDatePicker mode="single" startDate={value} onChange={(date) => { onChange(date); setOpen(false); }} /> : null}
  </View>;
}

export function CalendarDateRangeField({ label, startDate, endDate, onChange, optionalEndDate = false }: { label: string; startDate: string; endDate: string; onChange: (startDate: string, endDate: string) => void; optionalEndDate?: boolean }) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  return <View style={styles.fieldWrap}>
    <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`Choose ${label} start and end dates`} onPress={() => setOpen((current) => !current)} style={[styles.fieldButton, { borderColor: open ? colors.primary : colors.border, backgroundColor: colors.background }]}><Text style={[styles.fieldValue, { color: startDate ? colors.foreground : colors.muted }]}>{startDate ? formatReadableLocalDate(startDate) : "Choose start"}{endDate ? ` → ${formatReadableLocalDate(endDate)}` : optionalEndDate ? " → ongoing" : " → choose end"}</Text><Text style={[styles.fieldAction, { color: colors.primary }]}>{open ? "CLOSE" : "CALENDAR"}</Text></Pressable>
    {open ? <CalendarDatePicker mode="range" startDate={startDate} endDate={endDate} optionalEndDate={optionalEndDate} onChange={(start, end) => { onChange(start, end ?? ""); if (end || optionalEndDate) setOpen(false); }} /> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { marginTop: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 10, gap: 9 },
  monthHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  monthLabel: { fontSize: 14, fontWeight: "900" },
  navButton: { width: 34, height: 32, borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  navText: { fontSize: 25, lineHeight: 27, fontWeight: "700" },
  weekRow: { flexDirection: "row" },
  weekLabel: { flex: 1, textAlign: "center", fontSize: 10, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  day: { width: "14.2857%", aspectRatio: 1, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  dayText: { fontSize: 12, fontWeight: "800" },
  selectionRow: { gap: 2 },
  selectionText: { fontSize: 11, fontWeight: "700" },
  selectionHint: { fontSize: 10, fontWeight: "900" },
  clearText: { fontSize: 11, fontWeight: "900" },
  fieldWrap: { gap: 5 },
  fieldLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 0.65 },
  fieldButton: { minHeight: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  fieldValue: { flex: 1, fontSize: 12, fontWeight: "700" },
  fieldAction: { fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
});
