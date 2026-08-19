import type { ShadowGateResistanceState } from "./focus-command";

export interface ShadowGateDoorway {
  id: string;
  label: string;
}

export interface ShadowGateLibrarySection {
  state: ShadowGateResistanceState;
  title: string;
  prompt: string;
  actions: readonly ShadowGateDoorway[];
}

/**
 * Fixed, offline, research-informed initiation prompts. They are deliberately
 * short, neutral, and actionable; they are not generated, scored, or sent
 * anywhere. This module is evaluated once and then read as static data.
 */
export const SHADOW_GATE_LIBRARY: readonly ShadowGateLibrarySection[] = [
  {
    state: "too_big",
    title: "Too Big",
    prompt: "Shrink the first move until it fits in the next minute.",
    actions: [
      { id: "big_open_material", label: "Open the material only." },
      { id: "big_name_first_step", label: "Name the very first step." },
      { id: "big_one_minute", label: "Give it one quiet minute." },
      { id: "big_find_start_line", label: "Find the first starting line." },
      { id: "big_write_three_words", label: "Write any three useful words." },
      { id: "big_read_heading", label: "Read one heading, then stop." },
      { id: "big_mark_one_question", label: "Mark one question to begin." },
      { id: "big_put_tool_ready", label: "Put the needed tool in place." },
      { id: "big_clear_one_square", label: "Clear one small work space." },
      { id: "big_open_blank_note", label: "Open one blank note." },
      { id: "big_choose_one_page", label: "Choose one page only." },
      { id: "big_copy_task_title", label: "Copy the task title into a note." },
      { id: "big_list_three_parts", label: "List three tiny parts." },
      { id: "big_touch_first_item", label: "Touch the first item once." },
      { id: "big_start_ugly_outline", label: "Make an ugly one-line outline." },
      { id: "big_prepare_next_move", label: "Prepare the next physical move." },
      { id: "big_set_two_minute_timer", label: "Set a two-minute timer." },
      { id: "big_find_example", label: "Find one worked example." },
      { id: "big_circle_beginning", label: "Circle where you will begin." },
      { id: "big_read_first_sentence", label: "Read the first sentence aloud." },
      { id: "big_make_first_mark", label: "Make the first mark." },
    ],
  },
  {
    state: "blank_mind",
    title: "Blank Mind",
    prompt: "Borrow structure instead of waiting for a clear thought.",
    actions: [
      { id: "blank_open_previous", label: "Open the last thing you touched." },
      { id: "blank_copy_prompt", label: "Copy the prompt into a note." },
      { id: "blank_read_example", label: "Read one example without solving." },
      { id: "blank_write_question", label: "Write what the task is asking." },
      { id: "blank_list_known", label: "List one thing you already know." },
      { id: "blank_find_keyword", label: "Find one keyword in the material." },
      { id: "blank_repeat_instruction", label: "Read the instruction twice." },
      { id: "blank_make_three_guesses", label: "Write three rough guesses." },
      { id: "blank_start_with_date", label: "Write today’s date and begin." },
      { id: "blank_label_page", label: "Label a page with the task name." },
      { id: "blank_answer_easiest", label: "Answer the easiest visible part." },
      { id: "blank_retrace_last_step", label: "Retrace the last completed step." },
      { id: "blank_turn_to_contents", label: "Open the contents or index." },
      { id: "blank_write_bad_start", label: "Write a deliberately bad first line." },
      { id: "blank_sort_material", label: "Sort one item into keep or later." },
      { id: "blank_look_for_formula", label: "Look for the relevant formula." },
      { id: "blank_read_first_note", label: "Read the first note you see." },
      { id: "blank_choose_template", label: "Choose a familiar template." },
      { id: "blank_say_next_question", label: "Say the next question out loud." },
      { id: "blank_fill_one_label", label: "Fill in one label or heading." },
      { id: "blank_begin_with_copy", label: "Begin by copying one useful line." },
    ],
  },
  {
    state: "perfection_fog",
    title: "Perfection Fog",
    prompt: "Make a rough version that can exist before it improves.",
    actions: [
      { id: "perfect_rough_first", label: "Make a rough first version." },
      { id: "perfect_write_wrong_answer", label: "Write a possibly wrong answer." },
      { id: "perfect_use_placeholder", label: "Use a placeholder for the hard part." },
      { id: "perfect_make_messy_list", label: "Make a messy list of ideas." },
      { id: "perfect_limit_to_three", label: "Produce only three lines." },
      { id: "perfect_start_without_editing", label: "Start with editing turned off." },
      { id: "perfect_choose_good_enough", label: "Choose the good-enough option." },
      { id: "perfect_copy_and_change", label: "Copy a model and change one part." },
      { id: "perfect_leave_one_typo", label: "Leave one harmless typo for later." },
      { id: "perfect_draft_one_minute", label: "Draft for one minute, no judging." },
      { id: "perfect_mark_uncertain", label: "Mark uncertainty with a question mark." },
      { id: "perfect_write_headline", label: "Write only the headline first." },
      { id: "perfect_use_first_choice", label: "Use your first reasonable choice." },
      { id: "perfect_answer_in_bullets", label: "Answer in rough bullet points." },
      { id: "perfect_make_version_zero", label: "Call this Version Zero." },
      { id: "perfect_stop_after_start", label: "Stop after the first visible start." },
      { id: "perfect_try_low_stakes", label: "Try a low-stakes practice attempt." },
      { id: "perfect_write_private_draft", label: "Write a private draft no one sees." },
      { id: "perfect_use_simple_words", label: "Explain it in simple words." },
      { id: "perfect_choose_first_example", label: "Use the first workable example." },
      { id: "perfect_make_progress_not_polish", label: "Make progress, not polish." },
    ],
  },
  {
    state: "drained",
    title: "Drained",
    prompt: "Lower the energy cost before asking for more effort.",
    actions: [
      { id: "drained_sip_water", label: "Take one sip of water." },
      { id: "drained_sit_ready", label: "Sit in the work position." },
      { id: "drained_open_with_low_light", label: "Open it at a gentler brightness." },
      { id: "drained_read_for_sixty", label: "Read for sixty seconds only." },
      { id: "drained_choose_easiest", label: "Choose the easiest visible part." },
      { id: "drained_stretch_once", label: "Stretch once, then open the task." },
      { id: "drained_prepare_snack", label: "Prepare a small steadying snack." },
      { id: "drained_make_workspace_soft", label: "Make the work space a little easier." },
      { id: "drained_list_one_action", label: "List one action you can do seated." },
      { id: "drained_put_phone_away", label: "Put the phone one reach away." },
      { id: "drained_start_with_review", label: "Start by reviewing, not producing." },
      { id: "drained_open_timer", label: "Open a five-minute timer." },
      { id: "drained_take_one_breath", label: "Take one slower breath." },
      { id: "drained_set_material_out", label: "Set the material out in front of you." },
      { id: "drained_do_one_checkbox", label: "Do one checkbox-sized action." },
      { id: "drained_lower_standard", label: "Lower today’s standard to showing up." },
      { id: "drained_begin_quietly", label: "Begin quietly without a big commitment." },
      { id: "drained_read_notes", label: "Read your notes instead of making new ones." },
      { id: "drained_choose_short_piece", label: "Choose the shortest useful piece." },
      { id: "drained_make_first_click", label: "Make the first click only." },
      { id: "drained_start_in_comfort", label: "Start from the most comfortable position." },
    ],
  },
  {
    state: "discomfort",
    title: "Discomfort",
    prompt: "You do not need to feel ready to take one willing step.",
    actions: [
      { id: "discomfort_name_feeling", label: "Name the feeling without fixing it." },
      { id: "discomfort_open_alongside", label: "Open the task alongside the feeling." },
      { id: "discomfort_breathe_and_begin", label: "Take one breath, then begin." },
      { id: "discomfort_hold_pen", label: "Hold the pen or keyboard for ten seconds." },
      { id: "discomfort_write_willing", label: "Write: “I can do one small part.”" },
      { id: "discomfort_make_room", label: "Make room for discomfort and continue." },
      { id: "discomfort_read_without_solving", label: "Read the task without solving it." },
      { id: "discomfort_touch_material", label: "Touch the material and stay present." },
      { id: "discomfort_do_first_breath", label: "Let one breath be the starting signal." },
      { id: "discomfort_choose_tiny_exposure", label: "Choose the tiniest safe exposure." },
      { id: "discomfort_write_fear", label: "Write one fear in three words." },
      { id: "discomfort_return_to_body", label: "Feel both feet, then open the page." },
      { id: "discomfort_allow_imperfect", label: "Allow the first attempt to feel awkward." },
      { id: "discomfort_start_before_relief", label: "Start before relief arrives." },
      { id: "discomfort_say_one_step", label: "Say the one next step quietly." },
      { id: "discomfort_keep_company", label: "Keep the task company for one minute." },
      { id: "discomfort_make_contact", label: "Make one small contact with the work." },
      { id: "discomfort_notice_then_move", label: "Notice the urge to leave, then move once." },
      { id: "discomfort_choose_kind_start", label: "Choose a kind, non-punishing start." },
      { id: "discomfort_do_not_argue", label: "Do not argue with the feeling; begin small." },
      { id: "discomfort_one_willing_action", label: "Take one willing action now." },
    ],
  },
  {
    state: "tomorrow",
    title: "Tomorrow",
    prompt: "Make future work easier by giving today a visible beginning.",
    actions: [
      { id: "tomorrow_open_today", label: "Open it today, not to finish." },
      { id: "tomorrow_write_start_time", label: "Write the next start time." },
      { id: "tomorrow_prepare_first_page", label: "Prepare the first page for later." },
      { id: "tomorrow_leave_tab_open", label: "Leave the useful tab open." },
      { id: "tomorrow_make_first_mark", label: "Make one mark for tomorrow-you." },
      { id: "tomorrow_list_next_move", label: "List the exact next move." },
      { id: "tomorrow_open_and_close", label: "Open it once before closing it." },
      { id: "tomorrow_set_one_reminder", label: "Set one gentle reminder." },
      { id: "tomorrow_choose_start_place", label: "Choose where you will start." },
      { id: "tomorrow_place_material", label: "Place the material where you will see it." },
      { id: "tomorrow_write_reason", label: "Write one reason this matters." },
      { id: "tomorrow_break_delay", label: "Break the delay with one tiny action." },
      { id: "tomorrow_find_first_file", label: "Find the first file or page." },
      { id: "tomorrow_create_blank_doc", label: "Create the blank document now." },
      { id: "tomorrow_choose_first_problem", label: "Choose tomorrow’s first problem." },
      { id: "tomorrow_clear_start_path", label: "Clear one obstacle from the start path." },
      { id: "tomorrow_write_when_where", label: "Write when and where you will begin." },
      { id: "tomorrow_make_today_two_minutes", label: "Give it two minutes today." },
      { id: "tomorrow_leave_a_note", label: "Leave a kind note for tomorrow-you." },
      { id: "tomorrow_set_up_tool", label: "Set up the one tool you need." },
      { id: "tomorrow_begin_before_ready", label: "Begin before the perfect moment." },
    ],
  },
] as const;

export function getShadowGateSection(state: ShadowGateResistanceState): ShadowGateLibrarySection {
  const section = SHADOW_GATE_LIBRARY.find((candidate) => candidate.state === state);
  if (!section) throw new Error(`Unknown Shadow Gate state: ${state}`);
  return section;
}

export const SHADOW_GATE_LIBRARY_ACTION_COUNT = SHADOW_GATE_LIBRARY.reduce(
  (total, section) => total + section.actions.length,
  0,
);
