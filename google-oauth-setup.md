# Google Sheets OAuth Setup for Focus Command

Focus Command includes a prepared Google Sheets OAuth and synchronization flow. The currently configured **Web OAuth Client ID** has passed the project configuration test. However, current Expo guidance confirms that **Expo Go is not a supported environment for OAuth/OpenID Connect redirect testing** because the app cannot define its own native redirect scheme there.

## Current Project Identifiers

| Setting | Value |
|---|---|
| Android package name | `com.app.rpgfocuscommand` |
| Development-build callback scheme | `manusrpgfocuscommand://oauth/callback` |
| Required Android OAuth setup | Google OAuth Android client using the package name and the development/build signing SHA-1 |
| Required iOS OAuth setup | Google OAuth iOS client using the final bundle identifier |
| Configured development value | Google Web OAuth Client ID, used for Web configuration validation |

## Current Integration Readiness

| Capability | Current state |
|---|---|
| Local-first offline queue | Implemented and persisted on-device. |
| Google authorization UI | Implemented with PKCE, secure token storage, account identity display, and explicit Expo Go guidance. |
| Token recovery | Implemented: a secure refresh token is used to recover an expired access token when Google returns one. |
| Workbook operations | Implemented: create a workbook, create missing Focus Command tabs, import a snapshot, and sync the active state. |
| Conflict protection | Implemented: a newer remote snapshot plus unsynced local changes triggers a choice between using the sheet copy or keeping the local copy. |
| Live device sign-in | Pending the Android and iOS OAuth client identifiers described below. |

## Google Cloud Console Steps

Create an Android OAuth client once the SHA-1 fingerprint is available, using the Android package name above. Create an iOS OAuth client when the iOS bundle identifier is available. Save the resulting values as `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`. Then run the app in a native development build—not Expo Go—and choose **Authorize Google** in Command settings.

The app requests only the scopes needed to identify the account and create/read/write the selected Google Sheet: `openid`, `profile`, `email`, `https://www.googleapis.com/auth/spreadsheets`, and `https://www.googleapis.com/auth/drive.file`. Tokens are stored in native secure storage and a refresh token is used only to restore a previously approved session. The selected workbook uses the `App_State`, `Missions`, `Reflections`, `Revisions`, `Bosses`, `Journal`, `Rewards`, `Transactions`, `Inventory`, `Progression`, `Lifeline`, and `Settings` tabs. Sync manages columns `A:AZ` in those tabs so unrelated manual columns beyond that range remain untouched.

## Authoritative References

- [Expo: Authentication with OAuth or OpenID providers](https://docs.expo.dev/guides/authentication/)
- [Expo: Using Google authentication](https://docs.expo.dev/guides/google-authentication/)
- [Expo AuthSession reference](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Google: OAuth 2.0 for native apps](https://developers.google.com/identity/protocols/oauth2/native-app)
