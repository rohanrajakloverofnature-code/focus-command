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

## Free-tier and spending safeguard

Creating the private repository costs **$0** on GitHub Free. For private repositories, GitHub Free currently includes **2,000 Linux runner minutes per month** and **500 MB** of shared Actions artifact and Packages storage. This Android workflow uses the standard Ubuntu runner and retains only the APK artifact. GitHub states that, if no payment method is configured, workflows are blocked once the included quota is exhausted rather than creating paid overages. No paid runner, larger runner, billing upgrade, or spending-limit change is required or configured by this project. Delete old APK artifacts if storage ever approaches the included allowance.

## Verified first build

The first private build completed successfully on **12 August 2026**. Its **Focus-Command-APK-1** artifact is retained in the repository's [workflow run](https://github.com/rohanrajakloverofnature-code/focus-command/actions/runs/31572146215). Open that run while signed in to the repository owner account, download the artifact archive, extract it, and install `app-release.apk`.

## Reference

GitHub documents artifact retention and download behavior at [Store and share data with workflow artifacts](https://docs.github.com/en/actions/tutorials/store-and-share-data). GitHub’s current [Actions billing documentation](https://docs.github.com/billing/managing-billing-for-github-actions/about-billing-for-github-actions) lists the private-repository allowance and its quota behavior; its [pricing page](https://github.com/pricing) confirms that GitHub Free includes unlimited private repositories and 2,000 CI/CD minutes per month.
