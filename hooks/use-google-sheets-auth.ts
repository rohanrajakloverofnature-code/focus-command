import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";

import { clearGoogleTokens, getGoogleAccessToken, refreshGoogleAccessToken, saveGoogleTokens } from "@/lib/google-sheets";

WebBrowser.maybeCompleteAuthSession();

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "";
const configuredScheme = Constants.expoConfig?.scheme;
const appScheme = Array.isArray(configuredScheme) ? configuredScheme[0] : configuredScheme;

export type GoogleSheetsAuthStatus =
  | "idle"
  | "authorizing"
  | "authorized"
  | "needs_web_client"
  | "needs_native_client"
  | "unsupported_in_expo_go"
  | "error";

export interface GoogleSheetsAuthResult {
  status: GoogleSheetsAuthStatus;
  message: string | null;
  accessToken: string | null;
  canAuthorize: boolean;
  beginAuthorization: () => Promise<void>;
  disconnect: () => Promise<void>;
}

function nativeClientConfigured() {
  if (Platform.OS === "ios") return Boolean(iosClientId);
  if (Platform.OS === "android") return Boolean(androidClientId);
  return Boolean(webClientId);
}

export function useGoogleSheetsAuth(onAuthorized?: (accessToken: string, email: string | null) => void): GoogleSheetsAuthResult {
  const expoGo = Constants.appOwnership === "expo";
  const clientId = Platform.OS === "ios" ? iosClientId : Platform.OS === "android" ? androidClientId : webClientId;
  const [status, setStatus] = useState<GoogleSheetsAuthStatus>(() => {
    if (!webClientId) return "needs_web_client";
    if (expoGo && Platform.OS !== "web") return "unsupported_in_expo_go";
    if (!nativeClientConfigured()) return "needs_native_client";
    return "idle";
  });
  const [message, setMessage] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId,
    webClientId: webClientId || undefined,
    iosClientId: iosClientId || undefined,
    androidClientId: androidClientId || undefined,
    scopes: [
      "openid",
      "profile",
      "email",
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ],
    selectAccount: true,
    shouldAutoExchangeCode: true,
    extraParams: { access_type: "offline", prompt: "consent" },
  }, Platform.OS === "web" ? {
    scheme: appScheme,
    path: "oauth/callback",
  } : {});

  useEffect(() => {
    if (expoGo && Platform.OS !== "web") return;
    let active = true;
    void (async () => {
      const restored = await getGoogleAccessToken() ?? await refreshGoogleAccessToken(clientId);
      if (!active || !restored) return;
      setAccessToken(restored);
      setStatus("authorized");
      setMessage(null);
      onAuthorized?.(restored, null);
    })();
    return () => { active = false; };
  }, [clientId, expoGo, onAuthorized]);

  useEffect(() => {
    if (!response) return;
    if (response.type === "error") {
      setStatus("error");
      setMessage(response.error?.message ?? "Google authorization was not completed.");
      return;
    }
    if (response.type !== "success") return;
    const token = response.authentication?.accessToken ?? response.params.access_token;
    if (!token) {
      setStatus("error");
      setMessage("Google did not return an access token for the requested Sheets scopes.");
      return;
    }
    saveGoogleTokens({
      accessToken: token,
      refreshToken: response.authentication?.refreshToken ?? null,
      expiresIn: response.authentication?.expiresIn ?? null,
    }).then(async () => {
      const profile = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${token}` } })
        .then((result) => result.ok ? result.json() as Promise<{ email?: string }> : null)
        .catch(() => null);
      setAccessToken(token);
      setStatus("authorized");
      setMessage(null);
      onAuthorized?.(token, profile?.email ?? null);
    }).catch(() => {
      setStatus("error");
      setMessage("Google authorized the request, but the secure token could not be saved on this device.");
    });
  }, [onAuthorized, response]);

  const beginAuthorization = useCallback(async () => {
    if (!webClientId) {
      setStatus("needs_web_client");
      setMessage("Add the Google Web Client ID before authorizing the connection.");
      return;
    }
    if (expoGo && Platform.OS !== "web") {
      setStatus("unsupported_in_expo_go");
      setMessage("Expo Go cannot complete an OAuth redirect for this app. Use a development build after adding the native client ID.");
      return;
    }
    if (!nativeClientConfigured()) {
      setStatus("needs_native_client");
      setMessage(`A ${Platform.OS === "ios" ? "Google iOS" : "Google Android"} OAuth client is required for this native build.`);
      return;
    }
    if (!request) {
      setStatus("error");
      setMessage("The Google authorization request is still preparing. Please try again in a moment.");
      return;
    }
    setStatus("authorizing");
    setMessage(null);
    const result = await promptAsync();
    if (result.type === "dismiss" || result.type === "cancel") {
      setStatus("idle");
      setMessage("Google authorization was canceled.");
    }
  }, [expoGo, promptAsync, request]);

  const disconnect = useCallback(async () => {
    await clearGoogleTokens();
    setAccessToken(null);
    setStatus(expoGo && Platform.OS !== "web" ? "unsupported_in_expo_go" : nativeClientConfigured() ? "idle" : "needs_native_client");
    setMessage(null);
  }, [expoGo]);

  return useMemo(() => ({
    status,
    message,
    accessToken,
    canAuthorize: status !== "needs_web_client" && status !== "needs_native_client" && status !== "unsupported_in_expo_go" && Boolean(request),
    beginAuthorization,
    disconnect,
  }), [accessToken, beginAuthorization, disconnect, message, request, status]);
}
