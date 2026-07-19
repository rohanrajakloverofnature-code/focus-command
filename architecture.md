# Focus Command — Data, Sync, and Game-Logic Architecture

## Architectural Principle

Focus Command is **local-first** so that starting, pausing, completing, and reviewing a mission always works even without a connection. The user's selected Google Sheet is the only persistent cloud data store and is treated as the external source of truth. A device-local encrypted/cache layer exists only to make the app responsive offline and to hold an ordered write queue until synchronization succeeds. The application does not introduce a second cloud database for gameplay records.

Google authorization follows an installed/mobile OAuth flow using PKCE and the minimum spreadsheet access scope necessary for the selected workbook. Google OAuth requires an app-specific client configuration, consent screen, and enabled Sheets API before live connection can be activated. The native client must never contain a confidential client secret; access credentials are stored only in secure device storage and any optional server token-exchange pathway keeps confidential material server-side. [1] [2] [3]

## Single-Workbook Contract

Each player selects or creates **one Google Spreadsheet**. The app inspects it during connection, creates only missing tabs, and stores an `app_schema_version` in the `FC_Metadata` tab so that upgrades are explicit and reversible. Every row has a stable UUID, `created_at`, `updated_at`, `device_id`, `revision`, and `deleted_at` column where appropriate. Records are append-first and use soft deletion, which makes history, import, conflict recovery, and audit-friendly troubleshooting possible in a flat spreadsheet environment.

| Sheet tab | Row granularity | Primary purpose |
| --- | --- | --- |
| `FC_Metadata` | One row per schema/config record | Schema version, player-selected workbook identity, sync cursor, migration history |
| `FC_Player` | One active player profile | Name, energy settings, level settings, title configuration, daily target, accessibility preferences |
| `FC_Combo_Tiers` | One tier | Unlimited configurable streak thresholds, multiplier, order, enabled state |
| `FC_Missions` | One mission | Planned/active/paused/completed tasks, metadata, timing aggregates, rewards applied |
| `FC_Mission_Sessions` | One start/pause/resume/end event stream | Exact timing events needed to recompute invested time safely |
| `FC_Reflections` | One post-mission response set | Emotional data, friction, motivation, skills, mini-achievement, configurable answers |
| `FC_SRS_Queue` | One topic/review cycle | Topic, subject, interval stage, due date, completion and overdue state |
| `FC_Bosses` | One boss | Objective, deadline, status, reward and calculated completion data |
| `FC_Journal` | One day entry | Daily reflection, points, optional note, lifeline contribution |
| `FC_Rewards` | One catalog item | User reward, weapon, power-up, cost, loot eligibility, probability weight |
| `FC_Transactions` | One immutable balance event | Gold earned, purchase, refund, loot grant, multiplier activation |
| `FC_Inventory` | One owned item | Purchased weapons/power-ups and activation state |
| `FC_Progression_Ledger` | One awarded progression event | Base XP, combo multiplier at award time, power, gold, level before/after |
| `FC_Lifeline` | One year or dated point | Manual life-performance/experience data plus journal-derived increments |
| `FC_Custom_Graphs` | One graph definition | Up to three user graphs and their selected data series |
| `FC_Custom_Questions` | One reflection field definition | Configurable post-mission question labels, controls, choices, and mappings |
| `FC_Sync_Log` | One synchronization operation | Queue item, result, timestamp, retry reason, and resolved conflict record |

The workbook remains useful to the user outside the app: each tab uses a frozen, human-readable header row and preserves original record IDs. Column changes are additive. Rather than changing or overwriting old rows during a schema upgrade, the client adds columns or a new versioned tab and records the migration in `FC_Metadata`.

## Sync Contract

The app writes every action locally first. A completed mission therefore produces a local `mission`, `session`, `reflection`, `progression ledger`, `transaction`, SRS, and sync-queue update inside one atomic state transition. The synchronization layer then sends mutations in timestamp order, resolves an acknowledgement, and marks each local queue entry as synced. Reading the sheet refreshes the local cache after its pending write queue has been flushed.

| Situation | Behavior |
| --- | --- |
| Offline completion | Save locally, show “Saved on this device,” and queue a mutation without blocking rewards or charts. |
| Reconnected device | Flush queued immutable events first, then fetch changed rows and update the local cache. |
| Missing required tab | Create the missing tab with the current header schema in the same spreadsheet. |
| Existing compatible workbook | Import known `FC_*` tabs, preserve manual columns, and display an import summary. |
| Manual concurrent edits | Compare `revision` and `updated_at`; automatically merge non-overlapping fields, otherwise show a clear conflict choice. |
| Deleted local record | Write a soft-delete timestamp so that another device does not unintentionally restore it. |
| OAuth expiration | Preserve the local queue, request reauthorization only when a refresh cannot recover access, and never silently discard work. |

## Core Domain Model

The product uses typed records rather than screen-specific state. All timestamps are ISO 8601 UTC instants; local calendar-day calculations explicitly use the player’s selected timezone. Durations are stored in milliseconds but shown in **hours** everywhere user-facing.

| Entity | Key fields | Derived relationships |
| --- | --- | --- |
| `PlayerProfile` | name, timezone, dailyTargetXp, energyRules, levelRules, activeTitleSet | Owns all configuration and presentation defaults |
| `Mission` | title, subject, category, difficulty, baseXp, bossId, topic, revisionEnabled, status | Has sessions, reflection, SRS topics, ledger award, and optional boss |
| `MissionSession` | missionId, startedAt, pausedSegments, endedAt | Computes precise invested time; supports multiple pauses |
| `Reflection` | missionId, feelings, friction, motivation, skills, miniAchievement | Feeds Wall of Fame, emotional analytics, skill charts, and custom graphs |
| `SrsTopic` | missionId, topic, stage, dueAt, completedAt, subject | Feeds pending revisions and subject capture progress |
| `Boss` | title, deadlineAt, missionIds, status, reward | Uses linked mission completion to calculate progress |
| `JournalEntry` | localDate, betterThanYesterday, points, note | Adds a derived contribution to the lifeline series |
| `Reward` | name, category, goldCost, lootEnabled, lootWeight, effect | Is purchasable only when the gold ledger supports it |
| `Transaction` | type, goldDelta, sourceId, effectiveOn, metadata | Is immutable and determines both lifetime and available balance |
| `ProgressionEvent` | baseXp, comboAtAward, powerAwarded, goldAwarded, occurredAt | Is immutable and prevents later streak changes from rewriting history |
| `CustomGraph` | title, series[≤5], aggregation, dateRange | Resolves only to approved reflection and activity fields |

## Calculation Engine

### Authoritative design choice: awarded power does not retroactively change

The requested relationship, **Total Power = Total XP × active combo multiplier**, is applied at the moment an XP award is created. Reapplying today’s multiplier to all historical XP would make past XP, earned gold, unlocks, and purchase affordability change every time a streak changes. Focus Command therefore stores the multiplier applied to each award and sums the resulting historical power. This preserves the game rule while keeping progression and purchases stable.

> `powerAwarded = baseXpAwarded × activeComboMultiplierAtCompletion`
>
> `totalBaseXp = Σ baseXpAwarded`
>
> `totalPower = Σ powerAwarded`
>
> `todayPower = Σ (todayBaseXpAwarded × activeComboMultiplierAtCompletion)`

The Home screen still presents the current multiplier prominently and explains that it affects new mission completions. Any optional “projected power” view may display `nextMissionBaseXp × activeMultiplier`, but it never overwrites the ledger.

| System | Deterministic rule | Customizable values |
| --- | --- | --- |
| Invested time | `endedAt − startedAt − Σ pausedSegmentDuration`; a running mission uses `now` in place of `endedAt` | None; calculation is audited from event timestamps |
| Base XP | The mission’s configured XP award is granted once when completion is confirmed | Mission XP, default XP by difficulty |
| Combo tier | Find the highest eligible tier whose required qualifying-day streak is met | Any number of tiers; required days and multiplier per tier |
| Missed days | One missed qualifying day drops one tier; a second consecutive missed day drops another tier; the third consecutive missed day resets to 1.00x | Qualifying-day rule, tier ordering, base multiplier |
| Total Power | Sum immutable `powerAwarded` events | N/A; tied to awarded base XP and combo rule |
| Gold | Standard gold accrual is one gold for every ten power. `goldAwarded = floor((powerCarry + powerAwarded × activeGoldMultiplier) / 10)` and residual power is retained as `powerCarry`. | Gold ratio, rounding rule, scheduled multiplier inventory effects |
| Current gold | `Σ transaction.goldDelta` | Purchases, refunds, loot grants, and gold boosts must all use transactions |
| Lifetime gold | `Σ positive transaction.goldDelta` | Includes standard power conversion and accepted bonus transactions |
| Energy | At local-day start, energy is set to configured daily maximum. Completion cost is `minutesInvested × difficultyRate`, clamped to `[0, maxEnergy]`. | Max energy and rates; defaults are Easy 0.15, Medium 0.30, Hard 0.50 energy/minute |
| Level | Highest level whose cumulative power threshold is met, capped at 500 | Full threshold curve and cap, default linear increment |
| Title | `titleIndex = floor((level − 1) / titleChangeInterval)`, clipped to title-list bounds | Title list, interval; default interval is 10 levels |
| Daily mission progress | `min(100, todayBaseXp / dailyTargetXp × 100)` | Daily target XP and target metric choice |
| Next title progress | Progress between current 10-level title boundary and next title boundary | Level thresholds and title interval |
| SRS initial due date | Logging a revision topic schedules stage 1 for local calendar date + 1 day | Intervals default to 1, 7, and 30 days |
| SRS advancement | Completing a due stage schedules the next interval from the completion local date. Overdue tasks remain due until completed. | Interval list and completion behavior |
| Wall of Fame | Include mini-achievement entries with rating greater than 3; expires seven local days after completion | Rating threshold and duration |
| Achievement Radar | Include a mission whose after-feeling is “Great”; expires seven local days after completion | Eligible feeling labels and duration |
| Lifeline contribution | `journalContribution = journalPoints × 0.05` and is accumulated as a dated derived series. It never edits the user’s manual historical baseline. | Target line(s); default contribution increases Life Performance |

## Defaults That Preserve User Control

The initial player profile contains a 50-title sequence so that a rank can change every ten levels through level 500. The provided titles are preserved and extended with clearly editable entries. The initial combo tiers are 1 day = 1.00×, 3 days = 1.10×, 7 days = 1.30×, 14 days = 1.50×, and 30 days = 1.75×. These defaults are examples, not restrictions; the user can add, reorder, edit, disable, or remove tiers in Settings.

All calculations use a single pure game-engine module. Screens render values from that module but do not calculate currency, time, streaks, or analytics themselves. This separation allows deterministic tests to verify that the same event sequence produces the same XP, power, gold, energy, SRS, dashboard, and sheet rows.

## Google Sheet Connection Readiness

The production connection layer will request only the scopes necessary to read and write the selected sheet, following Google’s least-privilege guidance. The user will need to create or provide platform-specific OAuth client IDs after enabling the Google Sheets API and configuring the Google consent screen. During development without those credentials, the same sync interface remains usable in a clearly labeled local-preview state; it never claims that remote sheet writes succeeded. [1] [2] [3]

## References

[1] [Google — OAuth 2.0 for iOS & Desktop Apps](https://developers.google.com/identity/protocols/oauth2/native-app)

[2] [Google — Configure the OAuth consent screen and choose scopes](https://developers.google.com/sheets/api/guides/authorizing)

[3] [Expo — AuthSession](https://docs.expo.dev/versions/latest/sdk/auth-session/)
