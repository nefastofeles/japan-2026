/**
 * Facilitator wipe of family Quest progress.
 *
 * Local first. Shared rows are cleared only when a signed-in
 * facilitator (app_admins / is_admin) is allowed to DELETE them.
 * Other phones drop their copies on the next hydrate when they
 * see a higher generation. Anonymous and ordinary family sessions
 * cannot wipe the shared tables.
 */

import { getAuthedClient } from "../supabase.js";
import { emptyQuestState, loadState, saveState } from "./state.js";
import { QUEST_TRIP_ID } from "./sync.js";

export async function resetQuestState() {
  const next = emptyQuestState();
  next.generation = (loadState().generation || 0) + 1;
  saveState(next);

  const supabase = await getAuthedClient();
  if (!supabase) return next;

  try {
    const trip = QUEST_TRIP_ID;
    const deleted = await Promise.all([
      supabase.from("quest_progress").delete().eq("trip_id", trip),
      supabase.from("quest_memories").delete().eq("trip_id", trip),
      supabase.from("quest_badges").delete().eq("trip_id", trip),
    ]);
    const failed = deleted.find((result) => result.error);
    if (failed) {
      console.warn("Quest shared reset skipped:", failed.error.message);
      return next;
    }
    const { error } = await supabase.from("quest_control").upsert({
      trip_id: trip,
      reset_generation: next.generation,
      activated_modules: [],
      answers: {},
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn("Quest shared reset skipped:", error.message);
  } catch (error) {
    console.warn("Quest reset remote skipped:", error.message);
  }
  return next;
}
