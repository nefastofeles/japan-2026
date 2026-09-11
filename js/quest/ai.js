/**
 * Later: photo remarks, character talk, daily briefing, recap.
 *
 * Live models must never replace authored history. These return null
 * until something is plugged in. The mission engine ignores them.
 */

export async function remarkOnPhoto(_mission, _photo) {
  return null;
}

export async function characterLine(_mission, _answer) {
  return null;
}

export async function dailyBriefing(_chapter, _state) {
  return null;
}

export async function recapPass(_memories) {
  return null;
}
