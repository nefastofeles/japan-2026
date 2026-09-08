/**
 * Shared Quest progress across family phones.
 *
 * Authored missions stay in git JSON. This module only moves mutable
 * state: completions, discoveries, badges, short memories.
 *
 * Until Supabase is configured — or until the quest_* tables exist —
 * every write stays on this phone. The journal tables are never touched.
 */

import { getClient } from "../supabase.js";
import { isConfigured } from "../config.js";
import { loadState, saveState } from "./state.js";

export const QUEST_TRIP_ID = "japan-2026";

function emptyRemote() {
  return {
    completed: {},
    discovered: {},
    badges: [],
    memories: [],
    answers: {},
  };
}

function recordFromLocal(state, missionId) {
  return state.completed[missionId] || null;
}

/** First write wins so a slower phone cannot wipe Saga’s completion. */
function pickEarlier(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (!a.at) return b;
  if (!b.at) return a;
  return a.at <= b.at ? a : b;
}

export function mergeQuestState(local, remote) {
  const completed = { ...remote.completed };
  for (const [id, record] of Object.entries(local.completed || {})) {
    completed[id] = pickEarlier(completed[id], record);
  }

  const discoveredSet = new Set([
    ...Object.keys(remote.discovered || {}),
    ...(Array.isArray(local.discovered) ? local.discovered : Object.keys(local.discovered || {})),
  ]);

  const badges = [...new Set([...(remote.badges || []), ...(local.badges || [])])];
  const answers = { ...(remote.answers || {}), ...(local.answers || {}) };

  const memories = [];
  const seen = new Set();
  for (const memory of [...(remote.memories || []), ...(local.memories || [])]) {
    const key = `${memory.missionId || memory.discoveryId || ""}:${memory.date}:${memory.summary}`;
    if (seen.has(key)) continue;
    seen.add(key);
    memories.push(memory);
  }

  return {
    ...local,
    completed,
    discovered: [...discoveredSet],
    badges,
    answers,
    memories,
  };
}

function rowsToRemote(progressRows, memoryRows, badgeRows) {
  const remote = emptyRemote();
  for (const row of progressRows || []) {
    if (row.kind === "mission") {
      remote.completed[row.item_id] = {
        at: row.completed_at,
        date: row.completed_at?.slice(0, 10),
        participants: row.participants || [],
        completedBy: row.completed_by || "",
        answer: row.answer || "",
        summary: row.summary || row.item_id,
      };
      if (row.answer) remote.answers[row.item_id] = row.answer;
    }
    if (row.kind === "discovery") {
      remote.discovered[row.item_id] = {
        at: row.completed_at,
        by: row.completed_by || "",
      };
    }
  }
  for (const row of badgeRows || []) {
    if (row.badge_id) remote.badges.push(row.badge_id);
  }
  for (const row of memoryRows || []) {
    remote.memories.push({
      date: row.date,
      missionId: row.mission_id || "",
      discoveryId: row.discovery_id || "",
      summary: row.summary || "",
      participants: row.participants || [],
      answer: row.response || "",
      location: "",
    });
  }
  return remote;
}

async function readRemote(supabase) {
  const trip = QUEST_TRIP_ID;
  const [progress, memories, badges] = await Promise.all([
    supabase.from("quest_progress").select("*").eq("trip_id", trip),
    supabase.from("quest_memories").select("*").eq("trip_id", trip),
    supabase.from("quest_badges").select("*").eq("trip_id", trip),
  ]);
  if (progress.error || memories.error || badges.error) return null;
  return rowsToRemote(progress.data, memories.data, badges.data);
}

/**
 * Pull family progress if the backend is ready. Missing tables or a
 * blank config are normal; we keep localStorage and do not throw.
 */
export async function pullQuestState() {
  if (!isConfigured()) return null;
  try {
    const supabase = await getClient();
    if (!supabase) return null;
    return await readRemote(supabase);
  } catch (error) {
    console.warn("Quest sync pull skipped:", error.message);
    return null;
  }
}

export async function hydrateQuestState() {
  const local = loadState();
  const remote = await pullQuestState();
  if (!remote) return local;
  const merged = mergeQuestState(local, remote);
  queueQuestSync(merged);
  return merged;
}

function progressRow(state, kind, itemId) {
  const trip = QUEST_TRIP_ID;
  if (kind === "mission") {
    const record = recordFromLocal(state, itemId);
    if (!record) return null;
    return {
      trip_id: trip,
      kind,
      item_id: itemId,
      completed_at: record.at || new Date().toISOString(),
      completed_by: record.completedBy || (record.participants || [])[0] || null,
      answer: record.answer || "",
      participants: record.participants || [],
      summary: record.summary || itemId,
    };
  }
  return {
    trip_id: trip,
    kind: "discovery",
    item_id: itemId,
    completed_at: new Date().toISOString(),
    completed_by: null,
    answer: "",
    participants: [],
    summary: itemId,
  };
}

async function pushState(state) {
  if (!isConfigured()) return false;
  const supabase = await getClient();
  if (!supabase) return false;

  const missionRows = Object.keys(state.completed || {})
    .map((id) => progressRow(state, "mission", id))
    .filter(Boolean);
  const discoveryRows = (state.discovered || []).map((id) =>
    progressRow(state, "discovery", id)
  );
  const badgeRows = (state.badges || []).map((badgeId) => ({
    trip_id: QUEST_TRIP_ID,
    badge_id: badgeId,
    earned_at: new Date().toISOString(),
  }));
  const memoryRows = (state.memories || []).map((memory) => ({
    trip_id: QUEST_TRIP_ID,
    client_key: `${QUEST_TRIP_ID}:${memory.missionId || memory.discoveryId || "note"}:${memory.date}:${memory.summary}`,
    date: memory.date,
    mission_id: memory.missionId || null,
    discovery_id: memory.discoveryId || null,
    summary: memory.summary || "",
    participants: memory.participants || [],
    response: memory.answer || memory.interestingMoment || "",
  }));

  const writes = [];
  if (missionRows.length || discoveryRows.length) {
    writes.push(
      supabase.from("quest_progress").upsert([...missionRows, ...discoveryRows], {
        onConflict: "trip_id,kind,item_id",
      })
    );
  }
  if (badgeRows.length) {
    writes.push(
      supabase.from("quest_badges").upsert(badgeRows, { onConflict: "trip_id,badge_id" })
    );
  }
  if (memoryRows.length) {
    writes.push(
      supabase.from("quest_memories").upsert(memoryRows, { onConflict: "client_key" })
    );
  }
  const results = await Promise.all(writes);
  return results.every((result) => !result.error);
}

/** Save locally first. Remote is best-effort and must never block a mission. */
export function queueQuestSync(state) {
  saveState(state);
  pushState(state).catch((error) => {
    console.warn("Quest sync push skipped:", error.message);
  });
  return state;
}
