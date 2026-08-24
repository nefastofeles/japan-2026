/* ==========================================================================
   A very small markdown renderer.
   --------------------------------------------------------------------------
   Deliberately tiny: paragraphs, line breaks, bold, italic, links and simple
   lists. Enough to write a day's story in, not enough to be a dependency.

   Everything is escaped BEFORE any formatting is applied, so nobody can put
   HTML into a post or a comment.
   ========================================================================== */

import { esc } from "../util.js";

function inline(text) {
  return esc(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>'
    );
}

export function markdown(source) {
  if (!source) return "";

  const blocks = String(source).trim().split(/\n{2,}/);

  return blocks
    .map((block) => {
      const lines = block.split("\n");

      if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
        const items = lines
          .map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ""))}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }

      if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
        const items = lines
          .map((l) => `<li>${inline(l.replace(/^\s*\d+\.\s+/, ""))}</li>`)
          .join("");
        return `<ol>${items}</ol>`;
      }

      const heading = block.match(/^(#{2,3})\s+(.*)$/);
      if (heading) {
        const level = heading[1].length;
        return `<h${level}>${inline(heading[2])}</h${level}>`;
      }

      if (/^>\s+/.test(block)) {
        return `<blockquote>${inline(block.replace(/^>\s+/gm, ""))}</blockquote>`;
      }

      return `<p>${lines.map(inline).join("<br>")}</p>`;
    })
    .join("\n");
}
