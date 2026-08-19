# Shadow Gate — Approval-Stage Implementation Plan

**Status:** Planning only. No Focus Command application code, visual, data, timing, audio, backup behaviour, or user-facing mechanism has been changed.

## What Shadow Gate is for

Shadow Gate is an optional pre-start RPG encounter for the specific moment when a planned mission feels hard to begin. It does not try to motivate, shame, diagnose, time, block, or reward the user. It gives the user one concrete physical “breach move” and then returns them to the normal mission start.

The design is based on the evidence that procrastination can be a short-term way of repairing an unpleasant emotional state, rather than simple laziness; that putting a feeling into words can support emotional regulation; that a distanced self-perspective can help a person regulate a difficult response; and that concrete if–then action plans can make an intended action easier to begin.[1] [2] [3] [4]

> **The rule:** Shadow Gate may help someone cross the first moment of resistance. It never claims to know their mood, diagnose them, force them to work, or promise a psychological outcome.

## Where it will appear

Shadow Gate will appear **only for a planned mission**. Active, paused, completed, revision, results, dashboard, ticker, character path, profile, settings, notification, and cinematic screens will not be changed.

| Existing location | Planned addition | What stays unchanged |
|---|---|---|
| **Mission board card** | A compact outlined Gate icon beside the existing **Start** button. It has the accessible label “Open Shadow Gate for [mission].” | The current card tap still opens the mission. The existing **Start** button still starts immediately, with the same single-tap behaviour. |
| **Mission detail, planned state** | A thin secondary row below the existing **Start mission** button: **Need a spark? Enter Shadow Gate**. | The existing **Start mission** button remains in the same place and retains exactly the same meaning. |
| **All other states** | No Gate entry is shown when a mission is live, paused, or completed. | No live timer, pause, finish, revision, reflection, result, or deletion workflow is changed. |

This placement gives the feature a clear place at the instant of hesitation without turning the Home screen or Dashboard into a new analytics section.

## How it will feel and work

The interaction is intentionally short: it is a **10–25 second private encounter**, not a second task that users must complete before studying or working.

| Step | What the user sees | What happens internally |
|---|---|---|
| **1. Open the Gate** | A low-motion jet-black bottom sheet rises over the mission screen. The mission title appears at the top, with a small circular character seal and a narrow gate line. | Nothing is written, no mission starts, and no timer begins. |
| **2. Name the resistance** | One question: **“What is blocking the first move?”** Five large choices appear: **Too Big**, **Blank Mind**, **Perfection Fog**, **Drained**, and **Tomorrow**. | The choice remains only in temporary screen memory until the user elects to enter the mission. |
| **3. Receive one breach move** | A short command appears, tailored only from the selected resistance and the existing mission title/topic. For example: “Do not solve the chapter. Open it and write the first question number.” | A deterministic local rule selects one compact action. No online model, prompt generation, or personal data leaves the phone. |
| **4. Make the move** | The user can tap **I made the move**, **Choose another breach**, **Start normally**, or dismiss the sheet. A small 180–240 ms gate-line ignition acknowledges the choice. | Dismissing, changing the breach, or pressing Start normally saves nothing. No reward, XP, gold, streak, or penalty exists. |
| **5. Enter mission** | After **I made the move**, the main button becomes **Enter Mission**. A quiet proof line may appear only when reliable local evidence exists: “This doorway led you into a mission on three similar starts.” | One small gate-entry record and the normal mission start happen together in a single protected action. The ordinary start path stays untouched. |

The screen will use the current app palette, including the user’s custom global colors. The active character’s already cached accent may colour only the gate line and small seal. It will not inspect media, sample a portrait, play a video, use the achievement cinematic, or add a special character-colour setting.

## The five breach moves

The first version will use a carefully written, finite local library. The goal is a physically observable first action, not an abstract instruction such as “be focused.”

| Resistance | Example breach command |
|---|---|
| **Too Big** | “Open the material and write only the first heading or question number.” |
| **Blank Mind** | “Open the page and write one thing you already remember about this topic.” |
| **Perfection Fog** | “Make one deliberately rough first attempt. Do not improve it yet.” |
| **Drained** | “Put the needed material in front of you and set up the first task only.” |
| **Tomorrow** | “Touch the first real work object now: open the file, page, or first problem.” |

These are not medical treatments. They are voluntary entry moves informed by behavioural activation, psychological distance, and implementation-intention research.[1] [3] [4]

## How personal proof will work, honestly

Shadow Gate will not invent a claim such as “this always works for you.” It will use **only confirmed local gate entries**—moments where the user chose a resistance, completed the small breach move, and explicitly tapped **Enter Mission**.

The app will show a proof line only after **at least three** comparable past entries. A comparison must share the same resistance and either the same mission or the same subject/category and broad time window. Until that small threshold exists, the Gate simply shows the breach move and no personalised claim.

For honesty, the first version will say **“led you into a mission”**, not “made you complete the work.” Entering a mission is an exact event the app can know; whether the real-world breach was completed is always trusted to the user. No score is displayed and no history screen is introduced.

## Small, isolated offline record

Only a successful **Enter Mission** creates a record. Closing the Gate, changing an answer, or using the original Start button records nothing.

| Field | Why it exists |
|---|---|
| Record ID and entered-at date | Safely identifies one local encounter and its real time. |
| Mission ID | Allows a user-initiated mission deletion to remove only its linked entries. |
| Subject/category snapshot | Allows a stable, light-weight comparison even if a mission title is edited later. |
| Selected resistance and breach ID | Lets the app make one truthful, local proof line later. |

The record deliberately will **not** contain an emotional diagnosis, free-text private thought, location, contact, cloud identifier, video, audio, image, reward, XP, gold, streak value, or background-tracking data.

## Data, deletion, and backup safety

The record will be a new optional, append-only top-level collection, following the same compatibility approach already used for revision activity history and character milestones.

| Scenario | Safe behaviour |
|---|---|
| **Existing user opens the updated app** | The local collection safely defaults to an empty list. No past gate use is invented and no existing mission data is altered. |
| **Older backup is restored** | Missing Shadow Gate history defaults to an empty list before state validation. The backup remains restorable. |
| **New backup is created** | The normal `state.json` round-trip includes the small new collection automatically; no media/archive path changes are needed. |
| **Mission is deleted by the user** | Only that mission’s linked gate-entry records are atomically removed, matching the current removal of linked reflections, revisions, distractions, progression, and completion data. |
| **Mission is edited** | Existing gate entries retain their own lightweight context, so later title edits do not rewrite historical entries. |

The backup remains completely offline and retains all saved portraits, cinematic videos, custom sounds, and existing backup files exactly as it does now.

## Performance and reliability safeguards

Shadow Gate must not reintroduce the lag issues the project has already guarded against. It will be deliberately lighter than the existing distraction sheet and entirely separate from the protected cinematic.

| Risk | Planned safeguard |
|---|---|
| **Slow Start button** | The ordinary `startMission` action is not touched. Gate entry uses its own one-time action, which starts the mission using the same existing timing helper in the same atomic state update. |
| **Duplicate tap / duplicate record** | Every Gate action uses the existing shared one-frame single-fire button guard plus a local route/action lock. One tap can create no more than one entry and one mission start. |
| **Long-term history growth** | Full records remain safely stored. Matching uses a memoized bounded view of only recent comparable entries; it never scans unrelated app state on every render. |
| **Unrelated rerenders** | The Gate screen subscribes only to one planned mission, profile palette/accessibility fields, and its own small gate-entry slice—not the full Focus Command state. |
| **Animation / battery drain** | No persistent animation, timer, polling, video, audio player, image extraction, live blur, or background task. The gate-line transition runs only after a tap; Reduced Motion renders the final state immediately. |
| **Cinematic risk** | `RankCharacterAchievement`, its video/audio lifecycle, timing, media, reward template, portrait system, launch sequence, and dismissal behaviour are not imported, reused, delayed, or changed. |

## What will remain exactly unchanged

The following remain protected: normal mission start, mission timer, pause/resume, finish flow, reflection/debrief, revisions, distraction logs, XP, Total Power, gold, rewards, transactions, character path, Home tickers, dashboard and archive data, notification behaviour, sound roles, all cinematic timing/media/audio/rewards/interactions, custom portraits/videos/sounds, theme controls, offline operation, backups, restores, and existing app navigation.

Shadow Gate is an **extra optional route into a mission**. It does not sit between the user and the current Start button.

## Validation before any release

If approved, implementation will first receive a focused test set before the normal full project validation. The tests will confirm that ordinary mission start remains byte-for-byte behaviourally identical; Gate dismissal writes nothing; one Gate entry creates one record and one start; repeated taps cannot double-start; no XP/gold/reward/streak change occurs; personal proof appears only after the evidence threshold; mission deletion removes only linked Gate entries; old saves and old backups restore with an empty collection; new backups round-trip the collection; Reduced Motion avoids the transition; and narrow selectors keep unrelated screens isolated.

After that, the full existing validation suite will run: TypeScript, all Vitest tests, lint, static export, and Android JavaScript export preflight. No APK build or GitHub Actions build will be triggered.

## Approval boundary

This plan adds no code today. If approved, work will begin only with the above protected scope. Any discovery that requires changing a protected mechanism will be brought back for a new approval before it is implemented.

## References

[1] [Sirois, *Procrastination and Stress: Exploring the Role of Self-compassion in the Health and Well-being of University Students*](https://pmc.ncbi.nlm.nih.gov/articles/PMC10049005/)

[2] [Lieberman et al., *Putting Feelings Into Words: Affect Labeling Disrupts Amygdala Activity in Response to Affective Stimuli*](https://pmc.ncbi.nlm.nih.gov/articles/PMC2884401/)

[3] [Moser et al., *Third-person self-talk reduces EEG measures of emotional reactivity*](https://pmc.ncbi.nlm.nih.gov/articles/PMC5495792/)

[4] [Gollwitzer and Sheeran, *Implementation Intentions and Goal Achievement: A Meta-analysis of Effects and Processes*](https://pmc.ncbi.nlm.nih.gov/articles/PMC4500900/)
