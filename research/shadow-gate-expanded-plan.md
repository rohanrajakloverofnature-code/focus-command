# Shadow Gate — Expanded Approval Plan

**Status:** Planning only. This document changes no application code, saved data, screen, mechanism, or user-facing behaviour.

## What Shadow Gate is for

Shadow Gate is an entirely optional initiation tool for the specific moment when a planned task feels hard to begin. It is not a timer, a streak, a task manager, a diagnostic, or a replacement for a normal mission. It offers a short RPG-style encounter that turns a vague feeling of resistance into one chosen, very small real-world action.

The design draws on evidence that procrastination is often related to short-term emotion regulation rather than a simple lack of discipline, and that specific action plans, psychological distance, and autonomy-supportive choices can help bridge the gap between intention and action.[1] [2] [3] [4]

## Exact location and normal mission protection

Shadow Gate appears **only** for a planned mission. It is a secondary outlined action directly below the existing **Start Mission** control on that mission’s detail screen. The Mission Board’s existing normal start action stays untouched.

| Situation | Shadow Gate behaviour | Normal mission behaviour |
|---|---|---|
| Planned mission | The optional `BREACH SHADOW GATE` action is available. | `Start Mission` still starts immediately and exactly as today. |
| Active or paused mission | No Gate action is visible. | Continue, pause, resume, and end behaviour stays unchanged. |
| Completed or deleted mission | No Gate action is visible. | Existing history and deletion behaviour stay unchanged. |
| User closes the Gate | Nothing is saved. | The normal Start action remains available. |

The Gate never takes over the normal button. The user can ignore it forever and Focus Command continues to behave exactly as it does today.

## How the encounter feels

The Gate is a compact, jet-black bottom sheet rather than a new full screen. It has a slim static character-colour seal, a subtle neutral glass edge, and a single short line-ignition when opened. It contains no video, audio, live blur, looping particles, image analysis, or persistent animation.

The sheet reads as a private encounter, not as a lecture. The language is short, voluntary, and factual. It never calls the user lazy, weak, behind, or failing.

### The four-step encounter

| Step | What the user sees | What the user does | What is saved |
|---|---|---|---|
| 1. Name the shadow | `What is blocking the entrance?` with five compact choices. | Chooses one resistance state or closes the sheet. | Nothing. |
| 2. Receive a doorway | One short character-framed command. | Reads it, chooses another doorway, writes their own, or closes. | Nothing. |
| 3. Make the move | A quiet confirmation: `I made the move.` | Taps only after doing the tiny real-world action. | A prepared in-memory choice only. |
| 4. Enter mission | `Enter Mission` uses the existing protected start action. | The normal mission begins once. | One Gate entry is saved only after the existing start succeeds. |

There is no countdown pressure. The user may leave at any point. A closed Gate is not a failure, produces no record, and has no effect on XP, Total Power, gold, streaks, achievements, reminders, or mission data.

## The complete doorway library

The initial library contains **126 handcrafted doorways**: twenty-one each for six resistance states. This exceeds the requested 120 strong actions while keeping the library balanced and easy to maintain. Each doorway is deliberately one concrete action that can be done before a normal study or work block; it is not a motivational sentence. All previously proposed wording and actions remain intact; **Discomfort** is an additional sixth choice.

| Resistance state | What it means in plain language | Doorway library examples | Number of initial doorways |
|---|---|---|---:|
| **Too Big** | The task feels too large to enter. | `Open the material. Do not read yet.`; `Write the first question number only.`; `Put the document title at the top of the page.` | 21 |
| **Blank Mind** | The user does not know where to begin. | `Find the last completed line.`; `Write one thing you already know.`; `Open the index and point to one heading.` | 21 |
| **Perfection Fog** | Fear of doing it badly blocks the first attempt. | `Make an ugly first line on purpose.`; `Write a rough answer with no correction.`; `Mark the part you do not understand.` | 21 |
| **Drained** | Energy feels low, so the entrance must be lighter. | `Place the book and pen in front of you.`; `Read the first instruction once.`; `Set up the workspace, then decide again.` | 21 |
| **Discomfort** | Starting feels unpleasant right now. | `Take one slow breath, then open the material.`; `Touch the first tool; no work is required yet.`; `Place the page in front of you, then choose again.` | 21 |
| **Tomorrow** | The mind wants to postpone rather than begin. | `Touch the first tool now.`; `Do one setup action before closing this sheet.`; `Write today’s date beside the task.` | 21 |

The selector first uses the mission’s category and subject to avoid unsuitable wording. For example, a study mission may show `write the first question number`, while an admin or creative-work mission may show `open the document and name the first section`.

The app will never manufacture endless content through an online model. The fixed 126-doorway library is deliberate, reviewable, offline, fast, and stable. It gives every state substantial variation without turning the feature into hundreds of weak or repetitive prompts.

## Screenshot-matched fresh-install colour experience

The screenshot’s premium dark appearance becomes the **fixed starting colour experience for a newly installed app**. A fresh Focus Command profile begins in Dark theme with the following three baseline values: **Command accent `#8B5CF9`**, **Screen background `#0B1220`**, and **Card surface `#0A0A0A`**. Every other colour token—including primary and secondary text, borders, success, warning, and error—remains exactly as it is today.

This is not a global palette replacement. The implementation uses a small explicit **fresh-install palette baseline** rather than rewriting the current global theme values. Existing saved profiles keep their present theme and every manually entered palette value byte-for-byte. Existing users are never silently switched to the screenshot colours. A user who later resets one of these three fields returns to the correct baseline for their own profile: the screenshot baseline for a new profile, or their preserved legacy baseline for an existing profile.

| Profile situation | Colour result |
|---|---|
| Brand-new installation after the approved update | Dark theme starts with `#8B5CF9`, `#0B1220`, and `#0A0A0A`; all other existing token values stay unchanged. |
| Existing profile with no palette edits | It retains its current visual result; no automatic recolouring occurs. |
| Existing profile with any manually chosen colour | The exact user choice remains authoritative. |
| New or existing profile after a manual colour edit | The current Color System remains the authority for that particular edited token. |
| Reset on a new profile | Restores the screenshot-matched starting colour for that token. |
| Reset on an existing profile | Restores the prior legacy starting colour for that token, preserving the experience the user already had. |

The Color System stays editable unless the user explicitly asks for a permanent lock. The word **fixed** is therefore implemented as a protected new-install default—not a removal of the existing colour customisation the user has already requested elsewhere in Focus Command.

### Personal doorway option

At every Gate, the user can select **My own doorway** and write one short private action, up to 90 characters. For example: `Find my calculator` or `Open the marked chemistry page.` The app stores it locally after a successful entry. The user can later pin, edit, or delete it. Personal doorways never leave the phone.

The next time a similar mission is opened, a successful pinned doorway may be shown before the library. The user can always ask for a different doorway; the app never forces a repeated one.

## What the app learns—and what it does not claim

Shadow Gate uses only **honest entry evidence**. It cannot prove that a doorway caused good work, so it will never say that it did. It only knows that the user selected a doorway and then entered a normal mission.

| Evidence rule | Meaning |
|---|---|
| A doorway becomes a `known crossing` only after **three separate Gate-to-mission entries**. | One lucky use cannot create a false claim. |
| A match requires the same resistance state and broadly matching mission context: subject/category and local time band. | A late-evening Maths start is not treated as proof for a morning creative task. |
| The result is phrased as a factual history. | Example: `You entered three similar missions after this doorway.` |
| A later long session or completion may be shown as extra context, but never as a promised outcome. | Example: `One of those entries became a 50-minute session.` |
| A Gate that is closed does not count against the user. | There is no avoidance score, failure rate, or shame statistic. |

The time bands are kept simple and local: **morning (05:00–11:59), afternoon (12:00–16:59), evening (17:00–21:59), and night (22:00–04:59)**. No location, device sensor, browser data, cloud account, or background tracking is used.

## Saved records: exactly what is stored

One small entry is recorded **only after** the existing mission-start action succeeds. Opening, choosing a shadow, typing a doorway, backing out, or pressing the original Start button produces no Gate record.

| Stored field | Why it is needed | Example |
|---|---|---|
| Gate-entry ID | Stable list key and safe deletion. | `gate_…` |
| Mission ID | Links the entry to the exact mission. | `mission_…` |
| Started-at timestamp and local date | Shows the real time of entry and local time band. | `2026-08-19T…` / `2026-08-19` |
| Subject and category snapshot | Allows historic records to remain understandable even if the mission is later renamed. | `Mathematics` / `Study` |
| Resistance state | Groups comparable experiences. | `perfection_fog` |
| Doorway ID or personal doorway snapshot | Shows exactly which action the user chose. | `rough-first-line` / `Open first page` |
| Source | Distinguishes library, pinned, or personal doorway. | `library` |
| Optional linked completion ID | Connects a later ordinary completion when available; never creates a new reward. | `completion_…` |

The entry does **not** contain an emotion diagnosis, uploaded image/video/audio, free-form internal thought, GPS location, contact, device identifier, XP change, gold, or a background-use log.

## What the user can see in the Dashboard

Yes—Shadow Gate will have a purposeful Dashboard presence, but it will not add a large permanent graph or change existing cards.

The Dashboard gains one compact card in the existing **Behavioral Tendency** area, titled **Crossed Gates**. It is a read-only summary with an in-card range selector: **Last 7 Days**, **Last 30 Days**, and **Custom Date Range**. Choosing Custom opens the familiar two-date selection pattern; nothing is saved or altered when a range is viewed. If there is no Gate history for the chosen range, the card uses a calm empty state rather than a score, warning, or guilt-inducing message.

| Card element | What it shows |
|---|---|
| Range selector | Last 7 Days, Last 30 Days, or a user-selected inclusive Custom Date Range. |
| Main count | `8 Gates crossed` means eight normal mission starts followed an intentional Gate entry in the selected range. |
| Most useful doorway | The one with the most qualifying matched entries, if at least three exist. |
| Gentle detail | Example: `“Open first page” led into 3 similar evening study missions.` |
| Action | `View Gate Ledger` opens a separate, virtualized history screen. |

The card does **not** show a score, percentage, streak, red warning, missed-day count, ranking, prediction, medical insight, or overall productivity judgement. It is evidence for starts, not a judgement about worth or discipline.

### Gate Ledger detail screen

Tapping the Dashboard card opens a dedicated **Gate Ledger** screen, reusing the app’s existing fast, virtualized analytic-list style. This avoids crowding the Dashboard and avoids a costly new permanent chart.

The ledger gives four optional filters: **Last 7 Days**, **Last 30 Days**, **All Time**, and **Custom Date Range**. The Custom range is shared with the Dashboard card when the user arrives from it, so the detail list opens on exactly the data the user was viewing. It also has a resistance filter and a subject/category filter. Every row tells the truth: exact date, mission title, subject, selected shadow, selected doorway, and whether the normal mission later has a linked ordinary completion. It does not hide repeated use of the same mission.

At the top, a small **Doorway Cabinet** lists only doorways with three or more matching entries. Each cabinet item shows the exact evidence count and a `Use again` action that only preselects the doorway next time; it never starts a mission automatically.

## Controls and user ownership

Shadow Gate receives a compact **Shadow Gate** section in the existing customization/settings route; it does not become a sixth tab.

| Control | Behaviour |
|---|---|
| **Show Shadow Gate** toggle | Hides or shows the optional planned-mission entry. Turning it off keeps all existing records; it does not delete them. |
| **Personal Doorways** | View, edit, pin, unpin, or delete user-written doorways. |
| **Gate Ledger** | Opens the same evidence view available from Dashboard. |
| **Delete one Gate entry** | Removes only that Gate entry after confirmation. The underlying mission and completion remain untouched. |
| **Clear Gate history** | Explicit destructive confirmation removes Gate entries and personal doorway preferences only. It does not touch missions, completions, reflections, revisions, rewards, power, gold, portraits, media, or anything else. |

There are no Gate-specific notifications, forced reminders, daily targets, or automatic opening behaviour.

## Mission deletion and record integrity

If a user deletes a mission, its linked Gate entries are removed in the same atomic persistence update. This prevents a deleted mission’s title from continuing to influence the Gate Ledger or personal evidence. A normal mission completion, progression award, revision, or reflection still follows their existing deletion rules; Shadow Gate does not rewrite them.

If the user renames a mission, historic Gate rows keep their stored title/subject snapshot as a truthful record of what the user saw at that time. The current mission title can still be shown as a secondary current reference when it exists.

## Offline backup and old-phone safety

The current offline backup format remains the container. Shadow Gate records, personal doorways, pinned-doorway choices, visibility preference, and the optional Dashboard custom-range preference are small optional state fields inside the existing local profile data. Existing stream-based restore, validation, and all-or-nothing safety remain unchanged.

| Situation | Safe result |
|---|---|
| Old saved profile opens after update | It receives an empty Gate history and default visible preference. Nothing else is recalculated. |
| Old backup restores after update | It restores normally with empty Gate data. |
| New backup restores after update | Gate history, personal doorways, pinned doorway choices, visibility preference, and custom-range preference restore exactly. |
| New backup opens in an old app | The old app continues to ignore unknown optional data according to the existing backward-compatible state reader. |
| Large backup | Gate records remain small JSON metadata; current chunked streaming restore remains the safety path. |

No saved portrait, cinematic video, custom sound, backup file, mission, revision, reward, historical progression event, or other user data is removed or resized by this feature.

## Performance and interaction guarantees

Shadow Gate is designed not to degrade responsiveness after several minutes or years of use. Its fixed 126-doorway library is bundled static data and is never recreated during a render. Personal doorways are short, normalized, de-duplicated only when the user deliberately saves the same text, and retained unless the user deletes them; no useful user data is automatically capped or purged.

The new Gate state is isolated behind narrow selectors, so Home, normal mission lists, the protected cinematic, revisions, Focus Friction, rewards, and unrelated Dashboard cards do not rerender when a Gate entry is written. Doorway matching is a pure, memoized calculation keyed only by the Gate-entry array identity, active mission context, and selected date range. It runs only when the Gate sheet, Crossed Gates card, or Ledger is visible.

The Crossed Gates card uses a cached range key (`last-7`, `last-30`, or the chosen start/end date) and computes only its selected range. The complete Gate Ledger is virtualized with conservative batch sizes; filtering never modifies records, and it does not render the whole history at once. The custom date chooser computes results only after the user confirms both dates, not after every tap.

The Gate has no timer, polling, background job, network request, image scan, audio player, live blur, video player, or always-running animation. Reduced Motion shows the seal immediately. The existing one-frame action guard is kept, while a local in-flight start lock prevents a second tap from creating a duplicate Gate entry or calling the start action twice. Persistence remains coalesced and skips duplicate snapshots; a Gate record is appended only after a successful normal mission start.

### Long-session performance proof

Before release, the app will receive a fresh read-only performance audit after the new feature is integrated. The proof suite will repeatedly switch routes, open/close Gates, start normal missions, change date filters, scroll an all-time ledger, enter/leave Dashboard, and persist a large fixture for a simulated long session. It will verify selector isolation, bounded rendering, no retained sheet/timer references, no duplicate actions, stable memory/object counts where measurable, and no growing write queue. The feature will not be published until this suite, the existing long-session regressions, TypeScript, full tests, lint, web export, and Android JavaScript export preflight all pass.

## Implementation sequence and proof

If approved, implementation will be completed in these safe stages.

1. Add isolated optional types, migration defaults, reducer actions, selectors, and pure matching helpers. Do not modify existing mission, reward, or cinematic calculations.
2. Add the static 72-doorway library—including Discomfort—and unit-test its category/subject-safe selection, personal doorway validation, neutral Discomfort wording, and evidence threshold.
3. Add the compact planned-mission sheet and route it through the existing normal mission-start callback only after `I made the move → Enter Mission`.
4. Add the Dashboard Crossed Gates card, its Last 7 / Last 30 / Custom Date Range controls, virtualized Gate Ledger, and settings controls using narrow selectors and no new tab.
5. Extend backup round-trip and hydration tests to cover Discomfort, personal doorways, pinned choices, and Dashboard custom-range preferences; add deletion-cascade coverage.
6. Add direct regression tests for normal Start unchanged, Gate close creates no record, exactly-one start and record under rapid taps, disabled preference, legacy data, old/new backup compatibility, personal data deletion scope, custom-range boundaries, long history, reduced motion, and no cinematic/media/audio interaction.
7. Run the dedicated long-session stress suite, then TypeScript, all tests, lint, web export, Android JavaScript export preflight, and the existing long-session performance suite before any GitHub push. No APK build or GitHub Action build will be triggered.

## Protected features that stay exactly unchanged

Normal mission start, mission timing, pause/resume/end, mission results, debriefs, revision cadence, Focus Friction, XP, Total Power, gold, rewards, inventory, bosses, profiles, character achievement path, Home tickers, Dashboard’s existing calculations, notifications, custom sounds, custom portraits/videos, themes, offline operation, existing backup semantics, and the entire protected cinematic—including timing, media, audio, reward values, interactions, animation sequence, and appearance—remain unchanged.

## References

[1] Sirois, F. M., & Pychyl, T. A. (2013). *Procrastination and the Priority of Short-Term Mood Regulation.* https://doi.org/10.1111/spc3.12011

[2] Gollwitzer, P. M., & Sheeran, P. (2006). *Implementation Intentions and Goal Achievement: A Meta-analysis of Effects and Processes.* https://pmc.ncbi.nlm.nih.gov/articles/PMC4500900/

[3] Kross, E. et al. (2014). *Self-talk as a regulatory mechanism: how you do it matters.* https://pmc.ncbi.nlm.nih.gov/articles/PMC2884401/

[4] Oyserman, D. (2011). *Culture as Situated Cognition: Cultural Mindsets, Cultural Fluency, and Meaningful “Hard” Tasks.* https://pmc.ncbi.nlm.nih.gov/articles/PMC3079278/
