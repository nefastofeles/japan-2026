/* ==========================================================================
   Sign in
   --------------------------------------------------------------------------
   Shown instead of every journal page until the gate login succeeds.
   Kept out of admin-forms.js so the lock screen does not load the itinerary.
   ========================================================================== */

import { signIn } from "../auth.js";
import { esc } from "../util.js";

export function loginForm(message = "") {
  return `
    <div class="page">
      <form class="login stack" data-login>
        <h1>Sign in</h1>
        <p>This journal is private. Nothing inside is shown until you sign in.</p>
        <div>
          <label for="user">Username</label>
          <input class="field" id="user" name="user" type="text" required
                 autocomplete="username" autocapitalize="off" spellcheck="false">
        </div>
        <div>
          <label for="password">Password</label>
          <input class="field" id="password" name="password" type="password" required
                 autocomplete="current-password">
        </div>
        <button class="btn" type="submit">Sign in</button>
        <p data-login-status role="status">${esc(message)}</p>
      </form>
    </div>`;
}

export function loginPage(message = "") {
  return { html: loginForm(message), mount: bindLogin };
}

export function bindLogin(root) {
  const form = root.querySelector("[data-login]");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = form.querySelector("[data-login-status]");
    status.textContent = "Signing in…";
    try {
      await signIn(form.elements.user.value, form.elements.password.value);
      location.reload();
    } catch (error) {
      status.textContent = error.message;
    }
  });
}
