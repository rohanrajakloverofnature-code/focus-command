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

- [x] Permanently repair the installed-APK live-mission active-time path and restore its 45-minute active-time reflection gate without changing unrelated behavior.

- [x] Restart the newly reported stopped development service and verify its preview health without changing the published final cinematic update.

- [x] Diagnose and repair the recurring development preview-load failure without changing the verified final cinematic feature.

- [x] Create and integrate final title-family moving armor-materialization video choreography for the Home character cinematic without changing unrelated features.
- [x] Use the requested excerpt from the supplied first soundtrack, retain the approved second audio cue, and guarantee video/audio lifecycle cleanup.
- [x] Add regression coverage and complete TypeScript, lint, full-suite, production-export, and media-integrity validation without starting an APK build.

- [x] Restore the stopped Focus Command development service and verify its preview endpoint responds.

- [x] Complete a final pre-publication verification of all moving armor videos, family selection, playback lifecycle, audio synchronization, interruption cleanup, regression coverage, and production export.
- [x] Obtain and integrate a distinct user-generated Ascendant armor-materialization clip, then repeat final pre-publication verification before publishing.
- [x] Select and trim the strongest continuous five-second armor-construction segment from the supplied ten-second Ascendant source before mobile integration.

- [x] Repeat the final exhaustive pre-publication verification of all title-family video assets, full-tap cinematic replay, audio synchronization, lifecycle cleanup, regression coverage, and production export.

- [x] Restart the reported stopped development service and verify its preview health without changing the verified cinematic checkpoint.

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
- [x] Make launch media scheduling non-blocking and guarantee safe launch/cinematic media cleanup without changing their user-facing behavior.
- [x] Reduce offline state persistence, context render fan-out, and repeated derived-data work while preserving all state semantics and calculations.
- [x] Virtualize only verified long repeated-content views and add single-flight protection only to duplicate-sensitive actions.
- [x] Add targeted performance-contract coverage and complete the full TypeScript, test, lint, and export validation suite without starting an APK build.
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

- [x] Push the validated Home character-tap repair checkpoint to the private GitHub repository without triggering an APK build.

- [x] Repair persistent GitHub authorization so approved repository access survives shell sessions and does not repeatedly request device codes.

- [x] Trace and repair live mission active-time persistence across pause, resume, app reload, and completion.
- [x] Restore the original 45-minute actual-active-time trigger for emotion and reflection questions, including correct saved results.
- [x] Add regression coverage for active-time, pause handling, persistence, completion, and the 45-minute reflection threshold.

- [x] Compare the supplied reference and current character-evolution recordings, then provide a candid feasibility decision before making any animation changes.

- [x] Audit the existing character-evolution sequence, real progression triggers, visual assets, audio lifecycle, and regression coverage against the supplied reference.
- [x] Create optimized original evolution artwork, visual-effect layers, and dedicated synchronized sound cues for the complete cinematic sequence.
- [x] Replace the basic character overlay with the staged reference-driven avatar transition, armor and weapon materialization, energy rings, ribbon, particles, flashes, impact, title, and reward reveal.
- [x] Preserve genuine progression-only triggering, real level/title/equipment data, launch and celebration exclusions, app-background cleanup, and all existing functionality.
- [x] Add deterministic regression coverage and validate the full cinematic sequence, sound timing, visual layering, trigger safety, and project quality gates.

- [x] Reproduce and repair the installed-APK live mission timer that remains at 0.0 h during an active session, including its persisted session-state compatibility path.
- [x] Add installed-build-focused timer regression coverage, validate pause/resume and completion behavior, then publish the verified repair.

- [x] Diagnose and repair the character interaction that only plays a full audible cinematic once at the Brigadier title.
- [x] Make every permitted Home character-logo tap replay the full sound-enabled cinematic for the current real level, title, and equipped gear without conflicting with other presentation stages.
- [x] Create richer, visibly varied level- and title-driven progression cinematics with stronger armor/suit formation, impact, shake, energy, and sound design.
- [x] Add regression coverage and validate repeat taps, progression variations, audio lifecycle, interruption safety, and all project quality gates before checkpointing.

- [x] Compare the pre-GitHub mission timing implementation against the installed-APK failure and identify every incompatible persisted live-session field.
- [x] Restore the original-compatible active-time, pause/resume, reload, completion, and 45-minute emotion-debrief lifecycle without altering unrelated features.
- [x] Add full legacy-state lifecycle coverage, validate every timing and debrief path, then publish only after the repair is verified.

- [x] Deliver every existing character-evolution portrait asset to the user for title-family video generation.

- [x] Inspect the supplied name-matched remaining character portraits and videos, preserving every already completed cinematic family unchanged.
- [x] Compare each supplied portrait against the active character portraits first and select a same-named video only for an unmatched remaining character.
- [x] Integrate only the approved remaining character-video mappings with their matching portraits, retain existing video/audio/replay cleanup behavior, fully validate, checkpoint, and push without starting an APK build.

- [x] Preserve all completed Tactical, Command, and Ascendant animations unchanged while integrating only the available matching Shadow video with the existing bundled approved audio cues.

- [x] Complete all five newly supplied remaining character forms as individual portrait-and-video mappings while leaving the three previously completed characters unchanged.
- [x] Restore the agreed audio contract for every new cinematic: supplied video audio during playback and the dedicated supplied ending cue after the video finishes.
- [x] Verify the supplied audio durations and use the ten-second track during every supplied anime video, followed only after video completion by the shorter ending cue.

- [x] Identify and integrate the newly supplied blue tactical-armour character’s matching ten-second cinematic video with the established during-video and post-video audio cues, without changing the profile-logo mechanism or any completed character mappings.
- [x] Validate the new single-character cinematic mapping, full regression suite, lint, TypeScript, and production export; then checkpoint and synchronize the verified update to GitHub without an APK build.

- [x] Create and validate a checkpoint-safe mobile-optimized copy of the exact supplied Tactical ten-second source while retaining its portrait framing, complete duration, and embedded video audio.
- [x] Create and validate a checkpoint-safe mobile-optimized copy of the existing completed Shadow source without changing its character mapping, timing, or audio behavior.

- [x] Renew the expired GitHub device authorization and synchronize the saved Tactical cinematic checkpoint to the private repository without starting an APK build.
- [x] Resolve the enabled GitHub connector’s invalid credential replacement, authorize the repair, and verify the saved Tactical checkpoint on the private repository’s main branch.
- [x] Restore the untouched GitHub connector configuration and use an authorized GitHub browser session to synchronize the saved Tactical checkpoint without changing application files or starting an APK build.
- [x] Restore every previously completed character video and related regression file that the Tactical checkpoint-to-GitHub diff would otherwise delete, then revalidate the corrected safe state before any repository update.
- [x] Create a corrected checkpoint that preserves Tactical, Command, Shadow, and Ascendant character-cinematic media before the authorized private GitHub update.
- [x] Run a fresh GitHub device authorization and push the already committed corrected cinematic rollout update in one continuous terminal session; then verify private main.

- [x] Verify and integrate the supplied Command/Officer ten-second character video with the established during-video and post-video audio cues, leaving every animation and sound completed today unchanged.
- [x] Validate the isolated Command cinematic mapping, protected existing character mappings, full regression suite, lint, TypeScript, and production export; then checkpoint and synchronize the verified single-character update to GitHub without an APK build.

- [x] Identify and present the four pending character portraits directly to the user without changing any cinematic mapping or project behavior.

- [x] Verify all four supplied evolution videos and match each to its closest remaining character portrait before any implementation.
- [x] Integrate, fully validate, checkpoint, and synchronize each matched remaining character cinematic one at a time, using the established during-video and post-video audio cues while preserving all completed animations and sounds.

- [x] Identify and show only genuinely unimplemented character forms after comparing the app’s title, portrait, and cinematic mappings; audit found no additional selectable form beyond the four completed families, so no pending portrait can be shown without adding a new character-form system.

- [x] Audit all eight original character portraits individually against current static portrait selection and latest ten-second cinematic integration; report only the portraits that remain without that cinematic, without altering any app behavior.

- [x] Define and implement deterministic title-family and level-stage selection for all eight existing portraits, while preserving the profile-logo interaction and completed cinematic mappings.
- [x] Add regression coverage and validate that every active portrait change is driven only by title or level, with no changes to existing cinematic-video or audio behavior.

- [x] Inspect the four newly supplied videos against the four newly active portraits and record the closest verified pairing for each without changing completed portrait-video assignments.
- [x] Integrate, validate, checkpoint, and report only the first verified newly active portrait-video pairing, retaining original video audio plus the established during-video and post-video audio treatment.

- [x] Integrate, validate, and checkpoint the verified Command Evolution portrait-video pairing without changing the Recruit, Tactical Evolution, Shadow, or Ascendant mappings.
- [x] Integrate, validate, and checkpoint the first verified Ascendant portrait-video pairing without changing completed mappings.
- [x] Integrate, validate, and checkpoint the remaining verified Ascendant portrait-video pairing, then report the completed four-video rollout.

- [x] Correct Command Evolution to use the visually verified `ascendant-2_video.mp4` source rather than the filename-matched but visually incorrect Command clip; revalidate and checkpoint this correction before continuing.

- [x] Push the fully validated eight-portrait cinematic rollout checkpoint `e6b124cd` to the private GitHub `main` branch without starting an APK build, then verify the remote commit.

- [x] Integrate the remote-only private-main commit non-destructively, preserving its user-authored Command/Officer update and all locally validated eight-portrait cinematic assets before pushing the completed rollout.

- [x] Prepare and deliver a read-only verification set containing all eight active character portraits and the exact runtime cinematic video assigned to each, without modifying project behavior.

- [x] Assemble and deliver an organized eight-pair verification package with clearly numbered folders, each containing one active portrait image and its exact assigned cinematic video.

- [x] Deliver the already assembled external verification package only; do not alter app code, runtime mappings, cinematic files, audio, or GitHub code.

- [x] Add an offline Character Cinematic Library to the existing hamburger menu that lists all eight names and portraits and supports choosing, replacing, and resetting each character’s local video override.
- [x] Persist selected local videos safely on-device and use them only as per-character runtime overrides while retaining every bundled cinematic as a resettable default.
- [x] Add automated coverage and validate selection, persistence, fallback, existing audio behavior, profile-logo replay, and the full eight-character cinematic flow before checkpointing.

- [x] Verify that the hamburger-menu cinematic customization adds no changes to existing profile-logo behavior, mission features, title/level progression, bundled default videos, audio timing, or unrelated UI.

- [x] Restore the approved ten-second simultaneous cinematic soundtrack for every character video and preserve each video’s portrait aspect without changing cinematic timing, profile-logo behavior, or unrelated app features.
- [x] Inspect the supplied recording and soundtrack, add regression coverage for shared soundtrack playback and portrait sizing, then validate and synchronize the focused correction without starting an APK build.

- [x] Trace and repair the remaining installed-Android failure of the first ten-second cinematic soundtrack while preserving all existing character videos, embedded video audio, ending cue, profile-logo behavior, timing, and unrelated features.
- [x] Confirm the reported GitHub Actions notices are non-blocking deprecation warnings, add installed-device lifecycle regression coverage for the first soundtrack, validate, checkpoint, and synchronize the focused repair without starting an APK build.

- [x] Trace and repair the remaining Google Sheets export route that sends more than 50,000 characters in one cell, preserving complete importable data and all existing local data, sheet connection, and synchronization controls.
- [x] Add an oversized-data sync regression covering every export payload path, validate, checkpoint, and synchronize the focused repair without starting an APK build.

- [x] Repair only the Home-screen Mini Achievement ticker’s readability, heading wrapping, and long-profile-title spacing while preserving its actual achievement data, cycling behavior, navigation target, header controls, and every unrelated feature.
- [x] Validate the ticker with long titles, multiple eligible achievements, one eligible achievement, and no eligible achievements before checkpointing and synchronizing the focused layout repair without starting an APK build.
- [x] Provide an accessible direct-image mockup of the corrected Mini Achievement ticker layout after the prior shared-link delivery failed, without modifying the app.
- [x] Restore the Mini Achievement ticker to its original logical header slot and improve only its long-text readability and collision safety, as explicitly approved.
- [x] Push the validated header-only Mini Achievement ticker repair to the private GitHub main branch without starting an APK build or GitHub Action.
- [x] Prepare a non-implementation proposal for a Daily Command Briefing on the Home screen, then wait for explicit approval before changing any feature, mechanism, or layout.
- [x] Implement the approved Daily Command Briefing below the existing profile/character card, using only existing offline data and preserving all unrelated features and layouts.
- [x] Push the validated Daily Command Briefing checkpoint to the private GitHub main branch without starting an APK build or GitHub Action.
- [x] Prepare a non-implementation proposal for an offline Distraction Log during live missions, then wait for explicit approval before changing any feature, mechanism, or layout.
- [x] Implement the approved offline Distraction Log in live missions and the Focus Friction insight below Wellbeing Insight, while preserving timing, rewards, debriefs, and existing controls.
- [x] Push the validated Distraction Log checkpoint to the private GitHub main branch without starting an APK build or GitHub Action.
- [x] Prepare a non-implementation proposal for an offline Weekly After-Action Review, then wait for explicit approval before changing any feature, mechanism, or layout.
- [x] Implement the approved offline Weekly After-Action Review entry and read-only review screen using existing Focus Command data while preserving all existing features, calculations, controls, synchronization, and layouts.
- [x] Push the validated Weekly After-Action Review checkpoint to the private GitHub main branch without starting an APK build or GitHub Action.
- [x] Prepare a non-implementation safety proposal for deleting one completed History record without deleting its parent mission or corrupting rewards, statistics, reflections, analytics, or related records.
- [x] Prepare a non-implementation proposal for deleting one completed mission run together with only the XP, power, gold, energy, combo impact, transactions, inventory effects, reflection/emotion data, mini achievement, recognition entries, and time/analytics data earned by that exact run, while retaining the parent mission and unrelated records.
- [x] Implement the approved deletion of one completed mission run and its uniquely linked earned data, while restoring the parent mission safely and preserving all unrelated records.
- [x] Add and run comprehensive completed-run deletion scenarios, then synchronize the validated checkpoint to private GitHub main only if every check passes, without starting an APK build.
- [x] Prepare an approval-gated plan for a standalone offline backup-file export and lossless restore flow that preserves every local Focus Command record independently of Google Sheets.
- [x] Implement the approved Offline Backup File export and validated all-or-nothing restore flow for complete local Focus Command data and app-private media, without changing Google Sheets or unrelated features.
- [x] Push the validated Offline Backup File checkpoint to private GitHub main without starting an APK build, then verify the remote commit.
- [x] Prepare an approval-gated, Journal-header-only correction for the clipped Today status control in the Journal Entry card.
- [x] Implement the approved Journal-header-only responsive correction so the Today status control remains fully visible on narrow portrait screens.
- [x] Push the validated Journal Today-control correction checkpoint to private GitHub main without starting an APK build, then verify the remote commit.
- [x] Prepare an approval-gated plan for extensible rank titles and custom level-based character cinematic forms, including independently configurable and duration-validated two-track music for all eight existing forms and every new custom form.
- [x] Extend persisted progression data so rank titles use safe explicit level thresholds beyond the original title list while retaining legacy behavior.
- [x] Add local custom character-form data, media lifecycle, activation-level safeguards, and backup compatibility without changing the current eight-form defaults.
- [x] Add independently validated during-video and post-video music overrides for all eight existing forms and every custom form, retaining the bundled default tracks as fallbacks.
- [x] Update cinematic playback so selected form media is resolved safely while preserving simultaneous embedded-video audio plus BGM, post-video reveal timing, and the unchanged profile-logo interaction.
- [x] Add the approved Customize and Character Cinematics interfaces for titles, custom forms, portrait/video selection, and per-form music replacement or reset.
- [x] Add exhaustive regression coverage and complete type, test, lint, production-export, and preview validation without starting an APK build.
- [x] Push the validated extensible titles and character-cinematic customization checkpoint to private GitHub main without starting an APK build, then verify the remote commit.
- [x] Inspect the current fire launch animation and prepare an approval-gated proposal for a strictly additive offline Launch Animation customization control.
- [x] Prepare a revised approval-gated plan for a transparent-video Launch Animation customization and one master on/off control for the complete fire/video, motivational quote, and glaze sequence; superseded before delivery after verifying the Android transparency limitation.
- [x] Prepare a revised approval-gated plan for transparent animated-image launch customization with separately selected synchronized audio and the complete-sequence master switch.
- [x] Replace the unshipped standard-video launch draft with an approved transparent GIF or animated WebP visual and separately selected synchronized audio.
- [x] Add the approved GIF/WebP and audio controls plus the persistent complete-sequence master switch without moving existing settings entries.
- [x] Preserve default fire fallback, quote/glaze handoff, accessibility, lifecycle, sound preferences, backup/restore, and one-run-per-launch behavior for the new animated-image path.
- [x] Add complete regression coverage and run type, test, lint, production-export, and preview validation without starting an APK build.
- [x] Supersede the unshipped standard-video configuration with the approved GIF/WebP plus audio-pair configuration before delivery.
- [x] Supersede the unshipped standard-video import/replacement/reset path with the approved GIF/WebP visual and separate-audio persistence and backup path.
- [x] Add the approved Hamburger Settings Launch Animation controls without moving or changing existing settings entries.
- [x] Supersede the unshipped standard-video playback branch with the approved GIF/WebP visual plus audio-pair launch branch while preserving protected launch behavior.
- [x] Complete exhaustive launch customization regression coverage and type, test, lint, production-export, and preview validation without starting an APK build.
- [x] Push the validated Launch Animation GIF/WebP, synchronized-audio, and master-switch checkpoint to private GitHub main without starting an APK build, then verify the remote commit.
- [x] Audit Offline Backup File coverage for all recently added feature configuration and local media without changing product code.
- [x] Conduct a read-only performance, responsiveness, media-lifecycle, interaction, navigation, and data-loading audit; present an approval-gated optimization plan without changing product behavior.
- [x] Implement the approved Journal-header-only responsive correction so the Today status control remains fully visible on narrow portrait screens.
- [x] Push the validated Performance and Reliability Optimization checkpoint to the existing private GitHub main branch without starting an APK build or workflow.
- [x] Conduct a read-only investigation of delayed button responsiveness from the supplied recording and current interaction paths; present an approval-gated root-cause plan without changing app behavior.
- [x] Narrow shared button, icon, metric, and tab feedback subscriptions without changing their UI or action semantics.
- [x] Make existing press acknowledgement immediate while preserving current release-to-activate action paths and all mission controls.
- [x] Narrow verified Mission and Home render dependencies without changing any visible content, calculation, profile-logo behavior, or completed animation.
- [x] Prepare the existing optional tap-feedback resource safely after hydration without playing a new launch sound or altering sound settings.
- [x] Add responsiveness regression coverage and complete full TypeScript, test, lint, and export validation without starting an APK build.
- [x] Push the validated Button Responsiveness Optimization checkpoint to the existing private GitHub main branch without starting an APK build or workflow.
- [x] Conduct a read-only investigation of renewed button and scrolling lag from the supplied recording and current code; present an approval-gated root-cause plan without changing app behavior.
- [x] Correct shared scroll-versus-tap feedback scheduling without changing visible controls, feedback choices, or release-to-activate action behavior.
- [x] Contain dense Settings and Dashboard rendering work without changing any section, chart, calculation, data, layout, or feature behavior.
- [x] Protect existing continuous visual work from unrelated state updates without changing completed animations or their timing.
- [x] Add touch-and-scroll regression coverage and complete full TypeScript, test, lint, and export validation without starting an APK build.
- [x] Push the validated Touch and Scroll Smoothness Optimization checkpoint to the existing private GitHub main branch without starting an APK build or workflow.
- [x] Conduct a read-only analysis and present an approval-gated plan for a lifelong Dashboard Monthly Command Archive with year/month navigation, growth trends, month metric switching, and performance safeguards.
- [x] Implement a pure, durable-record-derived Monthly Command Archive with local-timezone year/month grouping, transparent monthly metrics, and automatic real month/year recognition.
- [x] Add the approved Dashboard archive entry and read-only year/month archive screens without moving or changing current Dashboard sections.
- [x] Add virtualized archive rendering, stable metric switching, and memoized derivations to preserve smooth scrolling and immediate button responsiveness.
- [x] Add deterministic archive, automatic rollover, backup-equivalence, and performance regression coverage; complete full validation without an APK build.
- [x] Conduct a read-only inspection and present an approval-gated plan for a continuous multi-year Lifetime Growth Trajectory on the existing Command Archive page, preserving every current archive view and protected app mechanism.
- [x] If approved, add the lifetime trajectory with bounded rendering, memoized multi-year derivation, and regression validation for smooth scrolling and immediate taps without changing existing archive behaviour.
- [x] Conduct a read-only inspection and present a revised approval-gated plan for clickable monthly Command Summary and Subjects Map controls, a truthful monthly topic-revision view, and completion percentages derived from existing durable records.
- [x] If approved, add bounded, virtualized monthly revision navigation and topic completion views with stable callbacks and regression validation, preserving all existing screens, records, calculations, and user-facing mechanisms.
- [x] Revise the approval plan to include an additive, performance-bounded selected-year topic and revision-cadence completion summary, preserving the current annual graph and month grid exactly.
- [x] Conduct a read-only inspection and present an approval-gated plan for Yearly Revision Overview search, subject-only Lifetime Growth filtering, and an optional month-to-month comparison view.
- [x] If approved, add bounded search, subject filtering, and month comparison with stable interactions, virtualized results, and regression validation while preserving all existing archive behavior.
- [x] Conduct a read-only long-term scalability audit for very large offline Focus Command histories, then present an approval-gated performance plan without changing any existing feature, calculation, user-facing mechanism, profile-logo behavior, animation, or app identity.
- [x] Implement the approved internal long-term scalability protections: bounded derivations, cache-aware large-history paths, hardened virtualized lists, persistence safety, and deterministic multi-year regression coverage—without changing any existing user-facing behavior or durable calculation.
- [x] Conduct a read-only Command Archive mobile-layout inspection for the observed touching cards, narrow monthly summary cards, and year/month responsiveness; present an approval-gated correction plan without changing archive data, behavior, calculations, navigation, profile-logo behavior, or completed animations.
- [x] Implement the approved Command Archive mobile layout correction: explicit trajectory-card spacing, readable responsive monthly/reflection metric cards, clearer month-grid separation, and layout regression coverage while preserving archive behavior and all protected features.
- [x] Conduct a read-only post-934b064 performance regression investigation for scrolling lag and delayed taps, including long-history behavior, then present an approval-gated fix plan without changing any existing feature, calculation, user-facing mechanism, profile-logo behavior, animation, media, or backup flow.
- [x] Apply the approved internal Performance Regression Recovery render-boundary corrections for Home, Dashboard, and Analytics without changing UI, mechanics, calculations, profile-logo behavior, animations, media, backups, or Google Sheets behavior.
- [x] Retain the useful long-history cache and bounded-range safeguards while removing broad-screen invalidation from interaction paths.
- [x] Add deterministic render-boundary and cache-reuse regression coverage for the recovered performance paths.
- [x] Run full TypeScript, test, lint, and static-export validation for the approved Performance Regression Recovery without starting an APK build.
- [x] Checkpoint and synchronize the validated Performance Regression Recovery to private GitHub without starting an APK build or workflow.
- [x] Inspect the supplied eight-character portrait archive and the existing Focus Command portrait-file requirements without changing the app or existing characters.
- [x] Define ten distinct new character concepts with separate colors, silhouettes, and roles that avoid duplication with the existing portraits.
- [x] Present the proposed ten-character transparent-PNG generation plan and wait for explicit approval before generating any files.
- [x] Generate and verify the approved ten-character transparent PNG portrait files without integrating them into the app.
- [x] Package and deliver the verified ten-character transparent PNG portrait pack separately from the app.
- [x] Audit the supplied reference portraits against the generated pack to identify the premium colour, contrast, lighting, and glaze differences without changing any app or portrait file.
- [x] Define and present an approval-gated Portrait Glaze and Colour Upgrade plan before regenerating or replacing any standalone portrait.
- [x] Regenerate and validate the approved glazed portrait replacements exclusively in the separate asset-pack folder, without changing any Focus Command file.
- [x] Package and deliver the upgraded standalone portrait pack, retaining the original pack separately and without changing Focus Command.
- [x] Inspect the reported app launch failure from the supplied recording, current runtime state, logs, and startup code without changing any app behavior.
- [x] Identify the exact launch-failure root cause and present an approval-gated, internal-only repair plan that preserves all user-facing mechanisms and optimizations.
- [x] Add only the missing customQuestions dependency to Home’s narrow startup snapshot and add a regression contract for the combo/briefing first-render path.
- [x] Run full TypeScript, regression, lint, and static-export validation for the approved launch repair; confirm the existing scroll and confirmed-tap performance contracts still pass.
- [x] Checkpoint and synchronize only the validated launch repair to GitHub without starting an APK build or workflow.
- [x] Audit the Day 1–Day 7–Day 30 revision enrollment and cadence mechanism, correct archive-topic source assumptions, and inspect the reported touching archive cards; present an approval-gated plan without changing app behavior.
- [x] Correct archive revision-topic mapping and cadence reporting; add matching Seed Sown/Emerging/Developing/Matured filters to the Yearly Revision Overview and a new clearly separated, searchable Lifetime Revision Overview; repair the touching overview-card gap; and validate without altering protected behavior. TypeScript, all 36 test files / 198 tests, lint, and static export pass.
- [x] Synchronize the validated Revision Archive Accuracy, Lifetime View, Progress Filter, Search & Card Spacing checkpoint to the private GitHub main branch without starting an APK build or workflow. GitHub main confirmed at `a69f48c`.
- [x] Audit Home’s emotion-guidance quote selection and the marked compact header area; propose an approval-gated larger emotion-specific guidance library and a personalized ticker without altering existing behavior.
- [x] Revise the compact-header proposal for one fully visible short emotional signal only, with no duplicated Home/Dashboard values; restate the green forecast-area plan separately before seeking approval.
- [x] Refine the compact-header signal into a one- or two-word prediction derived from all available emotional reflection data, without duplicating any existing Home or Dashboard content.
- [x] Revise the compact-header proposal for three distinct one- or two-word emotion predictions per emotional profile, rotating every three seconds and opening a polished explanation view when tapped, while keeping the control inside the marked header area.
- [x] Pair every compact prediction with its own matching icon from an offline prediction-icon library, rotating icon and prediction together without changing the capsule dimensions or header layout.
- [x] Require capsule-width measurement and responsive layout regression coverage so every prediction icon, phrase, chevron, and touch target stays fully visible without clipping, overlap, truncation, or off-screen content at supported mobile widths.
- [x] Implement the approved emotion-only forecast library, preserving the green-area location, sentence format, existing five-second timing, and five distinct guidance messages for each emotional profile.
- [x] Implement the approved compact header prediction capsule with three icon-paired, one- or two-word emotion predictions per profile that rotate every three seconds without duplicating existing Home or Dashboard content.
- [x] Add the approved tappable Prediction Library explanation view with current prediction chips, transparent non-clinical emotional-source explanation, and reduce-motion-safe presentation.
- [x] Add complete tests and real narrow-width verification for prediction uniqueness, icon pairing, timing, source constraints, no clipping, header safety, and preservation of protected Home behavior.
- [x] Synchronize the validated emotion-guidance and compact Prediction Library checkpoint to the private GitHub main branch without starting an APK build or workflow. GitHub private main confirmed at `e06457e`.
- [x] Audit the supplied responsiveness video and Focus Command touch-to-action paths, render boundaries, navigation, animations, persistence, and long-history safeguards; propose an approval-gated internal smoothness plan without changing user-facing behavior.
- [x] Implement the approved navigation-first mission-result completion scheduling and non-critical subscriber follow-up batching without changing durable completion semantics, rewards, feedback, or visible controls.
- [x] Tighten remaining mission-result transition render boundaries and defer only non-essential result-screen setup after the first navigation frame, preserving all report content and behavior.
- [x] Add deterministic latency, ordering, double-tap-lock, persistence, and render-boundary regression coverage; complete TypeScript, full test, lint, and static-export validation without starting an APK build.
- [x] Preserve checkpoint `65797978` as the recovery point and inspect the exact private GitHub Actions Android APK failure logs without changing application code or workflow files.
- [x] Identify and present an approval-gated minimal repository-only APK workflow repair that cannot alter Focus Command features, mechanisms, calculations, or protected build inputs.
- [x] After explicit approval, apply only the validated workflow repair, run all non-APK local checks, preserve a checkpoint, and provide safe GitHub Actions rerun guidance.
- [x] Synchronize the already-validated Touch-to-Action & Smoothness checkpoint and only the confirmed ticker JSX parser correction to private GitHub main, with no workflow or APK build trigger.
- [x] Preserve checkpoint `91525b3c` as the recovery point and retrieve the exact failed Android APK Actions log for private-main commit `3c3a029` without changing repository files.
- [x] Audit the complete release-build path for independent parser, TypeScript, Metro, dependency-lock, Expo configuration, native Android, Gradle, and workflow blockers; present a root-cause-verified approval-gated plan.
- [x] After explicit approval, apply only the minimal verified repair, validate all available local release checks, preserve a checkpoint, and provide safe manual rerun guidance without triggering an APK build.

- [x] Replace only private-main’s corrupted `components/emotion-prediction-ticker.tsx` through authenticated Git transport, verify the exact remote SHA-256 against the validated local component, and inspect the one-file commit scope.
- [x] Preserve checkpoint `1b3a21c8`, retrieve the exact Android APK build-#45 raw log for commit `2aaad93`, identify the first actual release failure, and audit all directly related blockers without changing repository source.
- [x] Present an evidence-based, approval-gated remediation plan for build #45; do not change GitHub, workflow, Android, dependencies, or Focus Command behavior before approval.

- [x] Atomically replace only the two proven truncated private-main production libraries (`lib/home-motivation.ts` and `lib/emotion-predictions.ts`) with their checksum-verified validated versions, then audit the committed remote tree and repeat release-safety validation without starting an APK build.

- [x] Establish a verified private-repository Git transport credential after the OAuth device token’s confirmed lack of `repo` access, then complete only the approved two-file atomic parity repair and remote-tree verification.

- [x] Generate a one-time repository-scoped SSH deploy key, have the owner add its public half with write access, and use it only for the approved two-file atomic repair.
- [x] Have the repository owner remove the temporary `Focus Command two-file repair (temporary)` deploy key, then delete its local private half from the sandbox.

- [x] Audit the Home prediction ticker and Mini Achievement ticker in their existing positions for protected visual-polish opportunities, interaction safety, animation cost, and compact-layout resilience without changing features or mechanisms.
- [x] Audit Home touch-to-action latency, render boundaries, persistence timing, and navigation scheduling for further internal smoothness improvements; present an approval-gated plan before modifying source.

- [x] Implement only the approved prediction-ticker and Mini Achievement ticker visual polish, exact-input rendering boundaries, and immediate existing press acknowledgement without changing their position, content logic, route, or data semantics.
- [x] Add and run regression coverage for ticker compactness, reduced-motion preservation, routes, memoized rendering boundaries, and rapid-tap safety; complete the full local release preflight.
- [x] Synchronize only the validated ticker-polish and internal responsiveness changes to private GitHub main through a verified Git transport credential; do not start an APK build. GitHub private main confirmed at `5124dd8`.

- [x] Audit and present an approval-only plan for showing due mission-linked revision topics inside the existing live-mission screen, with in-place completion that advances the established Day 1 → Day 7 → Day 30 record while preserving manual topic logging and every unrelated mechanism.
- [x] Implement the approved in-place live-mission due-revision rows and exact-record completion action, while retaining manual topic logging, due-date rules, notification behavior, and existing queue/Home fallback behavior.
- [x] Add and run regression coverage for live-mission due-topic selection, Day 1/7/30 advancement, mission ownership, duplicate-name independence, reminder timing, and rapid-tap locking; complete the full local release preflight.
- [x] Synchronize only the validated live-mission revision-completion source and tests to private GitHub main through the available approved repository key; do not start an APK build. GitHub private main confirmed at `ac70baa`.
- [x] Add the approved durable Revision Activity History with backward-compatible state normalization, recording real topic logging and Day 1/Day 7/Day 30 completion actions without changing the established spaced-revision cycle.
- [x] Update the Dashboard weekly review and existing monthly, yearly, and lifetime Revision Overviews to show real period-based revision activity with the existing named phase filters and exact record navigation.
- [x] Update the offline backup export, validation, and restore flow so Revision Activity History round-trips safely without losing existing data.
- [x] Change only the existing Mini Achievement ticker card base background to jet black while retaining all layout, content, route, rating, rotation, and interaction behavior.
- [x] Add and run regression coverage for revision activity recording, legacy-data normalization, period and timezone boundaries, named phase filters, backup round-trip, existing revision-cycle preservation, and ticker surface protection; complete the full release preflight.
- [x] Synchronize only the validated Revision Activity History, revision-overview, backup, ticker-surface, checklist, and regression-test source to private GitHub main; do not start an APK build. GitHub private main confirmed at `419b4c8`.
- [x] Audit the protected character-evolution cinematic, Total Power display, color-customization system, and Home tickers; prepare a concise proposal only, with no implementation until explicit approval.
- [x] Add cached automatic dominant-accent extraction for every active built-in or uploaded character presentation, and apply only the derived backdrop, vertical rod, and rear aura colors to the protected cinematic.
- [x] Replace only the cinematic reward-strip Total XP label/value with the existing Total Power calculation.
- [x] Preserve global palette application across every app section and add protected dedicated color-source/custom-color controls for the Mini Achievement and Prediction tickers without changing their mechanisms.
- [x] Add regression coverage and complete full validation for automatic color derivation, caching, palette precedence, Total Power presentation, ticker customization, and protected cinematic behavior.
- [x] Diagnose the reported before-and-after cinematic visual regression and present a protected correction plan before making any additional change.
- [x] Improve save-time cached character color selection and derive reliably distinct cinematic backdrop, rod/portal, and aura tokens without changing any protected cinematic mechanism.
- [x] Add focused contrast regression coverage, complete release validation, and push only the validated protected correction to GitHub without starting an APK build.
- [x] Generate and deliver a non-production reference image that illustrates the corrected cinematic color-contrast treatment.
- [x] Audit the current protected cinematic against the supplied premium reference style and present a strictly scoped multi-color cinematic redesign proposal; do not implement until explicit approval.
- [x] Implement the approved protected reference-style cinematic reconstruction: cached automatic multi-color roles, premium decorative layers, compatibility safeguards, regression coverage, and full preflight validation.
- [x] Implement the approved protected Home profile-card appearance control with independent Global Palette, Active Character Palette, and Custom sources, limited to render-only decorative card colors.
- [x] Add backward-compatible Home-card appearance regression coverage and complete TypeScript, full-test, lint, static web-export, and Android JavaScript-bundle preflight validation without starting an APK build.
- [x] Apply the approved strictly render-only premium transparent-glass treatment to the user-marked opaque cinematic background panels without changing protected timing, media, rewards, interaction, layout, or behavior.
- [x] Diagnose and repair the repeated managed development-preview load failure after server restart by forcing interactive Expo startup, without changing app features, data, or user-facing behavior.
- [x] Generate and deliver a non-production visual reference that demonstrates the intended genuinely transparent, character-tinted cinematic glass-panel treatment.
- [x] Generate and deliver a higher-transparency cinematic glass visual reference in which the portal geometry and atmosphere are clearly visible through the panels.
- [x] Inspect and, only after approval, correct the cinematic layer order so the complete marked outer background and reward template become genuinely transparent premium glass over the actual underlying cinematic visual, without changing media, timing, rewards, interactions, or any user-facing mechanism.

- [x] Revise the approved-pending cinematic glass treatment so its full outer and reward surfaces are neutral transparent glass with no derived-colour tint, while derived character colours remain limited to the existing rod, portal, particle, and text accent layers.

- [x] Generate and deliver a plan-faithful non-production reference showing the complete outer cinematic area and reward template as nearly clear premium glass over the real underlying cinematic visual, for approval before implementation.
- [x] Refine only the approved neutral cinematic glass material with a double neutral edge, short upper specular sweep, soft outer separation, and restrained ultra-thin blur while preserving Home visibility, performance, and all protected cinematic behavior.
- [x] Audit and, only after approval, extend the offline backup round-trip contract for all applicable current saved feature data without changing existing restore behavior or inventing data.
- [x] Audit and, only after approval, strengthen one-tap action guards so a single user tap cannot trigger duplicate state transitions while preserving every existing action and interaction rule.
- [x] Audit and, only after approval, address measured rendering and interaction hot paths for sustained smooth scrolling and faster touch-to-action response without changing user-facing mechanisms.
- [x] Audit and, only after approval, refine protected cinematic text legibility with automatic all-character high-contrast neutral jet-black-compatible readability zones and a restrained neutral vignette, without changing cinematic wording, hierarchy, timing, media, rewards, or interactions.
- [x] Audit and, only after approval, refine the protected cinematic rod so its glass/glaze side rails derive from the active global card-surface color while its centre core derives from the active character primary color, without changing cinematic timing, media, rewards, interactions, or any other decoration.
- [x] Validate, checkpoint, and synchronize only the approved automatic surface-and-primary rod treatment to private GitHub main without starting an APK build or workflow.
- [x] Inspect the reported duplicate audio when confirming mission results, verify the related confirmation and sound paths, and propose a safe repair without changing any approved user-facing mechanism.
- [x] Audit core feature logic and long-term performance hot paths, then propose only user-approved changes for instant touch response, smooth scrolling, and durable lifetime-scale performance.
- [x] Make Mission Report the route-safe single owner of one mission-result sound, preserve existing sound settings and navigation, and add deterministic duplicate-audio regression coverage.
- [x] Strengthen internal mission-completion and lifetime-history performance safeguards without changing stored data, screens, actions, or feature mechanisms.
- [x] Run full release validation for the approved single-cue and performance-preservation update without starting an APK build or workflow.
- [x] Checkpoint and synchronize only the approved single-cue and performance-preservation update to private GitHub main.
- [x] Re-inspect the latest reported duplicate mission-result audio recording and trace every remaining playback path before proposing any repair.
- [x] Propose and, only after explicit approval, apply a strictly scoped duplicate-audio repair without altering any user-facing mechanism.
- [x] Isolate foreground Achievement Recap audio from the Mission Report result cue while retaining the existing recap notification banner and all other reminder audio roles.
- [x] Add and run deterministic one-confirmation/one-audible-cue regression coverage without changing any feature mechanism.
- [x] Run full release validation for the approved foreground Achievement-Recap Audio Isolation repair without starting an APK build or workflow.
- [x] Checkpoint and synchronize only the approved foreground Achievement-Recap Audio Isolation repair to private GitHub main.
- [x] Remove stale character milestones with their originating deleted progression events and rebuild correct surviving character-period boundaries.
- [x] Add the approved upward connector draw, compact Missions/Gold/level-range node details, and explicit historic reward snapshots without altering the protected Home cinematic.
- [x] Add correction regressions, run full release validation, checkpoint, and safely synchronize the approved correction to GitHub without an APK build.
- [x] Inspect and propose a slower, glowing, long-history-safe upward connector animation for the Character Achievement Path without changing its ordering or interactions.
- [x] Audit offline backup creation and restoration for all currently persisted character-path data, with backward-compatible round-trip coverage.
- [x] Profile current interaction, scrolling, rendering, and persistence hot paths; propose only protected internal performance recovery changes for long-term smoothness.
- [x] Implement the approved sequential glowing path draw with user-controlled follow cancellation and Reduced Motion completion.
- [x] Preserve historic milestone portraits through offline backup restore, with compatibility coverage for path data and older archives.
- [x] Apply only measured internal responsiveness improvements and validate long-history interaction, scrolling, persistence, and single-fire tap behavior.
- [x] Run the full release validation suite and publish the approved update to GitHub without starting an APK build.
