import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Google Sheets OAuth configuration", () => {
  it("validates the configured Web Client ID and Google discovery metadata", async () => {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

    expect(clientId, "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID must be configured").toBeTruthy();
    expect(clientId).toMatch(/^[0-9][A-Za-z0-9-]*\.apps\.googleusercontent\.com$/);

    const discoveryResponse = await fetch("https://accounts.google.com/.well-known/openid-configuration");
    expect(discoveryResponse.ok).toBe(true);

    const discovery = (await discoveryResponse.json()) as { authorization_endpoint?: string; token_endpoint?: string };
    expect(discovery.authorization_endpoint).toContain("accounts.google.com");
    expect(discovery.token_endpoint).toContain("googleapis.com");
  });

  it("registers the native application-identifier redirect used by a development build", () => {
    const redirectUri = "com.app.rpgfocuscommand:/oauthredirect";
    const request = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    request.searchParams.set("redirect_uri", redirectUri);
    request.searchParams.set("response_type", "code");
    request.searchParams.set("scope", "openid https://www.googleapis.com/auth/spreadsheets");
    const appConfig = readFileSync(resolve(process.cwd(), "app.config.ts"), "utf8");
    const authHook = readFileSync(resolve(process.cwd(), "hooks/use-google-sheets-auth.ts"), "utf8");
    const rootLayout = readFileSync(resolve(process.cwd(), "app/_layout.tsx"), "utf8");
    const redirectRoute = readFileSync(resolve(process.cwd(), "app/oauthredirect.tsx"), "utf8");

    expect(request.searchParams.get("redirect_uri")).toBe(redirectUri);
    expect(request.searchParams.get("scope")).toContain("spreadsheets");
    expect(appConfig).toContain("oauthCallbackScheme: bundleId");
    expect(appConfig).toContain('pathPrefix: "/oauthredirect"');
    expect(authHook).toContain("const nativeRedirectUri = Platform.OS === \"android\"");
    expect(rootLayout).toContain('<Stack.Screen name="oauthredirect" />');
    expect(redirectRoute).toContain("Completing secure Google connection");
    expect(redirectRoute).toContain("router.back()");
  });
});
