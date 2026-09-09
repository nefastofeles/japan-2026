/**
 * Facilitator wipe of family Quest progress.
 *
 * Local first, then shared tables. Other phones drop their copies on
 * the next hydrate when they see a higher generation.
 */

import { getClient } from "../supabase.js";
import { isConfigured } from "../config.js";
import { emptyQuestState, loadState, saveState } from "./state.js";
import { QUEST_TRIP_ID } from "./sync.js";

export async function resetQuestState() {
  const next = emptyQuestState();
  next.generation = (loadState().generation || 0) + 1;
  saveState(next);
  if (!isConfigured()) return next;
  try {
    const supabase = await getClient();
    if (!supabase) return next;
    const trip = QUEST_TRIP_ID;
    await Promise.all([
      supabase.from("quest_progress").delete().eq("trip_id", trip),
      supabase.from("quest_memories").delete().eq("trip_id", trip),
      supabase.from("quest_badges").delete().eq("trip_id", trip),
    ]);
    await supabase.from("quest_control").upsert({
      trip_id: trip,
      reset_generation: next.generation,
      activated_modules: [],
      answers: {},
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn("Quest reset remote skipped:", error.message);
  }
  return next;
}
