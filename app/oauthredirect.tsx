import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

/**
 * Native Google AuthSession callback landing route.
 *
 * The authorization response is still delivered to the waiting AuthSession hook
 * on the Settings screen. This route exists solely so Expo Router resolves the
 * `...:/oauthredirect` deep link rather than replacing the app with an
 * unmatched-route screen while that hook consumes the code.
 */
export default function GoogleOAuthRedirectScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ code?: string; error?: string }>();

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
        <Text style={[styles.title, { color: colors.foreground }]}>{params.error ? "Authorization returned an error" : "Completing secure Google connection"}</Text>
        <Text style={[styles.detail, { color: colors.muted }]}>{params.error ? "Returning to Command Settings…" : "Focus Command is securely finishing your Sheets authorization…"}</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { width: "100%", maxWidth: 360, alignItems: "center", gap: 10, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 26 },
  title: { fontSize: 17, lineHeight: 22, fontWeight: "900", textAlign: "center" },
  detail: { fontSize: 13, lineHeight: 19, fontWeight: "600", textAlign: "center" },
});
