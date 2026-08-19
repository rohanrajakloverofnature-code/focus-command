import { AccessibilityInfo, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";

import { CommandButton, CommandCard } from "@/components/focus-ui";
import { useColors } from "@/hooks/use-colors";
import type { ShadowGateDoorwaySelection, ShadowGatePersonalDoorway, ShadowGateResistanceState } from "@/lib/focus-command";
import { getShadowGateSection, SHADOW_GATE_LIBRARY } from "@/lib/shadow-gate-library";

type GatePage = "states" | "doorways";

type SelectedDoorway = Pick<ShadowGateDoorwaySelection, "doorwayId" | "doorwayLabel" | "personalDoorwayId">;

export function ShadowGateSheet({
  visible,
  missionTitle,
  missionSubject,
  sealAccent,
  personalDoorways,
  onClose,
  onEnterMission,
}: {
  visible: boolean;
  missionTitle: string;
  missionSubject: string;
  /** Existing cached character accent or the current app accent; never media-derived here. */
  sealAccent: string;
  personalDoorways: readonly ShadowGatePersonalDoorway[];
  onClose: () => void;
  onEnterMission: (selection: ShadowGateDoorwaySelection) => boolean;
}) {
  const colors = useColors();
  const [page, setPage] = useState<GatePage>("states");
  const [resistanceState, setResistanceState] = useState<ShadowGateResistanceState | null>(null);
  const [selectedDoorway, setSelectedDoorway] = useState<SelectedDoorway | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const entryLock = useRef(false);

  useEffect(() => {
    if (!visible) return;
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [visible]);

  const resetAndClose = () => {
    entryLock.current = false;
    setPage("states");
    setResistanceState(null);
    setSelectedDoorway(null);
    onClose();
  };

  const sortedPersonalDoorways = useMemo(
    () => [...personalDoorways].sort((left, right) => Number(right.pinned) - Number(left.pinned) || right.updatedAt.localeCompare(left.updatedAt)),
    [personalDoorways],
  );

  const chooseState = (state: ShadowGateResistanceState) => {
    setResistanceState(state);
    setSelectedDoorway(null);
    setPage("doorways");
  };

  const choosePersonalDoorway = (doorway: ShadowGatePersonalDoorway) => {
    setSelectedDoorway({ doorwayId: `personal:${doorway.id}`, doorwayLabel: doorway.label, personalDoorwayId: doorway.id });
  };

  const enterMission = () => {
    if (!resistanceState || !selectedDoorway || entryLock.current) return;
    entryLock.current = true;
    const started = onEnterMission({ resistanceState, ...selectedDoorway });
    if (started) {
      resetAndClose();
      return;
    }
    entryLock.current = false;
  };

  const section = resistanceState ? getShadowGateSection(resistanceState) : null;
  const doorwayItems = useMemo(() => {
    if (!section) return [];
    return [
      ...sortedPersonalDoorways.map((doorway) => ({ type: "personal" as const, doorway })),
      ...section.actions.map((doorway) => ({ type: "library" as const, doorway })),
    ];
  }, [section, sortedPersonalDoorways]);

  return (
    <Modal visible={visible} transparent animationType={reduceMotion ? "none" : "fade"} onRequestClose={resetAndClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={resetAndClose} accessibilityRole="button" accessibilityLabel="Close Shadow Gate" />
        <CommandCard accent={sealAccent} style={styles.sheet}>
          <View style={styles.topline}>
            <View style={[styles.gateSeal, { borderColor: `${sealAccent}CC`, backgroundColor: `${sealAccent}16` }]}>
              <View style={[styles.gateSealInner, { borderColor: `${sealAccent}88` }]} />
            </View>
            <View style={styles.headingCopy}>
              <Text style={[styles.eyebrow, { color: sealAccent }]}>SHADOW GATE</Text>
              <Text numberOfLines={1} style={[styles.missionTitle, { color: colors.foreground }]}>{missionTitle}</Text>
            </View>
            <Pressable onPress={resetAndClose} accessibilityRole="button" accessibilityLabel="Close Shadow Gate" hitSlop={8} style={({ pressed }) => [styles.closeButton, { borderColor: colors.border, backgroundColor: colors.background, opacity: pressed ? 0.7 : 1 }]}>
              <Text style={[styles.closeText, { color: colors.muted }]}>×</Text>
            </Pressable>
          </View>

          {page === "states" ? (
            <>
              <Text style={[styles.title, { color: colors.foreground }]}>When beginning feels blocked</Text>
              <Text style={[styles.detail, { color: colors.muted }]}>Choose the resistance that feels closest. This is a private start aid, not a score or a test.</Text>
              <FlatList
                data={SHADOW_GATE_LIBRARY}
                keyExtractor={(item) => item.state}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Pressable onPress={() => chooseState(item.state)} accessibilityRole="button" accessibilityLabel={`Choose ${item.title} resistance`} style={({ pressed }) => [styles.stateRow, { borderColor: colors.border, backgroundColor: colors.background, opacity: pressed ? 0.74 : 1 }]}>
                    <View style={[styles.stateMarker, { backgroundColor: `${sealAccent}1C`, borderColor: `${sealAccent}80` }]} />
                    <View style={styles.stateCopy}>
                      <Text style={[styles.stateTitle, { color: colors.foreground }]}>{item.title}</Text>
                      <Text numberOfLines={2} style={[styles.stateDetail, { color: colors.muted }]}>{item.prompt}</Text>
                    </View>
                    <Text style={[styles.chevron, { color: sealAccent }]}>›</Text>
                  </Pressable>
                )}
              />
            </>
          ) : section ? (
            <>
              <Pressable onPress={() => { setPage("states"); setSelectedDoorway(null); }} accessibilityRole="button" accessibilityLabel="Choose a different resistance state" style={({ pressed }) => [styles.backControl, { opacity: pressed ? 0.7 : 1 }]}>
                <Text style={[styles.backText, { color: sealAccent }]}>‹ RESISTANCE STATES</Text>
              </Pressable>
              <Text style={[styles.title, { color: colors.foreground }]}>{section.title}</Text>
              <Text style={[styles.detail, { color: colors.muted }]}>{section.prompt} Pick one doorway, make the move, then enter your mission.</Text>
              <FlatList
                data={doorwayItems}
                keyExtractor={(item) => item.type === "personal" ? `personal-${item.doorway.id}` : item.doorway.id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={sortedPersonalDoorways.length ? <Text style={[styles.listSectionLabel, { color: sealAccent }]}>MY OWN DOORWAYS</Text> : null}
                renderItem={({ item, index }) => {
                  const isPersonal = item.type === "personal";
                  const doorway = item.doorway;
                  const isSelected = item.type === "personal"
                    ? selectedDoorway?.personalDoorwayId === doorway.id
                    : selectedDoorway?.doorwayId === doorway.id;
                  return (
                    <>
                      {isPersonal || index !== sortedPersonalDoorways.length ? null : <Text style={[styles.listSectionLabel, { color: colors.muted }]}>CURATED DOORWAYS</Text>}
                      <Pressable
                        onPress={() => item.type === "personal" ? choosePersonalDoorway(item.doorway) : setSelectedDoorway({ doorwayId: item.doorway.id, doorwayLabel: item.doorway.label })}
                        accessibilityRole="button"
                        accessibilityLabel={`Choose doorway: ${doorway.label}`}
                        style={({ pressed }) => [styles.doorwayRow, { borderColor: isSelected ? sealAccent : colors.border, backgroundColor: isSelected ? `${sealAccent}16` : colors.background, opacity: pressed ? 0.74 : 1 }]}
                      >
                        <View style={[styles.choiceDot, { borderColor: isSelected ? sealAccent : colors.muted, backgroundColor: isSelected ? sealAccent : "transparent" }]} />
                        <View style={styles.doorwayCopy}>
                          {item.type === "personal" ? <Text style={[styles.personalLabel, { color: sealAccent }]}>{item.doorway.pinned ? "PINNED · " : ""}MY OWN DOORWAY</Text> : null}
                          <Text style={[styles.doorwayText, { color: colors.foreground }]}>{doorway.label}</Text>
                        </View>
                      </Pressable>
                    </>
                  );
                }}
                ListEmptyComponent={<View style={styles.emptyDoorways}><Text style={[styles.emptyDoorwaysText, { color: colors.muted }]}>Save a personal doorway in Settings → Shadow Gate to see it here.</Text></View>}
              />
              <CommandButton label="I MADE THE MOVE → ENTER MISSION" onPress={enterMission} disabled={!selectedDoorway || entryLock.current} style={styles.enterButton} />
              <Text style={[styles.privacyNote, { color: colors.muted }]}>A Gate record is saved only if this mission starts successfully. Nothing here changes your XP, streaks, or rewards.</Text>
            </>
          ) : null}
        </CommandCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "#000000A8", padding: 14 },
  sheet: { maxHeight: "86%", minHeight: 430, gap: 10, paddingBottom: 14 },
  topline: { flexDirection: "row", alignItems: "center", gap: 10 },
  gateSeal: { width: 36, height: 36, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  gateSealInner: { width: 20, height: 20, borderWidth: 1.5, borderRadius: 10 },
  headingCopy: { flex: 1, gap: 1 },
  eyebrow: { fontSize: 9, lineHeight: 12, fontWeight: "900", letterSpacing: 1.05 },
  missionTitle: { fontSize: 12, lineHeight: 16, fontWeight: "800" },
  closeButton: { width: 30, height: 30, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderRadius: 15 },
  closeText: { fontSize: 21, lineHeight: 23, fontWeight: "400", marginTop: -2 },
  title: { fontSize: 20, lineHeight: 25, fontWeight: "900", letterSpacing: -0.2 },
  detail: { fontSize: 12, lineHeight: 17, fontWeight: "600", marginTop: -4 },
  list: { flexGrow: 0 },
  listContent: { gap: 7, paddingVertical: 2 },
  stateRow: { minHeight: 58, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 10 },
  stateMarker: { width: 8, height: 30, borderRadius: 4, borderWidth: StyleSheet.hairlineWidth },
  stateCopy: { flex: 1, gap: 2 },
  stateTitle: { fontSize: 13, lineHeight: 17, fontWeight: "900" },
  stateDetail: { fontSize: 10, lineHeight: 14, fontWeight: "600" },
  chevron: { fontSize: 24, lineHeight: 26, fontWeight: "400" },
  backControl: { alignSelf: "flex-start", minHeight: 22, justifyContent: "center" },
  backText: { fontSize: 9, lineHeight: 13, fontWeight: "900", letterSpacing: 0.7 },
  listSectionLabel: { fontSize: 9, lineHeight: 13, fontWeight: "900", letterSpacing: 0.8, marginTop: 4, marginBottom: 1 },
  doorwayRow: { minHeight: 48, borderWidth: StyleSheet.hairlineWidth, borderRadius: 13, paddingHorizontal: 11, paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 10 },
  choiceDot: { width: 15, height: 15, borderWidth: 1.5, borderRadius: 8 },
  doorwayCopy: { flex: 1, gap: 2 },
  personalLabel: { fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.65 },
  doorwayText: { fontSize: 12, lineHeight: 16, fontWeight: "700" },
  emptyDoorways: { minHeight: 70, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  emptyDoorwaysText: { fontSize: 11, lineHeight: 16, fontWeight: "600", textAlign: "center" },
  enterButton: { marginTop: 1 },
  privacyNote: { fontSize: 9, lineHeight: 13, fontWeight: "600", textAlign: "center", paddingHorizontal: 6 },
});
