# Accessibility Audit (Issue #50)

Scope: the whole application, with a focus on keyboard access. Audited on the
Sprint 4 code after the login and signup pages were added (Issue #49).

## How the audit was done

| Method | What it covers |
|---|---|
| Keyboard walk in Chromium (Playwright) | Tab / Shift+Tab / Enter / Space through every page; which element is focused after each HTMX action |
| axe-core 4 in Chromium | WCAG 2.0/2.1 A and AA rules plus best practices, including color contrast, at 1280 px and 375 px |
| 320 px and 200% text size | Reflow (no horizontal scrolling) on every page |
| axe-core in Jest (jsdom) | The same rules without a browser, on every page, run by `npm test` (see `__tests__/accessibility.test.js`) |

Pages audited: home, Lost Items list (with items and empty), report form, item
details with the edit form, login, signup, the 404 page, and the header for a
guest and for a logged-in user.

Not done: testing with a screen reader (NVDA, JAWS or VoiceOver). The fixes
below follow standard patterns for screen readers, but they were not listened to.

## Findings

### Fixed

| # | Problem | WCAG | Found by | Fix |
|---|---|---|---|---|
| 1 | After **Save changes**, keyboard focus dropped to the top of the page. The server swapped the whole edit form, which destroyed the focused button. | 2.4.3 Focus Order | Keyboard walk | The Save button has an id (`edit-save`) in one shared form partial, so htmx puts focus back on it. |
| 2 | After a **failed Delete** (for example the item was already deleted), focus dropped to the top of the page, because the button was disabled while the request ran. | 2.4.3 Focus Order | Keyboard walk | Forms and the Delete button no longer use `hx-disabled-elt`. They use `hx-sync="this:drop"`, which still stops double submits (no duplicate reports) and keeps focus. The same change was made on the report, login and signup forms. |
| 3 | No way to skip the navigation. Every page started with 3 or more links before the content. | 2.4.1 Bypass Blocks (best practice) | Keyboard walk | "Skip to main content" link: first tab stop, visible only when focused, jumps to `<main id="main">`. |
| 4 | Every card had two links named alike ("View details" repeated for each item). Read out of context, they don't say which item. | 2.4.4 Link Purpose | Keyboard walk | `aria-label="View details for <title>"` (it starts with the visible text, so it still matches 2.5.3). |
| 5 | The navigation did not say which page is current. | 1.3.1 / best practice | Review | `aria-current="page"` on the matching link. |
| 6 | Hints such as "3–100 characters" were not tied to their inputs. | 1.3.1, 3.3.2 | Review | `aria-describedby` on the field points at the hint. |
| 7 | The red `*` for required fields was read as "star" and never explained. | 3.3.2 Labels or Instructions | Review | The `*` is `aria-hidden`; the forms say "Fields marked * are required"; inputs keep the `required` attribute, which screen readers announce. |
| 8 | Placeholder text (about 2.6:1 contrast on white) was hard to read. | 1.4.3 (placeholders are not covered by axe, so this was found by review) | Calculation | Placeholder color changed to a darker gray (about 4.8:1). |
| 9 | Focus rings differed between element types. | 2.4.7 Focus Visible (it already passed) | Keyboard walk | One focus style for links, buttons and summaries (`src/input.css`). Inputs keep their own ring. |

### Already fine (no change needed)

- Every form field has a visible `<label>`.
- `<html lang="en">`, a unique `<title>` and exactly one `<h1>` on every page.
- Landmarks: header, labelled nav, main, footer.
- Every page passed axe with no violations at both sizes, including color contrast.
- Every page works at 320 px wide and at 200% text size without horizontal scrolling.
- The edit section uses a native `<details>`, and Delete confirms with the browser's own dialog. Both work with the keyboard.
- Status and error messages are announced (`role="status"` / `role="alert"` inside an `aria-live` area).
- The page does not block zooming.

### Known limits (not fixed here)

- **Native date input:** the browser's own date field takes several Tab presses (month, day, year). That is browser behavior.
- **Delete confirmation:** it uses `window.confirm`. It is keyboard accessible, but it cannot be styled.
- **Focus after a successful create or signup:** focus stays in the form and the success message is announced by the live region. If the team wants focus moved to the message, that is a one-line change.
- **Edit and Delete for guests:** the details page still shows them to everyone. When the authorization branch merges, hide them for people who are not the owner or an admin, and make the 401 and 403 messages offer a "Log in" link.
- **No CSRF protection:** `sameSite: lax` cookies help, but this is not an accessibility item. It is worth a look in Sprint 4.

## How to repeat the audit

1. Run `npm test`. The automated checks live in `__tests__/accessibility.test.js` and
   `__tests__/authPages.test.js`.
2. For a manual keyboard check, start the app, put the mouse aside, and on each page
   press Tab from the top. You should see: the skip link first, a visible focus ring
   on every stop, and an order that follows the visual order.
3. Report a lost item with the keyboard only, open its details, edit it, then delete
   it. Focus should never fall back to the top of the page.
4. Sign up, log in and log out with the keyboard only.
5. In the browser dev tools, run axe (the free axe DevTools extension) on each page to
   re-check color contrast, which jsdom cannot measure.
