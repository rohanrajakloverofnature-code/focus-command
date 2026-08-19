# Deep Behavioural-Science Notes for Focus Command

## Verified sources and relevant findings

### Implementation intentions and goal pursuit

- **Source:** New York University, Peter M. Gollwitzer research profile — https://as.nyu.edu/faculty/peter-m-gollwitzer.html
- **Finding:** Gollwitzer's work explicitly studies implementation intentions (specific if-then plans) versus broad goal intentions, including action initiation, goal pursuit under stress, flexibility/rigidity, and mental contrasting with implementation intentions.
- **Product implication:** A focus app should not merely record an intention to work. It can support a user-selected, specific response to a personally observed context or obstacle.

### Autonomy, competence, and sustained motivation

- **Source:** University of Rochester Medical Center, *Self-Determination Theory* — https://www.urmc.rochester.edu/community-health/patient-care/self-determination-theory
- **Finding:** The source describes autonomy, competence, and relatedness as psychological needs. It says autonomous/value-based motivation is associated with greater persistence and wellbeing than behavior driven mainly by rewards, punishment, or pressure.
- **Product implication:** Recommendations should be optional, explainable, user-editable, and framed as experiments. The application should not use controlling shame, streak loss, or compulsory prescriptions.

### Micro-randomized trials and just-in-time adaptive interventions

- **Source:** Klasnja et al., *Micro-Randomized Trials: An Experimental Design for Developing Just-in-Time Adaptive Interventions*, Health Psychology (2015), PMCID: PMC4732571 — https://pmc.ncbi.nlm.nih.gov/articles/PMC4732571/
- **Finding:** Micro-randomized trials can estimate the near-term causal effects of intervention components and assess how effects vary with time-dependent context. The paper explains that this supports decisions about what intervention may help, and when.
- **Product implication:** Rather than inferring that a tip caused improvement from normal history, an app can let the user opt into small, fairly rotated self-experiments and report results as personal evidence only after sufficient observations.

### Habit formation and self-regulation

- **Source:** van der Weiden et al., *How to Form Good Habits? A Longitudinal Field Study on the Role of Self-Control in Habit Formation* (2020), PMCID: PMC7135855 — https://pmc.ncbi.nlm.nih.gov/articles/PMC7135855/
- **Finding:** The study examines real-life habit formation over 90 days and the role of self-control in developing good habits.
- **Product implication:** The feature should focus on small repeated contextual responses and progress over time, not promise immediate habit transformation.

## Design guardrails derived from the evidence

1. Never diagnose the user or claim certainty from correlation alone.
2. Keep all trial choices, history, and results on-device by default.
3. Use user-authored goals and strategies to retain autonomy.
4. Report uncertainty and the number of comparable observations.
5. Allow the user to pause, discard, or delete experiments without affecting missions, XP, revision history, or core progress.

## Additional evidence from the deep review

### User-centric N-of-1 self-experimentation

- **Source:** Zenner et al., *StudyMe: a new mobile app for user-centric N-of-1 trials*, Trials (2022), PMCID: PMC9793632 — https://pmc.ncbi.nlm.nih.gov/articles/PMC9793632/
- **Finding:** N-of-1 trials use pre-defined sequences or phases to help an individual compare what works toward that person’s own goal. The paper distinguishes individual evidence from average-population evidence and describes four user-controlled elements: goal, intervention, measure, and schedule. Its user evaluation reports that participants could create unique trials successfully.
- **Product implication:** Focus Command can turn a user’s own focus data into small, optional, transparent experiments rather than make generic recommendations or psychological claims.

### Metacognitive calibration in learning

- **Source:** Behrendt et al., *Relation of life sciences students’ metacognitive monitoring to neural activity during biology error detection*, npj Science of Learning (2024), PMCID: PMC10912288 — https://pmc.ncbi.nlm.nih.gov/articles/PMC10912288/
- **Finding:** The paper defines metacognitive calibration as the match between subjective self-assessment and objective performance, describing it as central to error detection, self-monitoring, and self-regulated learning. It reports that low-performing learners can be overconfident on complex material and that calibrated monitoring is relevant to strategy selection.
- **Product implication:** A study feature can compare a learner’s simple confidence prediction with later evidence, but it must use neutral language, avoid diagnosis, and make clear that it is a self-reflection signal rather than a measure of intelligence.

### Lived personal informatics and recovery after lapses

- **Source:** Epstein, Ping, Fogarty, and Munson, *A Lived Informatics Model of Personal Informatics*, UbiComp (2015), PMCID: PMC12435389 — https://pmc.ncbi.nlm.nih.gov/articles/PMC12435389/
- **Finding:** The field study of activity, finance, and location trackers describes personal informatics as an iterative process of collection, integration, reflection, and action. It identifies multiple forms of lapsing, including forgetting, upkeep burden, intentional skipping, and suspension, and frames resuming after a lapse as an important design problem.
- **Product implication:** The feature should treat lapses as information and offer a dignified resumption flow, rather than punishing them through lost streaks or negative labels.

### Personal experimentation in digital behaviour change

- **Source:** Kovacs et al., *Rotating Online Behavior Change Interventions Increases Effectiveness but Also Increases Attrition*, CSCW (2018), Stanford HCI — https://hci.stanford.edu/publications/2018/habitlab/habitlab-cscw18.pdf
- **Finding:** HabitLab combines personal informatics and self-experimentation. The research frames rotating interventions as a way to discover what works for an individual, while warning that additional intervention burden can increase attrition.
- **Product implication:** A Focus Command feature should run no more than one small experiment at a time, make it entirely opt-in, and avoid interrupting normal mission use.

### Fresh-start timing

- **Source:** Dai, Milkman, and Riis, *The Fresh Start Effect: Temporal Landmarks Motivate Aspirational Behavior*, Management Science (2014), PMCID: PMC4839284 — https://pmc.ncbi.nlm.nih.gov/articles/PMC4839284/
- **Finding:** Across archival and field evidence, temporal landmarks can create a psychological separation from past imperfections and motivate aspirational behaviour.
- **Product implication:** Personal experiment cycles and recovery chapters can start at meaningful user-chosen landmarks (tomorrow, a new week, after an exam) without treating missed days as failure.

### Autonomous motivation

- **Source:** University of Rochester Medical Center, *Self-Determination Theory of Motivation* — https://www.urmc.rochester.edu/community-health/patient-care/self-determination-theory
- **Finding:** Self-determination theory emphasises autonomy, competence, and relatedness; the University summary notes that autonomously motivated people are more likely to sustain health goals over time.
- **Product implication:** The app must let the user choose the question, strategy, and trial duration. It can celebrate learning, including an inconclusive result, rather than pressure users toward a prescribed behaviour.

### Mastery evidence and self-efficacy

- **Source:** American Psychological Association, *Self-efficacy: The theory at the heart of human agency* — https://www.apa.org/research-practice/conduct-research/self-efficacy-human-agency
- **Finding:** Self-efficacy is the belief that one can organise and execute actions required for a goal. The APA review highlights the broad evidence connecting self-efficacy with behaviour and its maintenance; the foundational literature identifies direct mastery experiences as particularly influential evidence for capability beliefs.
- **Product implication:** Focus Command should not praise a generic trait such as “discipline.” It can instead show compact, truthful personal evidence: “Under this exact condition, you completed three similar returns.” This supports a user’s sense of capability without promising a causal outcome.

## Task aversion and initiation — newly reviewed sources

### Behavioural activation and avoidance

- **Source:** Mazzucchelli, Kane & Rees, *Behavioral activation interventions for well-being*, PMCID: PMC2882847 — https://pmc.ncbi.nlm.nih.gov/articles/PMC2882847/
- **Finding boundary:** Behavioural-activation work distinguishes approach from avoidance behaviour and uses awareness of avoidance patterns plus small, values-linked actions. It supports designing a non-clinical, user-chosen first-action mechanism; it does not support diagnosing a user or claiming therapeutic results from app usage.

### Future-self continuity and procrastination

- **Source:** Blouin-Hudon & Pychyl, *Experiencing the temporally extended self* — https://www.sciencedirect.com/science/article/abs/pii/S0191886915003840
- **Finding boundary:** The work links future-self continuity, affective states, and mental imagery with academic procrastination. It supports a brief, concrete future-benefit reminder that remains owned by the user; effects and causation for an individual cannot be assumed.

### Affect labelling as low-friction regulation

- **Source:** Burklund, Creswell, Irwin & Lieberman, *The common and distinct neural bases of affect labeling and reappraisal in healthy adults*, PMCID: PMC3970015 — https://pmc.ncbi.nlm.nih.gov/articles/PMC3970015/
- **Finding boundary:** In an fMRI study, both naming an affective response and reappraising an aversive stimulus were associated with reduced self-reported distress and similar decreases in amygdala activity. Labelling is a possible lightweight self-regulation action; this does not establish clinical benefit for a productivity application.
- **Product implication:** A resistance interaction can let a person name the immediate task feeling in a single neutral word or short phrase before any strategy is offered. The choice must be optional, non-diagnostic, and not converted into an emotional-health score.

### Distanced self-talk

- **Source:** Moser et al., *Third-person self-talk facilitates emotion regulation without engaging cognitive control*, PMCID: PMC5495792 — https://pmc.ncbi.nlm.nih.gov/articles/PMC5495792/
- **Finding boundary:** Across ERP and fMRI studies using aversive pictures and autobiographical memories, third-person name use was associated with lower self-referential emotional reactivity without increased markers of cognitive control. The result concerns controlled experimental tasks, not a guaranteed productivity intervention.
- **Product implication:** Focus Command can use a player-character or user-selected commander-name perspective to create brief psychological distance from resistance: the user gives their character one order, rather than being told to "be motivated." The tone must remain respectful and user-editable.

### Episodic future thinking and delayed reward salience

- **Source:** Guo et al., *Episodic future thinking predicts differences in delay discounting: The mediating role of hippocampal structure*, PMCID: PMC9596978 — https://pmc.ncbi.nlm.nih.gov/articles/PMC9596978/
- **Finding boundary:** In 106 college students, individual episodic-future-thinking ability was negatively associated with delay discounting; the paper discusses a broader body of work in which vividly imagined, personally relevant future events can make delayed outcomes more salient. The study is correlational for individual brain measures and cannot prove that a product feature will cause change.
- **Product implication:** If a feature invokes the future, it should use a user-authored, concrete near-future scene or earned in-app narrative consequence—not a generic claim that future rewards will solve current aversion.

### Identity-based motivation and the meaning of difficulty

- **Source:** Oyserman & Destin, *Identity-based motivation: Implications for intervention*, PMCID: PMC3079278 — https://pmc.ncbi.nlm.nih.gov/articles/PMC3079278/
- **Finding boundary:** The review frames identity-based motivation around action readiness, dynamic construction of identity in context, and interpretation of difficulty. It argues that when an action feels identity-congruent, difficulty can signify importance rather than impossibility; intervention evidence is largely educational and should not be overgeneralized.
- **Product implication:** The app can frame the felt difficulty of beginning as a temporary in-world obstacle confronting a chosen identity (such as learner, creator, or strategist), never as evidence that the user is weak, behind, or failing. A person must be able to choose, rename, or turn off this framing.

### Confirmed implications from full-text review

> “When action feels identity-congruent, experienced difficulty highlights that the behavior is important and meaningful.” — Oyserman & Destin [full text above]

> “Third-person self-talk facilitates emotional control without recruiting cognitive control.” — Moser et al. [full text above]

- **Synthesis constraint:** These results justify a brief role-based initiation encounter that permits psychological distance and reframes a difficult start. They do **not** justify a claim that the application changes brain activity, cures procrastination, or will work for every person.

### Action plans, mastery evidence, and autonomy

- **Source:** Wieber, Thürmer & Gollwitzer, *Promoting the translation of intentions into action by implementation intentions*, PMCID: PMC4500900 — https://pmc.ncbi.nlm.nih.gov/articles/PMC4500900/
- **Finding boundary:** Implementation intentions specify when, where, and how a goal-directed action will occur. The review attributes their effects to heightened accessibility of the specified cue and more automatic initiation of the linked response; they need a user-owned, feasible action.
- **Source:** Ryan & Deci, Self-Determination Theory — https://selfdeterminationtheory.org/theory/
- **Finding boundary:** The theory emphasises autonomy and competence support. It does not justify gamified coercion, punishments for skipped sessions, or a claim that one visual mechanic creates intrinsic motivation.
- **Product implication:** A compelling encounter should end with a user-chosen, concrete “countermove” tied to a personally meaningful cue, and it must be possible to decline, alter, or retire that countermeasure. Actual personal success records may be presented as evidence of past capability, never as pressure or an obligation.

### Approach–avoidance conflict

- **Source:** Garcia-Guerrero et al., *The action dynamics of approach-avoidance conflict during decision-making*, PMCID: PMC9773158 — https://pmc.ncbi.nlm.nih.gov/articles/PMC9773158/
- **Finding boundary:** The experiments describe conflict as competing motivations toward the benefits and away from the costs of a decision. They study controlled laboratory response trajectories, not productivity interventions or clinical treatment.
- **Product implication:** The start moment can be depicted honestly as a voluntary choice between approaching a valued mission and avoiding its immediate cost. The interaction should make the approach path visually clear and short, while never depicting a skipped start as failure.

### Confirmed Focus Command data boundary for initiation work

- The existing offline state already contains mission title, subject, category, difficulty, creation/start/completion timestamps, immutable completion records, post-session reflections, pre-session feeling, friction and provoking-thought fields, disruption categories/timestamps, progression awards, and revision activity.
- No future concept should infer a medical state, inspect other applications, record private content beyond the user’s explicit selection, add a server, or repurpose the protected completion cinematic.
