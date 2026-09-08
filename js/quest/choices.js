/**
 * Multiple-choice and true/false. Same tap engine, large cards.
 * Wrong answers are information, not a scolding.
 */

import { esc } from "../util.js";

export function isChoiceMission(mission) {
  return Boolean(mission?.question?.choices?.length);
}

export function questionHtml(question) {
  if (!question?.choices?.length) return "";
  return `
    <p class="quest-label">${esc(question.text)}</p>
    <div class="quest-choices" data-question role="group" aria-label="${esc(question.text)}">
      ${question.choices
        .map(
          (choice) => `
        <button type="button" class="quest-choice" data-choice-id="${esc(choice.id)}">
          ${esc(choice.text)}
        </button>`
        )
        .join("")}
    </div>
    <p class="quest-prose" data-choice-feedback hidden role="status"></p>
    <input type="hidden" data-answer data-choice-answer value="">`;
}

export function gradeChoice(question, choiceId) {
  const choice = (question.choices || []).find((item) => item.id === choiceId);
  if (!choice) return { correct: false, response: "", retry: true, choice: null };
  const needsKey = Boolean(question.correctChoiceId);
  const correct = !needsKey || question.correctChoiceId === choiceId;
  return {
    choice,
    correct,
    response: choice.response || "",
    retry: question.retryAllowed !== false,
  };
}
