# The Threshold Protocol

## A personal, resistance-specific way to begin when motivation is absent

> **Core proposition:** The feature does not ask a user to “feel motivated.” It reduces the immediate emotional and practical cost of crossing from avoidance into the first physical action of work.

## The experience

The user has selected a mission but feels unable to begin. Instead of a quote, a streak warning, a generic timer, or a data dashboard, they tap a small **“Break the Threshold”** control.

Focus Command opens a dark, cinematic-but-lightweight full-screen ritual called **The Threshold**. It asks one question with five fast choices: *What is stopping you right now?* The choices are **Too Big**, **Too Tired**, **Afraid It Will Be Bad**, **Pulled Away**, and **I Do Not Know the First Move**. There is also **Skip the question**.

It then gives one exact **entry move**—not “study for two minutes.” For example:

> *Your mission is Algebra. Do not solve it yet. Open the notebook and circle the first question. The threshold ends there.*

The user receives a private 90-second **Threshold Run**. It is deliberately separate from their normal focus session: it gives no XP, does not change a streak, does not create a failure if abandoned, and never changes the mission’s existing timer, revision logic, rewards, cinematic flow, or data. At the end, the user chooses **Enter Mission**, **Try another doorway**, or **Leave for now**. Only *Enter Mission* starts the normal existing Focus Command mission.

This makes the smallest action psychologically honest. The user is not pretending to commit to an entire work block; they are only crossing one tiny, concrete boundary.

## What makes it extraordinary

Most apps offer a generic Pomodoro timer, a task-breakdown tool, or a broad “procrastination wizard.” The Threshold Protocol would be a private **personal initiation system** that learns the user’s *specific* resistance signatures and returns only the smallest action that has helped them cross before.

It is neither a mood tracker nor a dashboard. Its intelligence is visible only in the difficult moment. After enough comparable encounters, it can say something modest and truthful such as:

> *On three previous late-evening Maths starts, you crossed after choosing one question—not after planning the whole chapter. Use that doorway again.*

That is not a claim that the action caused success. It is explicitly presented as the user’s own recurring evidence, with the number of comparable observations shown. The user can always choose a different doorway, edit the move, turn learning off, or delete the data.

## The personal learning loop

| Moment | What the user sees | What the app privately learns |
|---|---|---|
| A selected mission feels hard to start | One tap: **Break the Threshold** | The mission’s category, subject, local time band, and optional resistance choice. |
| The first 90 seconds | One exact physical or cognitive entry move, such as “open the file and write a deliberately rough heading.” | Which entry move was offered and whether the user crossed into the usual mission. |
| Later similar moment | A calm, concise personal cue rather than a generic tip. | A narrow, local pattern only when there are enough comparable observations. |
| Optional learning mode | The user can allow two safe entry moves to be fairly alternated. | Whether one doorway appears more helpful for this user under this specific context; results remain labelled as personal and preliminary. |

The first version should offer only user-editable, task-appropriate doorway types:

| Resistance signal | Entry move pattern |
|---|---|
| **Too Big** | Shrink the target to one visible object or one answered item. |
| **Too Tired** | Prepare the material and perform one low-cognitive-load contact with it. |
| **Afraid It Will Be Bad** | Create an intentionally rough first mark, line, heading, or outline. |
| **Pulled Away** | Remove one immediate competing cue, then touch the study/work material once. |
| **No First Move** | Select the literal first object, page, file, or question. |

## Why this is grounded in behavioural science

The design is not based on the assumption that procrastination is laziness. Pychyl and Sirois describe procrastination as short-term mood repair: an aversive task is delayed to escape an unpleasant present feeling, even though the delay has longer-term costs.[1] A large functional-analysis review likewise argues that people delay for different reasons and that remedies should target the individual conditions maintaining delay, rather than use one universal fix.[2]

The one-action Threshold Run applies the approach-versus-avoidance logic of behavioural activation without presenting itself as therapy or making medical claims. It moves the user toward a small, values-linked action instead of asking them to reason their way out of discomfort.[3] The concrete “when resistance X, do move Y” structure is an implementation intention, a form of if–then planning shown to reduce the intention–action gap; a review reports a medium-to-large average effect on goal attainment across 94 studies involving more than 8,000 participants.[4]

The system is deliberately non-shaming. Self-determination theory favours user agency, competence, and user-owned choices over pressure and punishment.[5] Therefore, leaving the Threshold Run is allowed; it never damages progression. When relevant, the feature recalls a factual personal mastery example rather than praising an abstract trait, consistent with evidence that direct mastery experiences are important sources of self-efficacy.[6]

Finally, its optional learning mode borrows the careful logic of just-in-time adaptive interventions and personal N-of-1 experimentation. It can compare a small number of user-approved doorway strategies within genuine daily contexts, while reporting uncertainty rather than pretending correlation is certainty.[7] [8]

## How it would use Focus Command’s existing private data

| Existing local data | Use inside the Threshold Protocol | Explicit non-use / protection |
|---|---|---|
| Mission title, category, subject, planned duration, start and completion times | Select an appropriate entry move and identify comparable start contexts. | Does not change mission duration, completion, XP, Power, gold, or mission rules. |
| Distraction logs and timestamps | Allow the **Pulled Away** doorway only as a personalised cue when relevant. | Does not expose or upload activity history. |
| Reflections and debriefs | Optional user-approved wording for an entry move; never automatic sentiment diagnosis. | Does not reinterpret old reflections or alter their display. |
| Revision history | Let study-specific entry moves refer to a due topic when the selected mission already has one. | Does not alter spacing, phases, completion, or archives. |
| Character/profile progression | May render the ritual in the app’s RPG language and theme only. | Does not touch the protected cinematic, profile animation, portraits, media, audio, rewards, or achievement path. |

The feature needs a small, new, backward-compatible local record only for Threshold encounters: mission reference, optional chosen resistance, doorway shown, local time bucket, whether the user entered the normal mission, and an optional user-edited note. It does not retain a background trace of phone activity and requires no account, server, or network access. Existing offline backups would include these records once the user approves implementation.

## What it would look and feel like

The interaction should feel like a **brief command bridge**, not an additional screen to maintain. It uses Focus Command’s jet-black premium surface, the user’s existing theme accents, one restrained moving light line, and a short 90-second progress arc. There are no noisy charts, confetti, generic motivational quotes, streak losses, or forced questionnaires.

The final moment uses a simple line of agency:

> *You only had to open the door. The mission is still your choice.*

## Scope and safeguards

1. The feature remains completely offline and uses only local data.
2. It is opt-in, editable, pausable, and deletable. The user can start a mission exactly as today without ever seeing it.
3. It makes no mental-health diagnosis, no promise of motivation, and no causal claim from a small personal sample.
4. It does not change any existing user-facing mechanism or protected cinematic behaviour. The normal mission starts only after the user explicitly chooses **Enter Mission**.
5. Its tiny pre-start view and records are isolated from normal session state so it does not create continuous background work or a performance cost.

## Differentiation statement

I cannot honestly prove that no person anywhere has made something vaguely similar. The market review found adjacent features—generic timers, task decomposition, first-step advice, and a generic procrastination wizard—but not a mainstream focus product combining all four parts: **a user-named resistance state, a private resistance-specific entry move, factual personal evidence from matched past starts, and an opt-in local experiment that learns which doorway helps that individual cross.** This combination is the differentiated opportunity.

## References

[1]: https://doi.org/10.1111/spc3.12011 "Sirois & Pychyl (2013), Procrastination and the Priority of Short-Term Mood Regulation"
[2]: https://pmc.ncbi.nlm.nih.gov/articles/PMC9669985/ "Svartdal & Løkke (2022), The ABC of academic procrastination"
[3]: https://pmc.ncbi.nlm.nih.gov/articles/PMC2882847/ "Mazzucchelli, Kane & Rees (2010), Behavioural activation interventions for well-being"
[4]: https://pmc.ncbi.nlm.nih.gov/articles/PMC4500900/ "Wieber, Thürmer & Gollwitzer (2015), Implementation intentions"
[5]: https://www.urmc.rochester.edu/community-health/patient-care/self-determination-theory "University of Rochester Medical Center, Self-Determination Theory"
[6]: https://www.apa.org/research-practice/conduct-research/self-efficacy-human-agency "American Psychological Association, Self-efficacy"
[7]: https://pmc.ncbi.nlm.nih.gov/articles/PMC4732571/ "Klasnja et al. (2015), Micro-Randomized Trials"
[8]: https://pmc.ncbi.nlm.nih.gov/articles/PMC9793632/ "Zenner et al. (2022), StudyMe N-of-1 trials"
