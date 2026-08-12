# Project TODO

- [x] Define shared domain types, validation rules, and calculation engine for XP, power, gold, energy, levels, combo tiers, and SRS.
- [x] Implement local-first persistent state with an offline synchronization queue.
- [x] Design the Google Sheets workbook schema and create/import required worksheet tabs in one user-selected spreadsheet.
- [x] Add Google OAuth connection, spreadsheet selection, import, sync status, conflict handling, and retry flows.
- [x] Add the Focus Command visual theme, portrait-safe layout, accessibility controls, and semantic color tokens.
- [x] Create the custom Focus Command app icon and apply it to launcher, splash, favicon, and adaptive icon settings.
- [x] Build the five-tab bottom navigation: Home, Missions, Journal, Rewards, and Dashboard.
- [x] Build the Home command HUD with player identity, rank title, energy battery, XP, Total Power, gold, and invested-time metrics.
- [x] Support 40-plus customizable titles, a maximum level of 500, title changes every ten levels, and editable level thresholds.
- [x] Implement customizable streak/combo tiers, day-miss fallback rules, current multiplier, and next-tier countdown.
- [x] Implement daily mission progress, next-title progress, current-level XP, and XP-to-next-level progress indicators.
- [x] Implement configurable loot-box probability, custom rewards, opening feedback, and loot history.
- [x] Implement active bosses with deadlines, linked missions, sub-missions, progress, and rewards.
- [x] Implement the spaced-repetition queue with Day 1, Day 7, and Day 30 intervals, overdue behavior, and completion feedback.
- [x] Implement the animated player/character presentation and subject-capture map visualization.
- [x] Implement the Mission Board with filters, status groups, mission creation, editing, and detailed task views.
- [x] Implement mission start, pause, resume, end, revision-topic logging, and precise invested-time calculation.
- [x] Implement adaptive post-mission reflections, including the under-45-minute mini-achievement path.
- [x] Implement completed mission history and configurable reflection-question templates.
- [x] Implement daily journal creation, better-than-yesterday input, self-rating points, optional reflection, and historical timeline.
- [x] Link journal points to lifeline growth using the specified five-percent contribution rule.
- [x] Implement the Rewards shop, custom reward editor, gold affordability validation, purchase records, inventory, and armory items.
- [x] Implement gold multiplier purchases that activate the following day and create a reminder.
- [x] Implement the Dashboard Wall of Fame and Achievement Radar with seven-day visibility windows.
- [x] Implement Total Power, XP growth, daily time, time-average, subject distribution, and category skill-tree analytics.
- [x] Implement emotional analytics, skills radar, drill-down source records, and accessible chart summaries.
- [x] Implement the editable dual-line Lifeline graph from birth year and its journal-derived increments.
- [x] Implement three configurable dashboards with up to five post-mission data series each.
- [x] Implement hamburger-menu customization for player profile, titles, levels, combo rules, energy, loot, rewards, questions, themes, sounds, and accessibility.
- [x] Implement data import/export and sync diagnostics inside the hamburger menu.
- [x] Add appropriate feedback using animations, haptics, configurable sounds, and accessible reduce-motion behavior.
- [x] Add local notification preferences and local scheduling for next-day multiplier and revision reminders.
- [x] Add deterministic unit tests for progression, currency, timers, SRS, journal/lifeline, rewards, and analytics.
- [x] Validate all core flows on native-compatible code paths, check TypeScript/linting, and inspect development logs.
- [x] Create the first complete project checkpoint after all checklist items are accurately marked complete.
- [x] Verify that Expo Go cannot complete the native OAuth redirect with only a Web Client ID, and document the native-client requirement.
- [x] Confirm and document the generated Android package identifier for the user.
- [x] Optimize generated icon variants and the optional audio cue below the checkpoint media-size limit while preserving the app branding and feedback behavior.
- [x] Audit remaining implementation gaps against the supplied specification and resolve every autonomous item before the next checkpoint.
- [x] Re-verify the native Google OAuth readiness path and document the exact external client-ID prerequisite.
- [x] Replace destructive whole-workbook sync writes with a safer merge-aware export flow and visible conflict choice.
- [x] Complete custom reflection-question management with editable prompt types, enable/disable controls, and removal.
- [x] Complete custom reward creation with configurable loot weights and next-day gold multipliers.
- [x] Make high-contrast presentation a functional visual mode rather than a stored preference only.
- [x] Fix and test the rank-title customization editor’s collapsed-list behavior.
- [x] Activate live Google Sheets sign-in in a native development build after Android and iOS OAuth client IDs are supplied.
- [x] Add boss creation directly from the Mission Board and link selected missions to the new boss.
- [x] Add a visible title-driven player character presentation that evolves with rank and level.
- [x] Extend post-mission emotional data capture with four customizable behavioral perspectives.
- [x] Add four new customizable dashboard visualizations for behavioral tendencies and emotional patterns.
- [x] Add concise per-click game feedback sounds and interaction animations, retaining longer reward sounds for achievements.
- [x] Add full app palette customization with accessible contrast safeguards.
- [x] Add granular local notification rules for timing, categories, and reminder types.
- [x] Add deletion controls for manually entered Lifeline data with confirmation.
- [x] Repair Home metric layout so every key stat remains readable at mobile portrait widths.
- [x] Add edit and delete controls for missions, including safe handling of active mission state.
- [x] Add edit and delete controls for bosses, including deadline editing and linked-mission management.
- [x] Add a required deadline field to the Mission Board boss creator and validate the selected date.
- [x] Add four separately configurable sound roles: mission win, tap/click, notification, and extended feedback.
- [x] Repair the native metric grid flex behavior shown in the supplied portrait screenshot.
- [x] Confirm and document the Android package, iOS bundle identifier, development-build signing SHA-1 retrieval path, and Google OAuth redirect configuration.
- [x] Add configurable mission recurrence, including a daily frequency that remains in Planned after each completion.
- [x] Reset day-scoped progress, target, and Today calculations at the local midnight boundary.
- [x] Make level thresholds accelerate progressively and correct next-title progress computation.
- [x] Add edit and delete controls for user-created rewards.
- [x] Move Lifeline manual-entry deletion into an interactive graph drill-down detail view.
- [x] Add a clearly reachable active inventory and equipped-items view.
- [x] Add user-selected local sound-file assignment for the four sound roles, alongside improved bundled feedback cues.
- [x] Add celebratory animations and sound cues for mission completion, level-ups, title changes, and combo-tier increases.
- [x] Make the subject map explain and display real mission-category capture progress instead of static dots.
- [x] Update the Home character into title-sensitive anime character states, enlarge player typography, and add periodic fire animation.
- [x] Make pie charts and all dashboard graphs interactive with segment/point focus, labels, and distinct color schemes.
- [x] Correct the native OAuth callback scheme so Google consent returns to Focus Command instead of a browser page.
- [x] Add an Expo Router OAuth callback route for `com.app.rpgfocuscommand:/oauthredirect` so Google’s authorization response is handled instead of displaying Unmatched Route.
- [x] Return from the native OAuth callback route to the active AuthSession hook so it consumes the authorization response and completes the Google Sheets session reliably.
- [x] Rebuild and test the fixed native callback flow after the dedicated route is included.
- [x] Add a free on-device emotional and behavioral pattern forecast with clear non-clinical wording and no external AI service requirement.
- [x] Add a visible emotional-pattern forecast section with transparent signals and user-configurable presentation.
- [x] Add journal completion celebration animation and contextual feedback for key in-app actions.
- [x] Replace the subject map with an India-inspired adaptive territory view, subject labels, capture percentages, and auto-created subject territories from mission logs.
- [x] Persist the selected Google spreadsheet ID and name across app visits until the user explicitly removes or replaces it.
- [x] Add a user-controlled action to disconnect or replace the saved spreadsheet selection without resetting unrelated app data.
- [x] Add a configurable dashboard builder that selects metrics, chart styles, feature filters, and date ranges from available Focus Command data.
- [x] Replace the cyan brand emphasis with an attractive non-cyan default logo and visual accent system.
- [x] Add a tappable title-sensitive anime character achievement view with an expansion animation and achievement sound.
- [x] Add a detailed non-clinical wellbeing and behavioral insight view with transparent inputs, trends, and drill-down records.
- [x] Replace the existing territory outline with a more geographically faithful India map that retains dynamic subject territories and capture labels.
- [x] Preserve the existing Dashboard and add a distinct nested configurable analytics workspace with arbitrary metrics, feature filters, date filters, and selectable chart styles.
- [x] Keep the existing free pattern forecast and add a detailed non-clinical wellbeing insight drill-down rather than a medical diagnosis.

- [x] Eliminate overlapping subject territories inside the geographic India map while retaining dynamic capture labels and tap targets.
- [x] Repair the clipped active-inventory count on the Rewards screen at narrow portrait widths.
- [x] Calculate weekly and monthly average time against all elapsed calendar days through today, including zero-work days.
- [x] Add forecast-responsive short Home motivation messages that rotate every five seconds.
- [x] Apply consistent subtle press animations and feedback to interactive controls across the app.

- [x] Replace repeated fixed territory cells with varied organic subject regions that do not overlap and remain fully inside the geographic India boundary.
- [x] Add clearly visible, reduce-motion-aware floating and ambient animation to the Home screen’s hero, character, metrics, and key cards.

- [x] Replace slot-based subject territories with a fully dynamic completion-weighted partition that preserves a minimum visible region for every subject, reflows on subject/progress changes, never overlaps, and remains inside India’s fixed outer boundary.
- [x] Smoothly animate territory reflow and organic border changes when subject coverage changes.

- [x] Make the Dashboard Total Power, Daily Average, Weekly Average, and Monthly Average summary cards tappable and provide a dedicated transparent details view for each metric.

- [x] Fix notification sound selections so they persist permanently after being set, even after app redirects.

- [x] Keep the Home Title Achievement modal shown after tapping the character active for exactly 10 seconds in normal-motion mode, with its circular halo animation running for the same duration.

- [x] Restore the full granular sound-role catalog in the Sound Command Center, including every previously available title, notification, reward, level, achievement, tap, and system event category.
- [x] Verify the complete sound-role catalog remains visible, individually customizable, previewable, and persisted after restart.

- [x] Permanently repair the native custom-sound lifecycle for every notification category: picker result, verified durable copy, immediate profile save, rehydration, selected filename, preview, removal, and category-specific playback.
- [x] Add native-safe lifecycle regression coverage and validate the repair on the current app build without reverting the complete sound catalog.

- [x] Examine current forecast/insight logic and design dynamic insight generator.
- [x] Create large library of varied insight templates and sentence structures.
- [x] Implement insight analysis engine to identify main patterns from data.
- [x] Integrate dynamic insights into Home screen Insight Area.
- [x] Test with various data scenarios and validate wording variety.

- [x] Analyze current mission completion logic and design multi-completion system.
- [x] Add repeatability configuration to mission data model.
- [x] Update mission completion logic to support multiple daily completions.
- [x] Update UI to show completion count and allow repeated completions.
- [x] Test multi-completion scenarios and validate XP/rewards.

- [x] Audit current multi-completion logic.
- [x] Fix mission completion tracking to record all instances independently.
- [x] Verify XP/reward calculations apply to every completion.
- [x] Update UI to display completion count and all instances accurately.
- [x] Add comprehensive tests for multiple independent completions per day.
- [x] Save checkpoint and deliver corrected multi-completion system.

- [x] Audit the mission-result confirmation lifecycle and identify the root cause of the non-submitting button.
- [x] Repair validation, single-submit protection, persistence, loading, success, and error handling for mission results.
- [x] Ensure each same-day repeatable completion persists as an independent instance through history, rewards, analytics, and restart.
- [x] Add regression tests for confirmation, duplicate taps, independent repeated completions, persistence, and limited missions.
- [x] Validate the complete repaired mission lifecycle without changing the existing interface or unrelated features.

- [x] Audit active Focus Command runtime imports, startup wiring, and network usage for backend dependencies.
- [x] Distinguish unused template/server files from code actually bundled into the mobile app.
- [x] Report whether all gameplay persistence is local and identify every remaining optional external path.

- [x] Protect and verify the direct Google Sheets authorization and manual-sync paths before removing legacy infrastructure.
- [x] Remove legacy backend OAuth routing, auth/tRPC/query runtime wiring, and unused mobile dependencies.
- [x] Remove obsolete server, database, schema, and migration infrastructure and stop starting a backend service in development.
- [x] Verify no backend imports or calls remain while Google Sheets authorization and manual sync continue to work.
- [x] Run full checks and regression tests for the backend-free local-first build.

- [x] Trace the reported repeatable-mission completion, rescheduling, and same-day start flow against the supplied recording.
- [x] Fix repeatable missions so completion does not move their eligible scheduled date to tomorrow before the day ends.
- [x] Preserve next-day rescheduling for non-repeatable daily missions and all existing independent completion records.
- [x] Add same-day restart regression coverage and restore a client-only production build script.
- [x] Run type, lint, build, and full regression validation for the repeatable-mission repair.

- [x] Audit the equipment creator, inventory, equipment slots, map-label layout, rendering hot paths, and the reported client build failure.
- [x] Repair created-equipment synchronization into offline inventory and clarify the direct equip flow by slot type.
- [x] Correct territory-map label centering and overflow without changing any other map mechanics or appearance.
- [x] Apply targeted performance improvements that preserve all current screens, workflows, and visual design.
- [x] Add regression coverage, restore a reliable client build, and validate the equipment, map, and performance repairs.

- [x] Audit the current territory label anchor geometry, map interaction layer, missed-tap reports, render hot paths, and deployment startup configuration.
- [x] Recalculate every territory label from a verified safe interior point with boundary clearance, without changing map mechanics or visuals.
- [x] Remove missed-tap and lag bottlenecks through under-the-hood interaction and rendering improvements only.
- [x] Add deterministic safe-anchor and touch-response safeguards; validate the application and deployment build before checkpointing.

- [x] Audit equipment modifier storage, reward calculations, and creator/detail percentage presentation against the reported baseline mismatch.
- [x] Correct the modifier presentation and any calculation discrepancy while preserving the existing equipment effects and inventory flow.
- [x] Add modifier-baseline regression coverage and run complete validation for the equipment percentage correction.

- [x] Audit Wall of Fame data derivation, qualifying mini-achievement records, and current card fields.
- [x] Show the qualifying mini achievement as the Wall of Fame card title and the parent mission as secondary context.
- [x] Add regression coverage and validate the Wall of Fame data-binding correction.
- [x] Diagnose and restore the client deployment startup path after the failed rollout.

- [x] Audit the supplied launch reference, app launch lifecycle, wellbeing insight sources, audio system, visual composition, and deployment startup failure.
- [x] Design the launch-only flame, contextual quote, sound, and final glaze sequence without changing the existing interface after it ends.
- [x] Implement interruption-safe, accessibility-aware, responsive, mobile-efficient launch playback with quote variety and no navigation restart.
- [x] Add deterministic lifecycle, quote, sizing, audio-fallback, and animation safeguards; validate the build and deployment startup path.

- [x] Audit the current flame, quote, glaze, audio composition, and the renewed deployment-start failure.
- [x] Replace the stylized flame and glaze treatment with a cinematic, layered, realistic composition that stays within the launch viewport.
- [x] Add a subtle synchronized quote-reveal sound while retaining the existing approved fire crackle and launch-only lifecycle safeguards.
- [x] Add deterministic rendering and audio coverage; validate performance, static build, production-start configuration, and deployment readiness.

- [x] Restore the stopped development service and verify the current Focus Command checkpoint accepts preview connections.

- [x] Audit the current fire placement, app-background visibility, quote styling, audio overlap, sequence timing, and active rendering warnings.
- [x] Refine only the launch composition so photorealistic fire fills the lower screen naturally while the underlying app remains visible.
- [x] Separate fire playback from the quote reveal with a deliberate pause, balanced audio ducking, an elegant non-horror transition cue, and minimal typography-only quote treatment.
- [x] Add deterministic timing and audio-balance safeguards; validate responsive bounds, full regression coverage, static output, and launch lifecycle.

- [x] Review the supplied recording and audit launch transparency, animation overlap, level-up trigger state, audio concurrency, glaze visibility, and rendering pressure.

- [x] Trace and eliminate any launch-animation replay caused by interaction, navigation, hydration, or re-render rather than a true app launch/open.
- [x] Establish a root-level launch-only gate plus shared animation and audio arbitration for launch, quote, and level-up phases.
- [x] Revalidate transparency, exclusive level-up triggering, cinematic glaze, sound priority, and all specified launch/reopen/interaction scenarios.
- [x] Design mutually exclusive launch, quote, and level-up animation/audio phases that preserve existing gameplay and screen behavior.
- [x] Make the launch fire fully transparent, enhance the cinematic glaze, restrict level-up playback to genuine level changes, and enforce audio priority with cleanup.
- [x] Add deterministic lifecycle and audio-arbitration coverage; validate launch, level-up, interruption, resize, build, and production-start scenarios.

- [x] Identify and restore the previously approved fire animation, removing only the unintended replacement asset and code path.
- [x] Retain the requested launch-only guard, exclusive animation/audio priority, genuine level-up gate, transparent layering, and stronger glaze around the restored fire.
- [x] Revalidate the narrow restoration without changing other features, then checkpoint the corrected version.

- [x] Inspect the approved fire video’s black matte and select a transparency-preserving compositing path that does not alter the fire animation.
- [x] Integrate the matte-free approved fire footage without changing its movement, launch-only behavior, animation arbitration, audio priority, or glaze.
- [x] Validate transparent compositing, visual fidelity, lifecycle safeguards, rendering performance, and static production output before checkpointing.

- [x] Audit current fire duration, crackle playback, quote duration, and all remaining black-matte sources while preserving the approved footage.
- [x] Extend the unchanged fire plus sound phase to 5–7 seconds and hold the motivational quote for 3–4 seconds without breaking launch-only arbitration.
- [x] Correct the residual black matte while retaining the approved fire frames, sound priority, animation exclusion, and existing glaze.
- [x] Validate timing, sound lifecycle, transparency, responsiveness, launch-only behavior, static output, and production startup before checkpointing.

- [x] Review the supplied recording and audit transparent fire motion, glow, quote collision, contrast, and launch rendering constraints.
- [x] Design natural layered rise/flicker motion and a subtle integrated quote vignette without changing existing app UI or other animations.
- [x] Implement organic transparent fire movement, cinematic glow, smooth entrance/exit, and quote contrast treatment only.
- [x] Validate multiple launch states for movement, transparency, readability, lifecycle, responsiveness, and production build behavior.

- [x] Audit the approved fire’s prior smoother behavior, current bobbing transforms, crackle start delay, and quote-shadow contrast.
- [x] Restore a non-bobbing cinematic fire presentation from the approved footage with crackle beginning at the first visible flame frame.
- [x] Increase only the quote text shadow while retaining the existing transparent background, app UI, animation ownership, and all functionality.
- [x] Validate motion quality, sound synchronization, quote readability, lifecycle safety, responsive bounds, and production output before checkpointing.

- [x] Audit why the restored approved fire footage still renders a visible black matte despite the current compositing style.
- [x] Remove the black matte through a transparent compositing path that preserves every approved fire frame, launch guard, sound timing, and unrelated app behavior.
- [x] Validate matte-free rendering and complete lifecycle, audio, and production checks before checkpointing.

- [x] Review the current managed configuration, native prebuild requirements, GitHub repository readiness, and immutable app-name, identifier, and branding constraints.
- [x] Generate the native Android Gradle project without altering the Focus Command name, identifiers, launcher branding, existing features, or runtime behavior.
- [x] Add a GitHub Actions workflow that builds an Android APK artifact without Expo’s hosted build service.
- [x] Validate the native project and workflow configuration and document the GitHub build steps.
- [x] Checkpoint the GitHub APK build preparation.

- [x] Verify GitHub repository access, branch status, and availability of the Focus Command APK workflow; GitHub authentication is available, but the project currently has no GitHub remote.
- [x] Confirm the external GitHub push and workflow-run operation immediately before publishing.
- [x] Push the validated checkpoint to the selected GitHub repository and trigger the Android APK workflow.
- [x] Monitor the workflow and confirm the resulting APK artifact is available for download from the successful private GitHub Actions run.

- [x] Verify the current GitHub free-tier limits for a private repository and Android APK workflow, then proceed only without paid spending enabled.

- [x] Create the confirmed private Focus Command repository without changing app naming, identifiers, branding, features, or runtime behavior.
- [x] Push the validated project and GitHub Actions APK workflow to the private repository using only the free-tier route.
- [x] Trigger the Android APK workflow, monitor its successful completion, and confirm its retained GitHub artifact for delivery.

- [x] Grant the connected GitHub integration access to the user-created private `focus-command` repository before publication.

- [x] Request and obtain renewed GitHub connector permission for private repository contents and Actions workflows.

- [x] Audit why the GitHub-built APK lacks the Google OAuth client configuration available to the Expo Go development environment; local validation confirms the Web Client ID exists, while the GitHub workflow injects no OAuth values.
- [x] Add a secure GitHub Actions configuration path for the required Google OAuth build values without exposing credentials in the private repository.
- [x] Build and validate a replacement APK with Google Sheets authorization enabled, then document the secure setup and delivery path.

- [x] Analyze the supplied installed-APK launch recording and compare native fire playback, sound timing, quote cue, and quote readability against preview behavior; the installed APK receives a single static RGBA PNG, while preview behavior masked the missing native animated-frame implementation.
- [x] Identify and correct the native-specific cause of static-looking fire, mismatched fire sound duration, absent quote sound, and unreadable quote contrast without changing other app behavior.
- [x] Validate the corrected launch source locally through type checks, 86 regression tests, lint, and static export; native APK artifact validation remains required.
- [x] Build, checkpoint, and deliver the focused native launch-sequence repair through the private GitHub workflow.

- [x] Recompress only the derived animated fire asset below the checkpoint size limit while proving that its full frame sequence and continuous native animation remain intact.

- [x] Tighten native fire-crackle start timing so it begins with the first visible fire frame, and strengthen the motivational quote shadow without changing the launch sequence’s behavior.
- [x] Add a bounded Home-screen Mini Achievements ticker that cycles only real mini achievements rated above 3.0 in the marked header space without moving or overlapping existing UI.
- [x] Add deterministic zero-, one-, and multiple-eligible-achievement regression coverage and validate the focused mobile refinement before building a replacement APK.

- [x] Trace and repair the persisted mission-completion lifecycle so completed sessions immediately populate History, invested time, and shared dashboard analytics.
- [x] Align the Recognition Window’s Wall of Fame and Achievement Radar cards across portrait widths without content clipping or overflow.
- [x] Increase the bounded Home Mini Achievement ticker height and padding while preserving its non-overlapping header placement.
- [x] Add end-to-end regression coverage for mission completion, History, active time, analytics, Recognition Window layout, and ticker sizing before building a replacement APK.

- [x] Repair the active-mission end and result-confirmation lifecycle so a valid live session does not become inactive before finalization.
- [x] Repair elapsed-time propagation and persistence so completed mission durations drive Home, History, Dashboard, and analytics consistently.
- [x] Move the Mini Achievement ticker clear of the hamburger control and make its tap navigate to the existing Wall of Fame.
- [x] Add regression coverage and run a broad existing-flow validation pass without adding or redesigning app features before building a replacement APK.

- [x] Analyze both supplied videos and map their approved power-up interaction requirements to the existing title, character, level, animation, and sound systems.
- [x] Build only the requested data-driven title-and-level anime power-up overlay for the existing Home character interaction, with coordinated cinematic sound and no unrelated UI or workflow changes.
- [x] Add safe repeated-tap, interruption, title-level selection, cleanup, and sound-timing coverage for the power-up interaction.
- [x] Validate the focused power-up feature across supported title and level states before building a replacement APK.

- [x] Analyze the supplied recording, reference video, and detailed specifications against the existing Home character, title, level, equipment, animation, and audio systems.
- [x] Create a unique data-driven visual development and equipment-unlock path for each existing title and level milestone using only progression state.
- [x] Add dedicated synchronized cinematic effects and sound for meaningful progression events, with subtle non-event idle character behavior and no generic repeated sequence.
- [x] Add safety, trigger, equipment-state, audio-priority, cleanup, and non-regression coverage before validating and building a replacement APK.

- [x] Inspect and synchronize the latest validated character-development checkpoint to the configured private GitHub repository.

- [x] Trigger GitHub Actions APK #8 for the validated character-development checkpoint and deliver the successful artifact for phone testing.

- [x] Diagnose and restore durable direct GitHub repository and Actions access after the completed device authorization fails to reach workflow commands.

- [x] Diagnose and repair the installed-APK Home character-logo tap that currently gives no visible interaction.
