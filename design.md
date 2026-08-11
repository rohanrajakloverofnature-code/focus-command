# Focus Command — Mobile Interface Design

## Product Intent

**Focus Command** is an offline-first productivity and study companion that frames daily work as a tactical RPG campaign. The product should make a user feel composed, capable, and in control, rather than overwhelmed by a dense game dashboard. The visual language combines a restrained command-center HUD with polished, native iOS interaction patterns. Game feedback is reserved for meaningful moments—task completion, a level change, a loot-box reveal, a boss milestone, and a successful purchase—so that it reinforces focus instead of becoming distracting.

The app is designed **mobile-first for portrait 9:16 use**. Primary actions sit within the thumb zone in the lower half of the screen. The five primary areas remain available through the native bottom tab bar, while optional, high-density configuration and history are organized behind a hamburger menu at the top-left of applicable screens. Tap targets must remain at least 44 × 44 points, sheets should be used for focused creation flows, and longer settings should use grouped native-style lists.

## Information Architecture

| Primary destination | Purpose | Primary action | Secondary access |
| --- | --- | --- | --- |
| **Home** | Player HUD, daily readiness, progression, revisions, bosses, and map status | Start today’s next mission | Settings/menu, revision detail, boss detail |
| **Missions** | Active to-do list, task creation, task execution timer, reflections | Add or start a mission | Task detail, active timer, completion reflection |
| **Journal** | Daily reflection and personal life-progress input | Create today’s journal entry | Historical journal entries, lifeline detail |
| **Rewards** | Gold wallet, real-world rewards, weapons, and power-ups | Redeem or purchase an item | Inventory, custom reward editor |
| **Dashboard** | Historical analytics, emotional insight, wall of fame, configurable graphs | Open an analytic detail | Data provenance, graph configuration |

## Screen List and Layout Specifications

| Screen | Primary content and functionality | Layout and interaction design |
| --- | --- | --- |
| **Home / Command HUD** | First name, current title, energy battery, total XP, active combo, Total Power, today’s XP, gold balances, mission target, title progress, active bosses, pending revisions, invested time, subject-map capture and 30-day journal trend. | A compact top HUD anchors the screen. The animated operative/map hero occupies the upper third. Progress cards use a two-column grid only where metrics are scannable. Revisions and bosses use stacked cards with direct completion/expand actions. A persistent floating “Start Mission” action sits above the tab bar. |
| **Mission Board** | Today, upcoming, active, paused, completed mission groups; filters by subject, difficulty, boss, and revision. | A segmented control is positioned under the title. Mission cards use a difficulty marker, XP, subject, deadline, and timer state. A circular add button in the lower-right opens a creation sheet. |
| **Create Mission Sheet** | Task name, subject, difficulty, XP, boss, category, topic, revision toggle, target date. | A medium-height modal sheet uses grouped fields, choice chips for difficulty, and one primary “Deploy Mission” button pinned above the keyboard. |
| **Mission Detail** | Mission metadata, target boss, earned XP, notes, revision topics, and live timer state. | Before a mission starts, the primary button reads “Start Mission.” While active, a clear elapsed-time display and three actions—end, pause/resume, and log revision—are kept within thumb reach. |
| **Post-Mission Reflection** | Invested time, adaptive reflection prompts, skills, friction, motivation, feeling before/after, and mini-achievement rating. | Short tasks show a lightweight mini-achievement sheet. Tasks lasting at least 45 minutes open a structured, paged reflection flow with selectable chips and optional text. |
| **Revision Detail** | Due topics, stage (Day 1 / 7 / 30), completion action, overdue status, and subject capture effect. | A focused list with a clear stage badge. Completing a revision supplies a small confirmation and advances its due date. |
| **Boss Detail** | Large objective, deadline, mission list, completion percentage, and rewards. | A hero card with deadline urgency and a vertical quest list. A “Create Sub-mission” action is placed near the lower screen edge. |
| **Journal** | Timeline of entries and a prominently displayed daily prompt. | A calm, lower-stimulation visual treatment differentiates reflection from missions. The plus action opens today’s entry and prevents duplicate daily entries without an explicit edit decision. |
| **Journal Entry Sheet** | Date, “Better than yesterday?” choice, self-rating points, optional written reflection. | Uses a short form with large Yes/No controls and an accessible point stepper. The effect on the lifeline graph is explained in supportive microcopy. |
| **Rewards / Armory** | Current gold, personal rewards, gear, next-day gold multiplier items, purchase history. | A wallet header sits at top. A horizontal category selector follows. Reward cards show cost, benefit, availability, and an explicit disabled treatment when gold is insufficient. |
| **Reward Editor Sheet** | Name, description, gold cost, category, optional likelihood for loot drops. | Simple form with live affordability preview. Saved rewards are immediately available in the shop and loot configuration. |
| **Dashboard** | Wall of Fame, achievement radar, Total Power, time, skills, emotions, lifeline, and custom graphs. | A scrollable analyst’s briefing with sections. Each visualization is a tappable card; a header indicates the time range and data source. Charts never rely solely on color—labels and shapes communicate meaning too. |
| **Analytics Detail** | Expanded chart, filters, underlying records, plain-language insight, data source links. | Full-screen detail with a native navigation header, range picker, legend, table/list fallback, and export/sync status where relevant. |
| **Lifeline Editor** | Birth year and baseline life-performance/experience points by year. | A dedicated graph-editing screen uses stepwise year controls and a preview. Daily journal contribution is read-only and clearly distinguished from manually entered history. |
| **Custom Graph Builder** | Up to three graphs, each with up to five post-mission variables. | A configuration list with ordered series rows, metric picker, line color swatch, and preview. Unsupported data is unavailable rather than silently rendered as zero. |
| **Hamburger Menu** | Player customization, combo tiers, levels/titles, loot settings, questions, rewards, sounds, accessibility, completed history, Google Sheet setup/import, data integrity and sync. | A native side menu/sheet opens from top-left. Categories are grouped into concise lists; destructive actions require confirmation. |
| **Google Sheet Setup & Sync** | Explain Google OAuth connection, select/import one spreadsheet, preview required tabs, show sync state and queued offline changes. | A guided setup flow intentionally separates connection from import. Clear nontechnical status language is used: “Saved on this device,” “Waiting to sync,” and “Synced.” |

## Key User Flows

### 1. Launch and begin a mission

The user opens **Home**, sees their energy, current title, revisions due, and a recommended next mission. They tap **Start Mission**, which opens the Mission detail screen. A first tap starts the timer and records the timestamp. During a session the user can pause/resume, log one or more revision topics, or end the mission. Ending calculates invested time as elapsed time less paused time and transitions to the appropriate reflection sheet.

### 2. Complete work and receive progression

After the reflection, the app validates the mission completion, awards base XP, evaluates the combo multiplier, calculates resulting Total Power and gold accrual, adjusts the energy battery from difficulty and invested time, schedules relevant SRS topics, and evaluates the configurable loot-box probability. A strong completion uses a brief haptic, a restrained sound, and an animation. The user then lands on a results screen where all values are explained rather than merely shown.

### 3. Complete a spaced-repetition topic

From Home or the Mission Board, the user opens **Pending Revisions**, selects a topic, and taps **Complete Revision**. The app moves the topic from its current interval to the next (1 → 7 → 30 days). If the user does not complete it, the topic remains visibly overdue rather than silently advancing. Subject capture percentage updates in the Home map presentation.

### 4. Record the daily journal

The user taps the **Journal** tab and uses the plus action. Today’s date is locked by default. They answer whether they were better than yesterday, assign points, optionally write a reflection, and save. The entry appears in the Journal timeline and contributes five percent of its points to the derived lifeline progression series.

### 5. Spend gold in the Rewards shop

The user opens **Rewards**, examines a custom reward or armory item, and taps **Redeem**. The app checks the available gold balance before presenting a confirmation sheet. A successful purchase records an immutable transaction, decreases current gold, and adds an item to inventory. A next-day gold multiplier explicitly shows its activation date and queues a local notification.

### 6. Connect or import a Google Sheet

The user opens the hamburger menu, selects **Google Sheet & Sync**, and connects their Google account. They choose an existing spreadsheet or create one. The app validates the workbook, displays the required tabs that will be created if absent, imports compatible historical records, and retains a local retry queue while offline. The user can always view the last sync time and source document.

## Visual System

The core palette evokes an operations console at night, while ensuring legibility in both dark and light appearances. The dark theme is the default cinematic experience; the light theme preserves the same semantic hierarchy for daylight use.

| Token | Dark mode | Light mode | Purpose |
| --- | --- | --- | --- |
| **Background / Obsidian** | `#08111D` | `#F5F7FB` | Full-screen background and map field |
| **Surface / Steel** | `#122033` | `#FFFFFF` | Cards, sheets, tab bar |
| **Primary / Signal Cyan** | `#A78BFA` | `#6D28D9` | Navigation, progress, primary actions |
| **Power / Command Gold** | `#F4C95D` | `#A66E00` | Total Power, gold, ranked rewards |
| **Success / Field Green** | `#49D17D` | `#147A46` | Completed missions, healthy streaks |
| **Warning / Ember** | `#FFAA4C` | `#B65600` | Due revisions, energy caution |
| **Danger / Alert Red** | `#FF6B6B` | `#B42318` | Missed deadlines and error states |
| **Primary text** | `#F5F9FF` | `#112234` | Key values and headings |
| **Secondary text** | `#A7B6C8` | `#5F6F82` | Descriptions and metadata |

SF Pro is the system typeface. Large numerals use tabular figures for progression metrics. Display headings use bold weights sparingly and do not imitate military insignia; the tone is aspirational and game-inspired rather than militarized.

## Motion, Sound, and Haptics

Motion should clarify state change: 160–260 ms for a card state update, 280–400 ms for screen transitions, and one slightly longer moment for a major reward. Decorative motion is paused or reduced when the accessibility **Reduce Motion** setting is enabled. Sound is opt-in, categorized by UI tap, timer start, completion, loot, purchase, and notification, and each category has an independent volume toggle in Settings. Haptic feedback accompanies primary actions and success/error confirmations; no action requires sound or haptics to be understood.

### Launch-only cinematic overlay

The app process opens into the existing Home state underneath a temporary, viewport-bound overlay; no tab, stack, layout, mission, or dashboard composition changes. The current screen remains visible through a restrained, transparent atmospheric grade rather than being replaced by black. A photorealistic flame plate is framed, slightly enlarged, and raised within a clipped lower-half stage. Its dark plate is deliberately semi-transparent so existing interface content remains perceptible around and behind the fire, while the real flame, ember bed, smoke, heat-haze, and faint ember field provide depth without cartoon particles or empty black space.

The timing is deliberately sequential rather than layered: real fire and crackle establish the opening, then both settle away; a short silent pause creates space; a single refined cinematic transition cue begins; and only then does the selected contextual quote fade into the visual centre. The quote uses premium, high-contrast system typography with a controlled neutral shadow and no oval, coloured bubble, card, rule, or decorative frame. It holds briefly above the now-visible Home screen before a restrained diffuse light pass eases the overlay away. The overlay accepts no touch interaction while active and unmounts when complete, returning the original screen to normal input.

Quote wording is selected on-device from a varied, non-repeating pool keyed to the existing forecast outlook and wellbeing balance/trend. The selector gives priority to recovery and elevated-load language when the data is cautious, and to discipline, clarity, consistency, or momentum language when data is supportive. It uses only the existing user-entered reflection interpretation, does not alter any forecast calculation, and falls back to a neutral first-step quote before reflections exist. Recent quote IDs are stored locally so a prior quote is not reused until every eligible alternative has been exhausted.

The crackling audio is a short bundled asset played only during the visible fire phase and only when the existing sound preference is enabled. It is stopped and disposed before the single light transition cue begins, so the two sounds never overlap. Reduced-motion preference compresses the sequence into a brief staged fade; high-contrast preference keeps the focal quote shadow and low-opacity atmospheric grade strong. A process-session guard prevents replays during navigation, re-rendering, background resumption, or orientation changes.

## Accessibility and Customization Commitments

Every chart must expose a textual data summary. Dynamic color contrast will meet an accessible standard, labels are never conveyed by color alone, and user-visible time is consistently represented in **hours**. The hamburger menu will support theme selection, larger text compatibility, high-contrast mode, reduced motion, sound controls, mission/reflection question templates, level curves, title sequence, combo tiers, energy-cost settings, loot configuration, rewards, active graph definitions, Google Sheet integration, and historical data management.

## Data and Sync Experience

The app will remain useful without an active connection. Work is saved immediately on-device, tagged with timestamps and durable identifiers, and shown as synced only after a successful write to the selected Google Sheet. The UI avoids silent conflict resolution: when the same item has changed in more than one place, the user sees a concise resolution choice. No personal productivity data is placed in a secondary database as the product source of truth; the selected spreadsheet is the external source of truth, with a local cache used solely for responsive offline operation and safe queued synchronization.

## Implementation Scope for First Delivery

The first working delivery will include all five tabs, a real local game engine, mission creation/timing, reflections, SRS scheduling, journal entries, reward transactions, dashboard calculations, custom configuration, and a complete in-app Google Sheet connection/sync setup experience. Because Google OAuth client registration and Sheets API authorization require a developer-controlled Google Cloud configuration, the final connection screen will be ready for credentials and will provide a clear setup path; no fake claims of a live Google connection will be made before valid OAuth credentials are configured.

## Success Criteria

The app is successful when a user can move from creating a mission to completing it, receiving XP/power/gold results, seeing the mission in history, completing its revision schedule, reflecting in a journal, spending earned gold, and inspecting all resulting analytics without broken navigation, data inconsistency, or unexplained totals.
