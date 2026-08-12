# Build Focus Command as an APK with GitHub Actions

## What this adds

This repository includes a committed native Android Gradle project and a manual GitHub Actions workflow at `.github/workflows/android-apk.yml`. The workflow builds an installable **Focus Command** APK on GitHub’s runner. It does not call Expo’s hosted build service.

The Android display name remains **Focus Command** and the Android application ID remains `com.app.rpgfocuscommand`. No app screen, feature, data flow, visual design, or gameplay setting changes as part of this build preparation.

## First-time repository setup

Create or use a GitHub repository, then push this project to its `main` branch. The `android/` directory must be committed because it contains the Gradle project used by the workflow.

```bash
git add android .github/workflows/android-apk.yml .gitignore docs/github-apk-build.md
git commit -m "Add GitHub Actions Android APK build"
git push origin main
```

## Create an APK

1. Open the GitHub repository.
2. Select **Actions**.
3. Open **Build Focus Command APK**.
4. Select **Run workflow**, then confirm the run.
5. When it completes, open that workflow run and download the **Focus-Command-APK** artifact.
6. Extract the downloaded archive and install `app-release.apk` on an Android device.

## Signing note

The generated APK is suitable for direct installation and testing. It uses the generated debug signing configuration so it can be installed without adding a keystore secret. Before Play Store distribution, replace that signing configuration with a release keystore stored in GitHub repository secrets; do not commit a production keystore to the repository.

## Reference

GitHub documents artifact retention and download behavior at [Store and share data with workflow artifacts](https://docs.github.com/en/actions/tutorials/store-and-share-data).
