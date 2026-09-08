/**
 * Shared Quest chrome: inner tabs. The main site nav stays as it is.
 */

import { esc } from "../util.js";

const TABS = [
  ["/adventure", "Quest"],
  ["/adventure/map", "Journey"],
  ["/adventure/codex", "Codex"],
  ["/adventure/badges", "Badges"],
  ["/adventure/story", "Story"],
];

export function questTabs(activePath) {
  return `
    <nav class="quest-tabs" aria-label="Quest Game">
      ${TABS.map(([href, label]) => {
        const on =
          href === "/adventure"
            ? activePath === "/adventure"
            : activePath.startsWith(href);
        return `<a href="#${href}" ${on ? 'aria-current="page"' : ""}>${esc(label)}</a>`;
      }).join("")}
    </nav>`;
}

export function questShell(activePath, body) {
  return `
    <div class="page stack quest-page">
      <header class="quest-head">
        <p class="quest-kicker">Quest Game</p>
        <h1>The Missing Stories of Japan</h1>
      </header>
      ${questTabs(activePath)}
      ${body}
    </div>`;
}

export function peopleChecks(people, prefix = "who") {
  return people
    .map(
      (person) => `
      <label class="quest-who">
        <input type="checkbox" name="${esc(prefix)}" value="${esc(person.id)}"
               ${person.id === "javier" ? "" : "checked"}>
        <span>${esc(person.name)}</span>
      </label>`
    )
    .join("");
}

export function typeLabel(type) {
  const names = {
    find: "Find",
    photo: "Photo",
    observe: "Notice",
    solve: "Solve",
    food: "Food",
    story: "Story",
    reflection: "Sit with this",
  };
  return names[type] || type;
}
