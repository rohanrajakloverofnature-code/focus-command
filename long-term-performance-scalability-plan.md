# Focus Command: Long-Term Performance and Scalability Plan

**Status:** Read-only audit and proposed plan only. **No application code, data, layout, feature, calculation, animation, profile-logo behavior, cinematic behavior, app identity, or backup behavior has been changed.**

## Audit conclusion

Focus Command already has important protections in place. Its ordinary writes are coalesced, narrow state selectors are available, primary large collections use virtualized lists, archive output is derived rather than duplicated, and lifetime charts are already displayed in bounded monthly windows. These are sound foundations for a premium offline app.

The remaining long-term risk is not a single broken screen. It is the **cumulative cost of treating an ever-growing lifetime history as one wide in-memory and persistence workload**. After years of completions, reflections, transactions, distractions, revision topics, and repeatable missions, several currently correct operations can repeatedly scan or serialize more history than the visible screen needs. This can add pressure to cold launch, an ordinary save, dashboard refreshes, weekly review construction, archive subject switches, and very large history/topic lists.

| Audited area | Existing protection | Long-term scaling risk to address |
|---|---|---|
| Offline persistence | Ordinary writes are coalesced and flushed safely. | Serializing one increasingly large state snapshot can eventually take noticeable JavaScript-thread time after a change. |
| Dashboard and weekly review | Cached dashboard derivations and narrow selectors already reduce unrelated rerenders. | Weekly and related summaries still filter lifetime records when the relevant state snapshot changes. |
| Command Archive | Archive results are cached by immutable state, topic work is deferred, and lifetime graph windows are bounded. | New immutable snapshots invalidate broad caches; topic grouping and subject-lens construction can revisit all historical source records. |
| Charts | A monthly chart is naturally limited to days in one month, and lifetime windows are limited to 24 points. | Chart inputs and SVG geometry should remain explicitly bounded and memoized at every call site as more source history exists. |
| History and topic lists | `FlatList` is already used for the principal long lists. | Very large lists still need tuned render batches, stable row props, and date/subject lookup paths that do not begin with a lifetime scan. |
| Launch and media | The launch sequence is non-blocking and media cleanup is centralized. | The new data architecture must not accidentally preload historical media or compete with launch/cinematic playback. |

> **Important scope point:** no mobile app can honestly guarantee zero processing time for infinite, unbounded data. This plan makes the normal interactive path scale with the **currently visible time range and rows**, not with every record ever created, and verifies that guarantee with controlled large-history regression tests.

## Proposed internal optimization plan

The following work is deliberately internal. The screens, layout, controls, navigation, calculations, rewards, mission rules, visual style, touch semantics, profile-logo mechanism, launch animation, character cinematics, Google Sheets behavior, app name, package identity, and Offline Backup File user flow will remain exactly as they are.

| Phase | Internal change | How the visible app continues to work |
|---|---|---|
| 1. Establish performance contracts | Add deterministic large-history test fixtures and measurement contracts for cold hydration, persistence scheduling, archive derivation, history filtering, list windowing, chart point limits, repeated navigation, and rapid taps. | No debug screen, telemetry, account, network service, or user-facing setting will be added. These tests only protect the existing experience. |
| 2. Create invalidation-aware lifetime indexes | Build internal, in-memory indexes keyed by month, subject, completion ID, revision topic, and active filters. Update or invalidate only the affected indexed segment after an action rather than rebuilding every lifetime grouping after every state replacement. | All figures remain calculated from the same durable records with the same formulas. The indexes are non-authoritative caches, never a replacement for source history. |
| 3. Bound visible derivation work | Ensure dashboard, weekly review, archive, subject lens, comparison, and history filters request only the date/subject slices they need. Preserve the current 24-point lifetime window and the 31-day monthly chart bound, while memoizing stable chart geometry and selected-window inputs. | Every historical month and exact record remains accessible. The app will simply calculate the open slice first rather than repeatedly processing unrelated years. |
| 4. Harden virtualized long lists | Apply carefully measured `FlatList` window, batch, clipping, stable-key, memoized-row, and `getItemLayout` optimizations only where row height is genuinely fixed. Avoid nested vertical rendering work and prevent selected/filter changes from recreating unaffected rows. | Existing order, cards, labels, scrolling direction, filters, buttons, and navigation remain unchanged. No history is paginated away, hidden, or summarized instead of shown. |
| 5. Make persistence scale safely | Replace broad repeated serialization work with internally versioned, append-aware persistence scheduling. If storage partitioning is needed after profiling, use a copy-first, validated migration with a rollback-safe manifest; source records remain complete and recoverable. | The app stays fully offline. No backend is introduced. Existing stored data is migrated without loss, and all existing backup/restore and Google Sheets source data remain complete. |
| 6. Protect startup and interactions | Keep active mission, settings, and navigation-critical data on the earliest interactive path; schedule non-visible archive/index preparation after the UI is ready. Retain the existing confirmed-tap behavior and media cleanup rules, while ensuring maintenance work yields before input, scroll, animation, video, or audio playback. | Launch visuals, motivation quote, glaze, fire/custom launch media, tap feedback, profile-logo interaction, and all existing animation timing remain untouched. |
| 7. Preserve backup and recovery integrity | Extend backup and restore parity coverage to any internal persistence migration. Derived indexes are rebuilt or independently verified from durable source records and never become a single point of failure. | A backup still contains every real mission, completion, reflection, reward, transaction, revision, distraction, setting, and local media item. Restoring it rebuilds the same user-visible history. |

## Safety and performance rules

The implementation would preserve the following hard boundaries throughout the work.

| Protected boundary | Commitment |
|---|---|
| Source-of-truth data | No historical completion, reflection, reward, gold transaction, revision, distraction, mission, media reference, or other durable record is deleted, capped, merged, or approximated. |
| Calculation parity | XP, power, gold, energy, combo, inventory, titles, milestones, analytics, archive metrics, revision percentages, and all current formulas remain byte-for-byte equivalent for the same durable records. |
| User-facing behavior | No UI redesign, navigation change, control relocation, new system, login, sync provider, subscription, or visible performance setting is introduced. |
| Protected media and profile behavior | The profile-logo mechanism, its position, tap/replay behavior, completed animations, character mappings, audio timing, and launch customization remain unchanged. |
| Offline operation | The app remains offline-first. Google Sheets remains the only existing external synchronization path. |
| Recovery | Changes are introduced behind deterministic migration, backup/restore parity, reload, and rollback tests before being checkpointed. |

## Validation matrix after implementation

The optimization will be accepted only if it passes the existing full quality gate **and** new deterministic scalability contracts. The data fixtures will be test-only, repeatable profiles that exercise realistic record shapes over multi-year timelines; no personal user data will be used.

| Test area | Required verification |
|---|---|
| Data parity | Large-history indexes, filtered views, summaries, archive months, subject lenses, comparison values, and revision percentages match the existing source-record calculations exactly. |
| Persistence and recovery | Repeated writes, reload during a pending write, app backgrounding, offline backup export, backup restore, legacy-state migration, and migration-interruption recovery retain every source record. |
| Responsiveness | Rapid taps, repeated navigation, filter changes, archive window changes, subject-lens selection, comparison selection, and scroll gestures do not trigger duplicate actions or broad lifetime recomputation on the input path. |
| Long lists and charts | Thousands of historical rows remain virtualized with stable keys; mounted row counts and chart point counts stay bounded to the visible selection. |
| Media lifecycle | Repeated launch, cinematic replay, navigation away, and return do not leave additional audio/video players or block touch/scroll work. |
| Full quality gate | `pnpm check`, the complete Vitest suite, lint, and static export all pass before a checkpoint. The installed-app flow will then be checked for cold launch, warm launch, scrolling, rapid controls, archive/history navigation, animation playback, and restore behavior. |

## Expected outcome

The app will retain its exact current appearance and gameplay while its expensive internal work becomes **range-limited, cache-aware, virtualized, and recovery-safe**. A user with many years of history should experience the same immediate control feedback, smooth scrolling, stable charts, and responsive navigation as a newer user, without sacrificing the completeness of any lifetime record.

## Approval request

If you approve this exact plan, I will implement **only** the internal scalability and performance protections described here, then run the complete validation and recovery suite, save a checkpoint, and push to GitHub. I will not start an APK build.
