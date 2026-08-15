# Monthly Command Archive — Approval Plan

## Scope and Protection

This proposal adds one **read-only Monthly Command Archive** entry to the existing Dashboard. It will not change the profile-logo system, character cinematics, launch animation, missions, rewards, current Dashboard calculations, Google Sheets behaviour, app identity, or any existing visible mechanism. The archive will use the records Focus Command already saves locally; it will not create a backend, internet dependency, separate database, or parallel history store.

## What the Archive Will Show

### 1. Dashboard Entry

A compact **Command Archive** card will be placed below the existing Dashboard KPI tiles and above the Weekly After-Action Review. It will be a navigation entry only, so the current Dashboard remains quick to load and its existing sections retain their positions and behaviour.

### 2. Lifelong Year View

The Archive screen will list every calendar year for which the existing saved records contain data. Selecting a year will show:

- A premium month-by-month **Growth** line graph at the top.
- A 12-month grid, with months that contain data visually available and months without data shown truthfully as empty.
- A short yearly summary of completed missions, invested time, XP, and the leading focus signals.

The archive will use the user’s configured local timezone and evaluate every relevant durable timestamp whenever the state changes. As soon as the first valid record belongs to a **real new calendar month or year**, that new month or year will appear automatically. There is no manual rollover action, scheduled job, placeholder month, or made-up data: new periods are revealed only by actual saved activity, and a freshly restored backup will immediately reconstruct its historical years and months from its records.

The graph’s Growth score is a clearly labelled, fixed composite built only from monthly data already available in the app: XP awarded, completed focus time, focus quality, clarity, motivation, subject breadth, and the inverse of recorded distractions. Missing reflection answers will not be guessed or replaced with fabricated scores; the archive will show the data that actually exists.

### 3. Month Detail View

Tapping a month with data will open a read-only monthly detail screen. A metric selector will allow switching the visual and summary values between:

| Dimension | Monthly content |
| --- | --- |
| **Growth** | The transparent composite growth score and its contributing signals. |
| **XP** | XP earned from valid completion records. |
| **Gold** | Gold awarded from linked completion progression records. |
| **Focus time** | Total invested active time from the established completion-duration source of truth. |
| **Missions** | Completed mission-run count and planned-date follow-through where records exist. |
| **Focus** | Average recorded focus quality. |
| **Clarity** | Average recorded clarity. |
| **Motivation** | Average recorded motivation. |
| **Emotional traits** | Most common post-mission feeling and available energy shift. |
| **Subjects** | A readable subject map based on invested time and completion count. |
| **Distractions** | Recorded count and most common category. |

The selected dimension will update a compact, native-drawn SVG chart and a supporting metric summary. It will not edit any history or introduce a new tracking questionnaire.

## Data and Backup Design

I will add a pure `lib/monthly-command-archive.ts` derivation helper. It will group existing immutable completion records, their linked progression and reflection records, distraction logs, and dated mission records by the user’s local timezone using the same durable-record and date conventions already used by the Weekly After-Action Review.

No new monthly records, media files, storage keys, or schema fields are needed. The existing `.fcbak` Offline Backup File already contains all source records required to rebuild the archive after restore. Therefore, backup alignment is automatic by design: a restored backup will produce the same archive from the restored durable records, without a second archive import or migration step.

## Performance and Responsiveness Safeguards

The archive will be designed to stay smooth even as years of data accumulate:

| Area | Safeguard |
| --- | --- |
| Derivation | Memoize results from the exact archive-relevant state snapshot; do not recalculate on unrelated settings, media, or UI changes. |
| Dashboard | Keep the new entry card on the existing narrow Dashboard subscription so it does not force broad screen renders. |
| Lists | Use virtualized year/month rendering, stable keys, memoized cards, and fixed-size chart data. |
| Charts | Render only the selected year/month data; avoid animations or calculations during scrolling. |
| Taps | Preserve the existing confirmed-tap action and feedback scheduling, so scroll gestures are not treated as taps and normal button responsiveness is not slowed. |
| Data safety | Read-only derived data only; no additional persistence work occurs on navigation or metric switching. |

## Validation Before Checkpoint

After implementation, I will add deterministic tests for month/year boundaries, timezone grouping, empty months, multi-year history, metric calculations, subject/distraction summaries, growth-score transparency, and restored-backup equivalence. I will then run the full validation suite: TypeScript checking, the complete Vitest suite (at least the current 176 tests, plus the new coverage), lint, and production static export. I will keep Metro running and will not trigger an APK build.

## Explicitly Unchanged

- The profile-logo appearance, placement, tapping/replay mechanism, and cinematics.
- Existing animations, sounds, mission timing, rewards, inventory, level calculations, titles, and historical records.
- Google Sheets behaviour and the offline-only nature of distraction data.
- Focus Command name, package identifier, launcher branding, and all current feature layouts other than the requested archive entry and its new screen.

## Approval Required

I will make **no implementation changes** unless you reply exactly:

> Approve exactly this Monthly Command Archive plan.
