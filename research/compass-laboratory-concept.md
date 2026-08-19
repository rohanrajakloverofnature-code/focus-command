# Focus Command Compass Laboratory

## Approval-only concept brief

**Status:** Research and design only. No Focus Command application code, UI, saved user data, backup format, or user-facing behaviour has been changed.

## Core idea

**Compass Laboratory** would turn Focus Command from a record of what a user did into a private, offline **personal behavioural research companion**. It would not diagnose the user, claim to read their mind, or give generic productivity advice. Instead, it would help the user learn one reliable thing about their own work at a time through short, voluntary, fair comparisons.

> "When I start my afternoon mathematics mission by writing the exact first question, I return after interruptions more easily."

That statement would be a **Personal Law**: a small observation supported by the user's own matched sessions, written with honest uncertainty rather than exaggeration.

## Why it is distinct

Most productivity apps show dashboards, streaks, or generic recommendations. Even apps that display personal analytics usually compare a user with other users or assume that correlation is a personal cause. Compass Laboratory would instead create a lightweight **within-person experiment**: the same user tries one chosen condition on comparable missions and leaves other comparable missions unchanged. The user gradually learns what works for *them*.

This is not a social feed, a leaderboard, an AI diagnosis, or a cloud service. It is a private behavioural instrument built around the user's real work history.

## The experience in plain language

At a calm moment, not while the user is trying to work, the app may say:

> **A possible experiment:** On similar afternoon study missions, try writing the next physical action before pressing Start. Would this help you restart with fewer interruptions?

The user can choose **Try it**, **Change it**, or **Not now**. If they choose Try it, Focus Command marks only some reasonably similar future missions as a **Compass Trial**. The rest continue exactly as normal. Each trial makes one small change that the user explicitly selected.

After enough fair comparisons, the app may create a result card such as:

| Personal Law | Evidence | Honest interpretation |
|---|---|---|
| **The First-Step Effect** | 8 matched afternoon mathematics missions; missions with a written first action had 17 more focused minutes on average and fewer logged interruptions | **Promising, not proven.** Keep trying it if it feels useful. |

The app never says "this will cure procrastination" or "your brain works this way." It says what the user's own data has observed, what was compared, and how certain the observation is.

## The scientific logic behind it

The feature combines five established ideas, but applies them in a personal, offline, game-like system.

| Evidence principle | What research supports | Compass Laboratory interpretation |
|---|---|---|
| **Implementation intentions** | Specific if–then plans can improve goal completion because they link a cue with a planned response. [1] | The user chooses a precise action such as: *If I sit down for Chemistry at 7 PM, I write the first equation before Start.* |
| **Autonomous motivation** | Behaviour is more sustainable when people experience autonomy, competence, and relatedness rather than pressure. [2] | The user selects, edits, pauses, or rejects every trial. There are no punishments, shame messages, or forced missions. |
| **Self-efficacy and mastery evidence** | Success experiences are an important source of efficacy beliefs. [3] | Personal Laws show concrete evidence of small wins from the user's own history instead of empty encouragement. |
| **Personal informatics reflection** | Self-tracking can support reflection, but data does not automatically create insight; systems must support interpretation. [4] | The app turns raw focus, interruption, reflection, and revision data into an explainable question, comparison, and finding. |
| **Within-person experimentation** | Micro-randomized and within-person designs can assess how interventions work in context over time. [5] | Similar sessions are balanced between a chosen condition and a normal comparison, avoiding simplistic conclusions from one good or bad day. |

## Existing data only: no invasive surveillance

Compass Laboratory would work primarily from data Focus Command already records locally: mission timing and completion, invested time, mission type or topic, interruption category and timing, reflection/debrief fields the user already chooses to log, revision activity, and the local day/time context.

It would **not** read notifications, inspect other apps, track location, monitor the microphone, read messages, or send behavioural data to a server. The optional trial input would be one short user-authored phrase, such as "open notes before timer" or "put phone across room." The user may delete a trial or a Personal Law at any time.

## How a fair trial works

The design deliberately avoids treating unrelated sessions as evidence. A trial starts only if the app has enough comparable history to form a useful group, for example, focus missions of a similar length, subject/type, and local time window. It also avoids stacking multiple interventions together.

| Step | What happens | Safeguard |
|---|---|---|
| 1. Pattern invitation | The app identifies a question, never a diagnosis. | No result is shown without enough relevant history. |
| 2. User chooses one lever | The user selects a very small action. | No automatic habit, restriction, or external enforcement. |
| 3. Balanced sessions | Comparable missions are lightly alternated between **Try** and **Normal**. | Only one active Compass Trial at a time. |
| 4. Private measurement | The app compares existing focused time, completion, distraction logs, and optional reflection. | It displays the number of matched sessions and data gaps. |
| 5. Personal Law or no finding | A result is saved only if the difference is stable enough; otherwise it says **No clear pattern yet**. | No fabricated certainty and no negative label for the user. |

The feature can include a simple offline deterministic balancing rule rather than a remote algorithm: for the next comparable eligible mission, assign the condition with fewer completed comparable sessions so the groups remain approximately even.

## Example personal experiments

| User's real pattern | Voluntary experiment | Existing outcomes observed | Possible Personal Law |
|---|---|---|---|
| Afternoon missions show frequent phone interruptions | Place phone outside arm's reach before Start | Interruption count, return time, completed focused minutes | **Distance protects afternoon focus.** |
| Revisions are postponed after a long mission | Start a 5-minute revision immediately after finishing a focus mission | Whether the due revision is completed and later recall/reflection input, when present | **A short bridge makes revision easier.** |
| The user loses momentum after a pause | Write the next physical step before pausing | Time from resume to productive work, pause frequency, completion | **A named return point beats a blank return.** |
| Evening work is frequently abandoned | Begin with a two-minute warm-up mission chosen by the user | Completion rate and focused time for comparable evening missions | **A small opening lowers evening resistance.** |

## Premium RPG expression

The visual design would not use childish badges or pretend neuroscience. Instead, each validated Personal Law becomes a discreet **Compass Glyph** in a private **Atlas of Self**. The glyph is an archived discovery, not a reward currency.

An example glyph may read:

> **THE NAMED RETURN**  
> In 10 matched missions, leaving a next-step note before pausing was associated with a 31% faster return.  
> *Evidence: moderate · Updated 18 August 2026*

Over months and years, the Atlas becomes a personal manual: the user can see which conditions consistently support their focus, learning, recovery after interruptions, and revision. It would be far more meaningful than a global productivity score because it is based on the user’s own life.

## Boundaries that protect the user

The feature must not be presented as clinical assessment, medical advice, a diagnosis, or proof of causation. It must use language such as **"was associated with"**, **"in your comparable sessions"**, and **"no clear pattern yet"**. It must never reduce XP, Total Power, rewards, or character progress for declining a trial or having a difficult week.

No existing mission, revision, Focus Friction, reflection, reward, cinematic, personalization, backup, or offline mechanism would change. Compass Laboratory would be optional and additive; users who never open it would experience the app exactly as they do now.

## Why this can be extraordinary

The novelty is not merely a new chart. Compass Laboratory turns private, long-term behavioural data into a **personal science loop**:

```text
Real work → private observation → user-chosen small experiment
→ fair comparison → honest personal insight → more intentional real work
```

That loop makes the app a companion for becoming self-aware rather than merely disciplined. It respects that a user is not a statistic, and it can become more useful over years precisely because it learns from their own accumulated history while keeping it on their device.

## Preserved future idea

The earlier **privacy-first QR expedition** concept remains parked in the future-ideas bucket. It is intentionally not part of Compass Laboratory and no QR, social, account, or server system is proposed here.

## Approval-gated implementation outline

If approved later, implementation should be split into tightly protected stages: first an isolated local data model and pure matching/measurement helpers; second a private invitation and one active trial flow; third the Atlas of Self only after the evidence logic is verified; and finally offline-backup round-trip coverage. Every stage should preserve the current user-facing mechanics and be separately proposed before implementation.

## References

[1]: https://pmc.ncbi.nlm.nih.gov/articles/PMC4732571/ "Gollwitzer & Sheeran: Implementation intentions and goal achievement"

[2]: https://selfdeterminationtheory.org/theory/ "Self-Determination Theory: autonomy, competence, and relatedness"

[3]: https://www.uky.edu/~eushe2/Bandura/Bandura1994EHB.pdf "Bandura: Self-efficacy and mastery experiences"

[4]: https://maplab.stanford.edu/self-tracking-self-insight-and-behavior-change "Stanford MAP Lab: self-tracking, self-insight, and behaviour change"

[5]: https://pmc.ncbi.nlm.nih.gov/articles/PMC7101074/ "Micro-randomized trials in mobile health interventions"
