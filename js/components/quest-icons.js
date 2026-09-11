/**
 * Small original Quest icons. Stroke on 24×24, currentColor.
 * Emoji stays as a last-resort fallback in CSS, not the main system.
 */

const MARKS = {
  quest: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  story: '<path d="M5 5h6a3 3 0 0 1 3 3v11H8a3 3 0 0 0-3 3V5z"/><path d="M13 8h6v14a3 3 0 0 0-3-3h-3"/>',
  riddle: '<path d="M12 3l8 5v8l-8 5-8-5V8z"/><circle cx="12" cy="12" r="1.4"/>',
  observation: '<path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.4"/>',
  photo: '<rect x="4" y="7" width="16" height="12" rx="2"/><circle cx="12" cy="13" r="3"/><path d="M8 7l1.4-2h5.2L16 7"/>',
  food: '<path d="M5 11h14v2a7 7 0 0 1-14 0v-2z"/><path d="M8 7v4M12 5v6M16 7v4"/>',
  discovery: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  history: '<path d="M6 20V8h12v12"/><path d="M4 8h16"/><path d="M8 8V5h8v3"/>',
  mythology: '<path d="M12 4c3 3 5 6 5 9a5 5 0 0 1-10 0c0-3 2-6 5-9z"/><path d="M9 20h6"/>',
  location: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.2"/>',
  listen: '<path d="M4 10v4h3l5 4V6L7 10H4z"/><path d="M16 9a3.2 3.2 0 0 1 0 6"/>',
  fragment: '<path d="M12 3l7 9-7 9-7-9 7-9z"/>',
  xp: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  badge: '<rect x="5" y="5" width="14" height="14" rx="3"/><path d="M8 12h8"/>',
  locked: '<rect x="6" y="11" width="12" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  completed: '<circle cx="12" cy="12" r="8"/><path d="M8 12.2l2.6 2.6L16.4 9"/>',
  choose: '<path d="M8 7h11M8 12h11M8 17h11"/><circle cx="4.5" cy="7" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="17" r="1"/>',
  memory: '<circle cx="12" cy="12" r="7"/><path d="M12 8v5"/>',
};

const TYPE_TO_ICON = {
  find: "location",
  photo: "photo",
  observe: "observation",
  observation: "observation",
  solve: "riddle",
  riddle: "riddle",
  multipleChoice: "choose",
  trueFalse: "choose",
  food: "food",
  story: "story",
  reflection: "story",
  discovery: "discovery",
  memory: "memory",
};

function svg(name) {
  const inner = MARKS[name] || MARKS.quest;
  return `<svg class="quest-icon__svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

export function iconNameForType(type) {
  return TYPE_TO_ICON[type] || "quest";
}

export function questIcon(name) {
  return `<span class="quest-icon quest-icon--${name}">${svg(name)}</span>`;
}

export function typeIcon(type) {
  return questIcon(iconNameForType(type));
}
