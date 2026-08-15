# Revised Command Archive Plan: Lifetime Growth + Monthly Revision View

## What Will Be Added

This revision keeps the existing **Monthly Command Archive** exactly intact and adds two additive, connected views on the same archive journey:

| Addition | How it will work |
|---|---|
| **Lifetime Growth Trajectory** | A continuous, horizontally navigable monthly growth line from the first recorded month through the latest one—for example, 2026 → 2029 → beyond. The present 12-month selected-year graph remains directly below it and is not replaced. |
| **Yearly Revision Overview** | An additive, collapsible summary beneath the selected-year graph and above the unchanged month grid. It lists the real topic names captured in that calendar year, grouped by subject, with their current revision-cadence completion percentage. |
| **Clickable monthly drill-downs** | The monthly summary and insight cards will become clear, accessible touch targets that open the exact related information rather than acting as decorative cards. |
| **Monthly Revision Review** | A dedicated, read-only view for the selected month, listing every recorded study topic with its subject and current revision-cadence completion. It opens from the monthly **Subjects map** area. |

## Monthly Buttons and Their Destinations

| Current monthly area | Proposed action | Destination |
|---|---|---|
| **XP earned**, **Gold earned**, **Invested**, or **Completed** | Tap a summary card. | A month-filtered Activity History view containing only the durable completed runs for that chosen month. It shows the exact XP, gold, active duration, mission title, subject, and completion time already recorded. Tapping a run opens the existing mission-result detail for that exact completion. |
| **Focus**, **Clarity**, **Motivation**, or **Debriefs** | Tap a reflection-trait card. | The same monthly archive selects that existing dimension and returns to its already available daily chart. No new wellbeing score or calculation is invented. |
| **Subjects map** / **Review topics** | Tap the clear Review Topics control placed with the existing Subjects map. | The new read-only **Monthly Revision Review** for that selected month. |
| A topic with an active due revision | Tap the topic row. | The existing Revision Queue opens focused on that exact pending topic, where the current existing `Open` and `Done` actions remain unchanged. |
| A topic with no pending revision | Tap the topic row. | Its month-specific activity detail opens, including the exact linked completed run. No fake “revision history” action is offered when the app has none. |

## Truthful Topic Names and Completion Percentages

The Monthly Revision Review will list all **specific topics that were actually captured through a completed mission in the selected month**, grouped by subject. A mission without a saved specific-topic field is not silently renamed as a topic; its mission title remains visible only in Activity History.

The percentage has one transparent meaning: **the current completion of Focus Command’s existing three-step revision cadence for that topic**.

| Existing revision state | Displayed percentage | Meaning |
|---|---:|---|
| Revision queued, first review not yet completed | 0% | The topic was read and queued, but no scheduled revision point has been confirmed. |
| First review confirmed | 33% | One of the three existing revision stages is complete. |
| Second review confirmed | 67% | Two of the three existing revision stages are complete. |
| Final review confirmed | 100% | The established 1–7–30 revision cadence is complete. |
| A completed mission had no revision enabled | Not enrolled | The topic was completed as a mission, but no revision cadence was created. It will not be falsely shown as 0% revision progress. |

This percentage will be labelled **“Revision cadence”**, not “how much of a textbook is complete.” The app does not currently store a textbook syllabus, chapter count, or a permanent timestamp for every intermediate revision stage, so this is the only truthful progress percentage available without creating a new tracking system or inventing data. The list remains month-based by the date the topic was actually captured through its completed mission; its live cadence percentage updates only as the user completes real existing revision stages.

## Selected-Year Topic Overview

The selected-year view will add one **“Yearly Revision Overview”** control immediately below the existing 12-month Growth Trajectory card. Tapping it expands a compact, virtualized list of all real topics first captured through completed missions in that selected calendar year. Each row shows the topic name, subject, its first captured month, and the same current **Revision cadence** percentage used by the monthly Revision Review. A topic first completed in March 2026 will stay listed within the 2026 overview even if the user completes a later review stage in 2027; this keeps the year view truthful about *when it was studied* while showing its present revision readiness.

The overview will be collapsed by default, with a clear count such as `18 topics studied`. The existing annual line graph, annual card dimensions, year chips, and 12-month grid remain exactly in their current order and retain their existing controls. Selecting a topic follows the same truthful destination rule: an active due topic opens its current Revision Queue detail; otherwise it opens its linked completed-run detail.

## Performance and Smoothness Safeguards

The implementation will retain the current fast archive boundary and extend it carefully:

| Safeguard | Result |
|---|---|
| The lifetime timeline reuses the established monthly Growth Score and is derived once from the immutable archive snapshot. | No duplicate formula, persistence write, or repeated long-history aggregation on each tap. |
| The multi-year graph uses virtualized horizontal windows rather than rendering every future month in one large SVG. | Smooth, readable navigation even after many years of history. |
| The yearly overview, Monthly Activity History, and Monthly Revision Review use virtualized lists, stable row callbacks, and exact route parameters. | Only visible rows render, keeping scrolling and first-tap response quick. |
| Existing confirmed-tap feedback remains in place; no new haptic/audio work begins during scroll gestures. | Prevents the new controls from bringing back tap or scroll delay. |
| All topic, activity, and metric derivations remain pure and memoized by the same durable snapshot. | No new background task, database call, cloud dependency, or duplicate local storage. |

## What Will Not Change

The profile-logo system, all character cinematics and completed animations, existing selected-year archive graph, month grid, current metric switching, mission timing, rewards, XP, gold, emotions, Google Sheets, Offline Backup File, app identity, and normal Mission History behavior will remain unchanged.

The new month-filtered Activity History uses optional archive-only route parameters. Opening the ordinary Mission Board History exactly as before keeps its current all-history behavior.

## Backup Alignment

No backup-format change is required. The lifetime line, monthly activity list, and topic/revision percentage are all rebuilt from durable mission completions, SRS topics, reflections, rewards, and existing timestamps already included in the validated `.fcbak` archive. A restore reconstructs the same views without separate archive data.

## Validation Before Checkpoint

I will test multi-year ordering, real month/year rollover, selected-year topic ordering, month-filtered activity navigation, exact completion-result deep links, topic selection, 0/33/67/100 cadence display, non-enrolled honesty, pending-revision deep links, cache reuse, virtualized windows/lists, protected existing archive controls, backup equivalence, rapid taps, and the full application suite: TypeScript, all tests, lint, server build, and static export. Metro remains available; no APK build will be started.

## Approval Required

If this revised scope matches exactly what you want, reply:

> **Approve exactly this revised Command Archive Lifetime Growth and Monthly Revision plan.**

Only after that explicit approval will I implement it.
