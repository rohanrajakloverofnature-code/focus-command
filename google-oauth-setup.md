# Google Sheets OAuth Setup for Focus Command

Focus Command uses Expo's Google AuthSession provider with the supported **native application-identifier redirect** on Android and iOS. The native build now registers both its normal app scheme and the Google callback scheme `com.app.rpgfocuscommand:/oauthredirect`, which is the return URI explicitly requested by the Android authorization hook. OAuth cannot complete in Expo Go because a native development build is needed to own this callback scheme.

## Values to Use in Google Cloud Console

| Google Cloud field | Exact Focus Command value |
|---|---|
| App display / build name | `Focus Command` |
| Expo project slug | `rpg-focus-command` |
| Android package name | `com.app.rpgfocuscommand` |
| iOS bundle identifier | `com.app.rpgfocuscommand` |
| Android native callback used by AuthSession | `com.app.rpgfocuscommand:/oauthredirect` |
| Android OAuth client environment variable | `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` |
| iOS OAuth client environment variable | `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` |
| Existing web client environment variable | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` |

## Android SHA-1 Fingerprint

The exact SHA-1 cannot be truthfully supplied until the **same signing certificate used for the native development build** exists. No Android keystore is stored in this project, so a local placeholder or debug SHA-1 would not authorize the real build.

After creating or obtaining the signed Android development build, retrieve the SHA-1 from the exact signing artifact using one of these supported paths:

| Build ownership | Where to obtain the correct SHA-1 |
|---|---|
| EAS or hosted build credentials | Use the build credential view or the signing certificate exported by the build service. |
| A signed APK or AAB | Run `keytool -printcert -jarfile app.apk` or `keytool -printcert -jarfile app.aab`. |
| Play App Signing | Google Play Console → **Release** → **Setup** → **App Integrity** → the appropriate upload or app-signing certificate. |

> Use the SHA-1 belonging to the build that will actually run on the phone. The upload-key and Play app-signing-key SHA-1 values can differ.

## Google Cloud Console Steps

First enable the **Google Sheets API** and **Google Drive API** for the chosen Google Cloud project. Create an **Android** OAuth client using the package name and exact development-build SHA-1 above. Create an **iOS** OAuth client using the iOS bundle identifier. Retain the existing Web OAuth client for web validation.

When the Android and iOS client IDs are ready, provide only their client-ID strings. They will be stored as `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, and then the app can be tested in a native development build from **Command Settings → Google Sheets → Authorize Google**.

## Integration Readiness

| Capability | Current state |
|---|---|
| Offline queue and local persistence | Implemented on-device. |
| Google authorization UI | Implemented with PKCE, secure token storage, account identity display, and clear native-build guidance. |
| Native redirect behavior | Explicitly requests and registers `com.app.rpgfocuscommand:/oauthredirect` for Android; the callback intent filter is included in the native app build. |
| Token recovery | Implemented with secure refresh-token recovery when Google returns a refresh token. |
| Workbook operations | Implemented: create workbook, create missing Focus Command tabs, import a snapshot, and sync active state. |
| Conflict handling | Implemented: newer remote data plus unsynced local data presents an explicit local-versus-sheet choice. |
| Live native sign-in | Pending Android and iOS OAuth client IDs, plus the Android build's actual signing SHA-1. |

The app requests only the scopes needed to identify the account and create, read, and write the selected Google Sheet: `openid`, `profile`, `email`, `https://www.googleapis.com/auth/spreadsheets`, and `https://www.googleapis.com/auth/drive.file`. Tokens are stored in native secure storage. The selected workbook uses the `App_State`, `Missions`, `Reflections`, `Revisions`, `Bosses`, `Journal`, `Rewards`, `Transactions`, `Inventory`, `Progression`, `Lifeline`, and `Settings` tabs; Focus Command manages columns `A:AZ`, preserving unrelated manual columns beyond that range.

## References

- [Expo: Authentication with OAuth or OpenID providers](https://docs.expo.dev/guides/authentication/)
- [Expo: Using Google authentication](https://docs.expo.dev/guides/google-authentication/)
- [Expo AuthSession provider implementation](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Google: Client authentication and SHA-1 certificate fingerprints](https://developers.google.com/android/guides/client-auth)
- [Google: OAuth 2.0 for installed applications](https://developers.google.com/identity/protocols/oauth2/native-app)
