# Command Archive Enhancements — Approval Plan

## Purpose

This proposal adds three **read-only, offline** enhancements to the existing Command Archive: a search within the expanded Yearly Revision Overview, a subject-only lens for the Lifetime Growth Trajectory, and an optional comparison of two recorded months. It preserves the existing annual trajectory, lifetime trajectory, yearly and monthly topic overviews, History drill-down, Revision Queue drill-down, calculations, backup behavior, profile-logo mechanism, animations, and every other current feature.

No new backend, account, cloud dependency, stored archive data, mission state, reward, revision state, or backup format will be introduced. Every result is derived from the same existing durable completion, reflection, revision, subject, and distraction records.

| Requested addition | Proposed behavior | Existing systems preserved |
| --- | --- | --- |
| Yearly topic search | Adds a local search field only after the selected year’s expandable topic overview is opened. It filters the displayed real topic names immediately, case-insensitively, while retaining the topic’s subject, first studied month, and current revision-cadence percentage. | The topic records, revision stages, yearly graph, month grid, and normal Revision Queue are unchanged. |
| Subject-only lifetime trend | Adds an **All subjects** selector plus actual subjects found in durable completion records. Selecting one subject changes only the lifetime chart to a clearly labeled **Subject Focus Trajectory**, calculated from that subject’s own completed runs, earned XP, invested time, and completion count. | The existing all-subject Lifetime Growth Trajectory and its composite formula remain exactly as they are. No total-emotion or distraction value will be misleadingly attributed to a single subject. |
| Optional month comparison | Adds a **Compare months** action on the archive page. The user chooses any two recorded months from the existing archive, then sees a read-only side-by-side comparison with values and differences for XP, gold, invested time, completions, reflection traits, distractions, subject distribution, studied topics, and revision status. | Neither month’s data is edited. Existing month detail views, History, Revision Queue, rewards, and calculations remain unchanged. |

## Proposed Experience

### 1. Search within the Yearly Revision Overview

The existing yearly topic overview remains collapsed by default. When the user opens it, a small search field appears above the virtualized topic list. Searching does not perform network work or alter data; it only filters the already-derived records for that selected year. Clearing the field restores the full list. An empty result shows a truthful “No studied topic matches this search” state.

Tapping a result keeps the current behavior: it opens the relevant existing Revision Queue or appropriate archive detail context. The topic’s displayed completion percentage remains the app’s established three-stage revision cadence: **0%, 33%, 67%, or 100%**.

### 2. Subject-only Lifetime Growth lens

The current continuous Lifetime Growth Trajectory remains the default and continues to represent all-subject command growth. A compact subject selector will appear beneath its heading. The selector contains only **All subjects** and subjects with actual completed-run history.

When a subject is selected, the chart title and explanatory label change to make the scope clear. Its line contains the same chronological months as the current lifetime window, but its plotted values come only from that subject’s durable completed-run rewards, invested time, and completion count. Months with no activity for the selected subject remain visible at zero, so the timeline stays continuous and honest. The all-subject chart and calculations are untouched and return immediately when **All subjects** is selected.

### 3. Optional month-to-month comparison

The archive receives a compact **Compare months** action. It opens a read-only comparison panel that defaults to the selected month and the immediately preceding recorded month, when available. The user can change either side through two separate controls that list only real recorded months across all years.

The comparison panel presents two columns and a concise change indicator. It covers XP, gold, invested time, completed runs, focus, clarity, motivation, feeling/energy context when recorded, logged distractions, subject breakdown, studied topics, and revision-cadence progress. Missing reflection data remains explicitly unavailable rather than converted into zero. The comparison never creates, edits, completes, deletes, rewards, reschedules, or synchronizes anything.

## Performance and Interaction Safeguards

The enhancement will extend the existing pure archive cache rather than add a new reactive state system. Search normalization, subject-filtered series, comparison candidates, and comparison output will be memoized from the existing archive snapshot. Search results and topic rows will remain virtualized; the search field will not cause the graph or the rest of the archive page to rerender unnecessarily.

The lifetime chart will keep its established bounded chronological window. The subject selector will use stable callbacks and exact primitive state, with no computation scheduled during scrolling. The comparison panel will derive only the two selected months, not recalculate the entire archive per tap. Existing scroll-safe confirmed-tap behavior, narrow state subscriptions, and no-duplicate-action guards remain in place.

| Performance concern | Safeguard |
| --- | --- |
| Long lifetime histories | Reuse the existing bounded chart window and cached monthly aggregates. |
| Large yearly topic lists | Render only visible rows and filter a compact derived topic index. |
| Fast subject changes | Switch cached series with stable callbacks; do not mutate durable data or replay media. |
| Month comparison | Compute two selected aggregate objects only; no background scan on each control tap. |
| Scroll and touch responsiveness | Keep expensive derivation out of list-row render paths; preserve current confirmed-tap feedback rules. |

## Backup, Safety, and Preservation

The current `.fcbak` Offline Backup File already stores the durable completion, mission, reflection, revision, reward, and distraction records these views read. Because the proposed enhancements are derived only, restoring a valid existing backup will rebuild the same search results, subject trends, and month comparisons automatically. The backup schema, archive format, integrity checks, media handling, Google Sheets behavior, and restore flow will not change.

The protected profile-logo system—including appearance, position, tap mechanism, replay behavior, and cinematics—will not be touched. No launch animation, current Dashboard entry, normal Mission Board behavior, rewards, existing calculations, app identity, APK build, or GitHub Actions workflow will be changed or started.

## Validation Plan

After implementation, I will add focused deterministic tests for search normalization, empty search, year-bound topic filtering, subject-only continuity and zero-activity months, all-subject formula preservation, comparison correctness, missing reflection handling, read-only behavior, backup-equivalence, stable callbacks, bounded charts, and virtualized list boundaries. I will then run the required complete validation suite: TypeScript, full Vitest suite, lint, server build, and static export. No APK build will be started.

## Approval Required

Reply exactly with:

> **Approve exactly this Command Archive Enhancements plan.**

Only after that explicit approval will I implement these three additions.
