# Lifetime Growth Trajectory — Approval Plan

## Purpose

Add one **continuous, multi-year Lifetime Growth Trajectory** to the existing **Monthly Command Archive** screen. It will let the archive show a chronological growth history from the first durable recorded month—for example, **2026 through 2029 and beyond**—while retaining the current individual-year graph and every existing month-detail control exactly as they are.

> This is a proposal only. No application code, interface, stored data, calculation, backup format, animation, profile-logo behavior, mission behavior, or Google Sheets behavior has been changed by this document.

## Proposed Same-Page Experience

The new **Lifetime Growth Trajectory** card will appear on the existing Monthly Command Archive page, directly beneath the page introduction and above the current selected-year graph. It will be visually distinct from, and will not replace, the current **2026 Growth Trajectory**-style annual card.

| Area | Proposed behavior | Existing behavior preserved |
|---|---|---|
| Lifetime graph | Shows the full chronological month sequence from the first recorded local month through the latest recorded local month. A person using the app from 2026 to 2029 will be able to navigate the complete 2026–2029 growth line in this card. | The selected-year graph remains a 12-month January–December view. |
| Date visibility | The lifetime line uses clear cross-year anchors such as `Jan 2026`, `Jan 2027`, `Jan 2028`, and `Jan 2029`. Each actual recorded month retains its own growth score. | Existing year chips and the current annual-card title remain unchanged. |
| Months with no durable record | A month without any saved activity is treated as **no data**, not as invented performance. The chart will preserve the chronology without claiming that an unrecorded month had a true score of zero. | Existing month grid keeps its current explicit `NO DATA` tiles. |
| New month/year | When the first eligible durable record is saved in a real new local month or year, the already-existing archive derivation creates that period and the lifetime line extends automatically. No rollover control, task, marker, or placeholder record is introduced. | Current automatic local-calendar behavior remains unchanged. |
| Annual exploration | The existing horizontal year selector and month tiles continue to open the same yearly and monthly records. | No year, month, metric selector, or detail content is removed, reordered, or changed. |

## Truthful Growth Source

The continuous line will reuse the **exact same monthly Growth Score** already used by the annual graph. It will not create a second progression formula. Its available weighted signals remain XP, invested focus time, completed work, focus quality, clarity, motivation, subject breadth, and the inverse of actually logged distractions. The card will retain a concise explanation that missing inputs are not invented.

All data remains **read-only and offline**. The trajectory is calculated from the current durable mission-completion, progression, transaction, reflection, due-date, and distraction records only. It adds no reducer action, no persisted archive collection, no background task, and no external dependency.

## Premium Smoothness and Long-History Performance Plan

The implementation will be designed to remain responsive not only for four years, but also for a much longer history.

| Safeguard | Implementation approach | Benefit |
|---|---|---|
| One derived timeline | Create the chronological lifetime series once from the already-cached immutable archive snapshot, then cache it by that snapshot. | Prevents repeated sorting and aggregation during scrolling, tab changes, and metric interactions. |
| Bounded chart windows | The lifetime graph will be horizontally navigable in small overlapping timeline windows rather than placing an unbounded SVG of every future month on the JavaScript/UI thread at once. The overlap preserves the continuous visual path at the boundary. | Keeps the screen smooth and avoids a dense, unreadable, or increasingly expensive graph over decades of data. |
| Virtualized navigation | Use a horizontal virtualized list for timeline windows and preserve the existing virtualized year/month lists. Only the currently visible chart window and its immediate neighbor are rendered. | Reduces memory use and protects scroll cadence. |
| Stable interactions | Keep callbacks, list render items, chart points, and selected-window state memoized. Reuse existing confirmed-tap behavior rather than adding touch-down work. | Protects first-tap responsiveness and prevents the lifetime graph from adding button delay. |
| No duplicate persistence | Do not write the derived timeline to AsyncStorage or create new backup media/files. | Avoids storage work, persistence overhead, and backup complexity. |

The lifetime card will be **horizontally navigable**, so the user can move through the complete continuous history while each chart window remains readable on a phone. The selected-year chart below it remains the detailed 12-month inspection view; the month view remains the daily, switchable metric inspection view.

## Backup Alignment

No change is required to the existing `.fcbak` format or restore flow. The new line is derived from the same durable collections already used by the Monthly Command Archive and already included in the validated offline backup. Following a restore, it will rebuild the same continuous timeline from the restored records, including all historical years.

## Protected Behavior

The following will remain unchanged:

| Protected area | Preservation commitment |
|---|---|
| Profile-logo system | Appearance, position, tap mechanism, replay behavior, cinematics, and audio rules remain untouched. |
| Existing archive | Current yearly line graph, year selector, month grid, month details, metric choices, and transparency text remain available and retain their current functions. |
| App systems | Missions, timing, rewards, XP, gold, emotions, distractions, Google Sheets, Offline Backup File, app name, package identity, and launcher branding remain unchanged. |
| Existing visuals | No completed animation, current Dashboard card, or unrelated screen layout will be changed. |

## Validation Before Checkpoint

I will add deterministic coverage for multi-year chronological ordering (including 2026–2029), automatic extension into a new local month/year, exact reuse of the established growth score, missing-data honesty, archive-after-backup equivalence, bounded timeline-window rendering, cache reuse, and protected interaction/rendering boundaries.

I will then run the full required suite: TypeScript checking, all Vitest tests, linting, server build, and static export. The Metro preview will remain available. I will not start an APK build.

## Approval Needed

If this matches exactly what you want, reply with:

> **Approve exactly this Lifetime Growth Trajectory plan.**

Only after that explicit approval will I implement it.
