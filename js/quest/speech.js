/**
 * Spoken Quest text.
 *
 * This file is the only place that talks to the browser voice. Mission
 * JSON never imports it, so a later TTS provider can replace this module
 * without rewriting content.
 *
 * Voices do not autoplay. A tap on Listen is required, which is also
 * what iOS needs before speechSynthesis will run.
 */

const DEFAULT_RATE = 0.9;
const SLOW_RATE = 0.75;

let preferredRate = DEFAULT_RATE;
let activeUtterance = null;
let lifecycleBound = false;

function synthesis() {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis || null;
}

export function speechAvailable() {
  return Boolean(synthesis() && typeof SpeechSynthesisUtterance === "function");
}

function pickEnglishVoice() {
  const voices = synthesis()?.getVoices?.() || [];
  const gb = voices.find((voice) => /^en-GB/i.test(voice.lang));
  if (gb) return gb;
  const ukName = voices.find((voice) => /british|uk english|daniel|serena/i.test(voice.name));
  if (ukName) return ukName;
  return voices.find((voice) => /^en(-|$)/i.test(voice.lang)) || null;
}

export function stopSpeech() {
  activeUtterance = null;
  const engine = synthesis();
  if (!engine) return;
  try {
    engine.cancel();
  } catch {
    /* some WebViews throw if nothing is speaking */
  }
}

export function pauseSpeech() {
  const engine = synthesis();
  if (!engine || !engine.speaking) return false;
  try {
    engine.pause();
    return true;
  } catch {
    return false;
  }
}

export function resumeSpeech() {
  const engine = synthesis();
  if (!engine) return false;
  try {
    engine.resume();
    return true;
  } catch {
    return false;
  }
}

export function isSpeechPaused() {
  return Boolean(synthesis()?.paused);
}

export function isSpeaking() {
  const engine = synthesis();
  return Boolean(engine && (engine.speaking || engine.pending));
}

export function setSpeechRate(rate) {
  preferredRate = rate;
}

export function speakText(text, { rate } = {}) {
  const engine = synthesis();
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!engine || !clean) return false;

  stopSpeech();

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = rate ?? preferredRate;
  utterance.lang = "en-GB";
  const voice = pickEnglishVoice();
  if (voice) utterance.voice = voice;
  utterance.onend = () => {
    if (activeUtterance === utterance) activeUtterance = null;
  };
  utterance.onerror = () => {
    if (activeUtterance === utterance) activeUtterance = null;
  };
  activeUtterance = utterance;

  // cancel() then speak() in the same tick is ignored on some iPhones.
  window.setTimeout(() => {
    if (activeUtterance !== utterance) return;
    engine.speak(utterance);
  }, 40);
  return true;
}

export function speakSlow(text) {
  setSpeechRate(SLOW_RATE);
  return speakText(text, { rate: SLOW_RATE });
}

export function speakNormal(text) {
  setSpeechRate(DEFAULT_RATE);
  return speakText(text, { rate: DEFAULT_RATE });
}

/** Stop speech when the family leaves the page or locks the phone. */
export function bindSpeechLifecycle() {
  if (lifecycleBound) return;
  lifecycleBound = true;
  window.addEventListener("hashchange", stopSpeech);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopSpeech();
  });
  const engine = synthesis();
  if (engine) engine.addEventListener("voiceschanged", () => pickEnglishVoice());
}
