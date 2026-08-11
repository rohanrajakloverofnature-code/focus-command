import * as WebBrowser from "expo-web-browser";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

// On web, this completes the direct Google AuthSession popup handshake.
WebBrowser.maybeCompleteAuthSession();

/**
 * Web-only landing route for the direct Google Sheets AuthSession flow.
 * It contains no server-auth exchange, session storage, or backend call.
 */
export default function GoogleSheetsWebCallback() {
  const colors = useColors();
  const params = useLocalSearchParams<{ error?: string }>();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/settings?section=sheet" as never);
      }
    }, params.error ? 500 : 800);
    return () => clearTimeout(timer);
  }, [params.error]);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="items-center justify-center px-7">
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ActivityIndicator size="large" color={params.error ? colors.error : colors.primary} />
        <Text style={[styles.title, { color: colors.foreground }]}>
          {params.error ? "Google Sheets authorization returned an error" : "Completing Google Sheets connection"}
        </Text>
        <Text style={[styles.detail, { color: colors.muted }]}>
          {params.error ? "Returning to Command Settings…" : "Focus Command is securely finishing your direct Sheets authorization…"}
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { width: "100%", maxWidth: 360, alignItems: "center", gap: 10, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 26 },
  title: { fontSize: 17, lineHeight: 22, fontWeight: "900", textAlign: "center" },
  detail: { fontSize: 13, lineHeight: 19, fontWeight: "600", textAlign: "center" },
});
