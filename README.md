# CS326 Project

## Team 10

| Name          | GitHub Username |
| ------------- | --------------- |
| Dat Quoc Pham | heoconngoc      |
| Jerry Chen    | Jerry605185     |

## Working Agreement

- Communication: We will communicate primarily through our Discord team chat for project-related discussions.
- Pull requests: All changes to `main` must be submitted through a pull request and approved by at least one teammate before merging.
- Definition of done: A PR is considered done when the changes are implemented, reviewed by at least one teammate, and all requested changes have been addressed.
- Disagreements: We will respectfully discuss disagreements together and make decisions based on the project requirements and technical reasoning.

## Project Domain

We will be working on developing a lost and found system that benefits those who lost their stuff. This will make the process of lost and found much more effective.

The application currently allows users to create, view, edit, and delete lost item reports. Users can provide details such as category, color, brand, location, and date lost. In future sprints, we plan to expand the system with features such as user authentication, ownership-based permissions, found item reports, and photo uploads.

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js 20.6.0 or later and npm — download from <https://nodejs.org/en/download>
- A MongoDB server that is running (a local install or Docker)

To verify that Node.js and npm are installed, run:

```bash
node --version
npm --version
```

### Clone this project

Run the following command inside your VScode or Command Prompt or Terminal at your desired folder:

```bash
git clone https://github.com/heoconngoc/cs326_project
cd cs326_project
```

### Install dependencies

Install the project dependencies with:

```bash
npm install
```

### Build the CSS

The pages are styled with Tailwind CSS. `src/input.css` is compiled into `public/css/tailwind.css`, which is generated and not committed. `npm start` builds it automatically, so no extra step is needed. To build it by hand, run:

```bash
npm run build:css
```

While editing the views, `npm run dev:css` rebuilds the CSS every time a file changes.

### Configure the environment

Create `.env` from the template:

```bash
cp .env.example .env
```

The template uses the dev container's MongoDB service:

```env
MONGODB_URI=mongodb://dev:devpassword@mongo:27017/devdb?authSource=admin
```

- **Inside the dev container:** keep `mongo` as the host.
- **Running outside the dev container:** use `localhost` instead of `mongo`.
- **MongoDB without authentication:** `mongodb://127.0.0.1:27017/devdb`.

`npm start` loads `.env` automatically. Do not commit `.env`.

### Start the server

Start the Express server with:

```bash
npm start
```

After running this command, the terminal prints:

```
MongoDB connected successfully
Listening on http://localhost:3000
```

### Open the website

| Page                              | URL                                  |
| --------------------------------- | ------------------------------------ |
| Home page                         | http://localhost:3000                |
| Lost items list                   | http://localhost:3000/lost-items     |
| Report a lost item                | http://localhost:3000/lost-items/new |
| Item details (view, edit, delete) | http://localhost:3000/lost-items/:id |

### Troubleshooting

If the server fails to start or MongoDB connection fails:

1. Verify that your MongoDB server is running.
2. Check that `MONGODB_URI` in `.env` matches your MongoDB host, port, database, and authentication settings.
3. If using authentication, verify the username, password, and `authSource`.
4. Restart the application with `npm start` after updating `.env`.

The application connects to MongoDB before starting the HTTP server, so a failed database connection prevents the website from becoming available.

To verify a successful setup, open the home page at `http://localhost:3000` and the lost-items page at `http://localhost:3000/lost-items`.

## Features

### Report a Lost Item

Someone who lost an item can report it through a browser form. The report is validated, saved to MongoDB, and then shown on the Lost Items List page.

1. Open http://localhost:3000/lost-items/new.
2. Fill in the form. Required fields are:
   - **title** (3–100 characters)
   - **description** (1–1000 characters)
   - **category** (1–50 characters)
   - **location** (1–150 characters)
   - **date lost** (a real date, not in the future)

   Optional fields are **color**, **brand**, and **contact info**.

3. Click **Submit**. The form is sent by HTMX (`hx-post`) as `POST /lost-items`.
   The page does not reload and the address bar does not change.
4. On success, the server saves the item to MongoDB and answers with an HTML
   fragment: a confirmation and the new item. HTMX swaps it into the area under
   the form, and the form is cleared. The item also appears at the top of
   `/lost-items`.
5. If validation fails, the server answers with `400` and a fragment containing
   the message. It appears under the form, what you typed stays in the fields,
   and nothing is saved.
6. `contact info` is stored for staff but is never returned by the public API. We are still thinking about how we should display the `contact info` regarding the personal privacy.

### View, Edit and Delete a Lost Item

Every card on the Lost Items list links to a details page for that report
(`/lost-items/:id`). The page shows the item, an edit form, and a delete button.

1. Click a card title or **View details**. The page loads the item with
   `GET /lost-items/:id`. An unknown id gives a `404` error page and a malformed
   id gives a `400` error page.
2. Open **Edit this report**. The form is filled with the saved values. Click
   **Save changes**. HTMX sends `PATCH /lost-items/:id` (`hx-patch`) and the page
   does not reload. On success the server answers with a fragment: a "saved"
   message plus the updated item card, which HTMX swaps over the card at the top
   of the page (`hx-swap-oob`). After a successful update, HTMX also replaces the edit form with the saved values so that the form and displayed item remain consistent. If validation fails, the server answers with
   `400` and the message appears under the card; nothing is saved.
3. Click **Delete**. The browser asks for confirmation (`hx-confirm`). If you
   accept, HTMX sends `DELETE /lost-items/:id` (`hx-delete`). On success the
   server sets the `HX-Redirect: /lost-items` header, so the browser goes back
   to the list where the item is gone. If the item was already deleted
   elsewhere, the page shows "Item not found" and stays put.
4. `contact info` and `status` are not editable here because the service rejects
   them on update, and `contact info` is never shown on the page.

Reporting, editing and deleting need a login. Only the person who reported an item (or an
admin) can edit or delete it; anyone else gets a 403 message. See
[Authorization](#authorization-who-can-change-what).

### Sign up, Log in and Log out

The header shows **Log in** and **Sign up** for guests, and the user's email and a
**Log out** button after login.

1. Open `/signup`, enter an email and a password (8-72 characters) and click **Sign up**.
   HTMX sends `POST /auth/signup` and the page shows "Your account was created" with a link
   to log in. Errors (invalid email, short password, email already registered) show under
   the form.
2. Open `/login`, enter the same email and password and click **Log in**. HTMX sends
   `POST /auth/login`. On success the server starts a session and sends an
   `HX-Redirect: /lost-items` header, so the next page already shows the user's email.
   Wrong credentials show "Invalid email or password" and nothing changes.
3. Click **Log out** in the header. HTMX sends `POST /auth/logout`, the session ends and
   the browser goes to the home page.
4. A logged-in user who opens `/login` or `/signup` is sent to the Lost Items list.

The auth endpoints keep the JSON described in `docs/sprint-4-contract.md` for every caller
except HTMX forms. When a request has the `HX-Request: true` header, the same endpoints
answer with an HTML fragment (or an `HX-Redirect` header) instead.

**Which mechanism, and why.** We use server-side sessions (`express-session`) with the
session stored in MongoDB (`connect-mongo`). The browser only holds a random session id in
the `cs326.sid` cookie, signed with `SESSION_SECRET` (`httpOnly`, `sameSite=lax`, `secure` in
production). Editing the cookie by hand breaks the signature, so the server treats the
request as logged out. We chose sessions over JWTs because logout really ends the session
(the server deletes it), nothing about the user (such as the role) is trusted from the
client, and the role is read from the database on every request. Passwords are never stored:
signup saves `bcrypt.hash(password, 10)` in `passwordHash` (not selected by default), and login
uses `bcrypt.compare`.

**Roles and the first admin.** `User.role` is `"user"` or `"admin"` and defaults to `"user"`.
Signup ignores any `role` in the request, so everyone who signs up is an ordinary user. There is
no admin signup. To make an admin, sign up normally, then promote that account in the database:

```bash
mongosh "$MONGODB_URI" --eval 'db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })'
```

Log out and log in again (or just reload) and the account is an admin.

### Authorization: who can change what

| Action | Guest | Logged-in user | Owner of the item | Admin |
| --- | --- | --- | --- | --- |
| View list and details | yes | yes | yes | yes |
| Report an item | login page (401 for API) | yes | yes | yes |
| Edit / delete an item | login page (401 for API) | **403** if not owner | yes | yes |

How it is built (route guard, then the rule in the service):

- `requireLogin` (`middleware/requireLogin.js`) is on the routes that create, edit or delete.
  A guest who opens a page is redirected to `/login`; an API or HTMX call gets a 401 and nothing
  happens.
- The service decides who may change what. `updateLostItem` and `deleteLostItem` in
  `services/lostItemsService.js` load the item, then call `isOwnerOrAdmin(user, item)`. If it
  is false they return `Err("Forbidden")`, which the controller turns into a 403, before the
  repository changes anything.
- The owner is set by the server: `createLostItem` stores `owner: currentUser.id` from the
  session and ignores any `owner` in the form or JSON.

**Try it with two accounts** (for the admin check, make an admin first, see above):

1. In a normal window sign up and log in as `alice@example.com`. Report an item.
2. In a private window sign up and log in as `bob@example.com`. Open Alice's item (from the
   list), open **Edit**, change the title and click **Save changes**. Result: a red message
   "You can only change or delete items you reported." (403). Click **Delete** and confirm.
   Same message. Reload: the item is unchanged.
3. Back as Alice: edit and delete work (200).
4. Log in as the admin: editing and deleting Alice's item works too.
5. Optional, from a terminal with Bob's cookie jar:
   `curl -i -b bob.txt -X DELETE http://localhost:3000/api/lost-items/<id>` returns
   `HTTP/1.1 403` with `{"success":false,"error":"Forbidden"}`.

The rule is also covered by Jest (`__tests__/lostItemsService.test.js`, section
"Authorization (owner or admin)") with the repository mocked: a non-owner gets `Forbidden`
and the repository is not called; the owner and an admin succeed.

### Health check

`GET /health` needs no login or cookie. It returns `200` with `Content-Type: application/json`:

```bash
curl -i http://localhost:3000/health
# HTTP/1.1 200 OK
# Content-Type: application/json; charset=utf-8
# {"status":"ok"}
```

### Accessibility

The full audit (method, every finding, known limits) is in
[docs/accessibility-audit.md](docs/accessibility-audit.md). What it found, what we fixed and
how to check each fix:

| Found | Fix | How to check |
| --- | --- | --- |
| No way to skip the navigation | "Skip to main content" link, first tab stop | Press Tab once on any page: the link appears and Enter jumps to the content |
| Focus fell to the top of the page after **Save changes** | The Save button has an `id`, so htmx puts focus back on it | Edit an item with the keyboard, press Enter on Save: the ring stays on Save |
| Focus was lost after a failed Delete (button was disabled during the request) | `hx-sync="this:drop"` replaces `hx-disabled-elt` on all forms | Delete an item that is already gone: focus stays on Delete, the error is read out |
| Focus went to the top after a successful delete | Delete redirects to `/lost-items?deleted=1`; the list shows a status message that takes focus | Delete an item you own: focus is on "The report was deleted."; Tab goes to the first item |
| Repeated "View details" links | `aria-label="View details for <title>"` | Tab through the list, or check the accessibility tree |
| Current page not announced | `aria-current="page"` in the nav | Inspect the active nav link |
| Hints not tied to inputs; unexplained red `*` | `aria-describedby`; `*` is `aria-hidden` and the form says "Fields marked * are required" | Inspect the input; run a screen reader |
| Placeholder text was about 2.6:1 | Darker placeholder (about 4.8:1) | Axe DevTools or a contrast checker on a form |
| Different focus rings on links, buttons, summaries | One focus style in `src/input.css` | Tab through any page: every stop has the same visible ring |

Already fine: every input has a real `<label>`, one `<h1>` per page, landmarks, `lang`, and
no horizontal scrolling at 320 px.

Contrast was measured on the rendered pages in Chromium (text and background colors read from
the page, hover included). Every row is at least 4.5:1: body text 7.3:1, nav links 7.6:1 (16:1 on
hover), the red buttons 10:1 (16:1 on hover), the Delete button 9.2:1 on hover. Repeat it with
the axe DevTools extension or any contrast checker.

Automated checks run in `npm test` (`__tests__/accessibility.test.js`, axe-core through jsdom).
Not done: testing with a screen reader.

## API Endpoints

| Method | Endpoint              | Description                                                            | Success                                      |
| ------ | --------------------- | ---------------------------------------------------------------------- | -------------------------------------------- |
| GET    | `/`                   | Home page                                                              | 200 HTML                                     |
| GET    | `/lost-items`         | Lost items list, newest first                                          | 200 HTML                                     |
| GET    | `/lost-items/new`     | Report-a-lost-item form                                                | 200 HTML                                     |
| POST   | `/lost-items`         | Form submit from HTMX; answers with an HTML fragment (no `<html>`)     | 201 or 400 HTML fragment                     |
| GET    | `/lost-items/:id`     | Item details page with edit form and delete button                     | 200 HTML (400 / 404 error page)              |
| PATCH  | `/lost-items/:id`     | Edit from HTMX (login + owner or admin); answers with a fragment      | 200 HTML fragment (400 / 401 / 403 / 404 error fragment) |
| DELETE | `/lost-items/:id`     | Delete from HTMX (login + owner or admin); sets `HX-Redirect: /lost-items?deleted=1` | 200 HTML fragment (400 / 401 / 403 / 404 error fragment) |
| GET    | `/login`              | Login page (redirects to `/lost-items` when already logged in)         | 200 HTML                                     |
| GET    | `/signup`             | Signup page (redirects to `/lost-items` when already logged in)        | 200 HTML                                     |
| POST   | `/auth/signup`        | Create an account. JSON by default; HTML fragment for HTMX forms       | 201 (400 / 409)                              |
| POST   | `/auth/login`         | Log in. JSON by default; `HX-Redirect` for HTMX forms                  | 200 (400 / 401)                              |
| POST   | `/auth/logout`        | Log out. JSON by default; `HX-Redirect: /` for HTMX forms              | 200                                          |
| GET    | `/auth/me`            | The logged-in user as JSON                                             | 200 (401)                                    |
| GET    | `/api/lost-items`     | List items as JSON, newest first                                       | 200 JSON                                     |
| POST   | `/api/lost-items`     | Create a lost item                                                     | 201 JSON                                     |
| GET    | `/api/lost-items/:id` | Get one item as JSON                                                   | 200 JSON (400 / 404)                         |
| PATCH  | `/api/lost-items/:id` | Update the editable fields (login + owner or admin)                    | 200 JSON (400 / 401 / 403 / 404)             |
| DELETE | `/api/lost-items/:id` | Delete an item (login + owner or admin)                                | 200 JSON (400 / 401 / 403 / 404)             |
| GET    | `/health`             | Health check, no login needed                                          | 200 JSON `{"status":"ok"}`                   |

Example POST request:

```bash
curl -X POST http://localhost:3000/api/lost-items \
  -H "Content-Type: application/json" \
  -d '{"title":"Lost Racket","description":"Near Franklin DC","category":"Sport","location":"Franklin DC","dateLost":"2026-10-12","color":"Black","brand":"Yonex"}'
```

## Tests

Run the Jest suite with:

```bash
npm test
```

- `__tests__/lostItemsService.test.js` — service rules; the repository is mocked with `jest.unstable_mockModule`.
- `__tests__/htmxFragments.test.js` — HTMX routes and HTML fragments for the report form.
- `__tests__/itemDetailsFragments.test.js` — details page, edit (`PATCH`) and delete (`DELETE`) fragments, error cases and the `HX-Redirect` header; the service is mocked.
- `__tests__/authPages.test.js` — login and signup pages, guest and logged-in navigation, and the fragments and `HX-Redirect` headers the auth endpoints send to HTMX forms; the services are mocked.
- `__tests__/accessibility.test.js` — runs axe-core (through jsdom) on every page and checks the skip link, labels, hints, link names, unique ids and focus handling.
- `__tests__/requireLoginPages.test.js` — guests are redirected (pages) or get a 401 (API and HTMX).
- No MongoDB is needed; all tests pass with the database environment unset.
- CI runs `npm test -- --ci` in `.github/workflows/test.yml`.

## System Diagram

The app uses a Routes → Controller → Service → Repository layering.

```
Browser (EJS pages, HTMX, JSON API)
  |
  | GET /lost-items, GET /lost-items/:id
  | POST /auth/signup, POST /auth/login, POST /auth/logout
  | POST /lost-items, PATCH /lost-items/:id, DELETE /lost-items/:id
  v
server.js
(connects to MongoDB and starts the app)
  |
  v
app.js
(Express app: session middleware from config/session.js,
GET /health, routers, error handler)
  |
  v
middleware/attachUser.js
(loads the logged-in user from the session)
  |
  +-------------------------------+
  |                               |
  v                               v
Authentication                 Lost Items
  |                               |
  v                               v
authRoutes.js                 lostItemsRoutes.js
authPagesRoutes.js           (requireLogin for
  |                           create/edit/delete)
  v                               |
authController.js                 v
authPagesController.js
  |                          lostItemsController.js
  v                               |
authService.js                    v
  |                          lostItemsService.js
  |                          (validation, owner/admin
  |                           permission checks)
  |                               |
  v                               |
usersRepository.js                |
  |                               v
  v                        lostItemsRepository.js
User model                        |
  |                               |
  |                               v
  |                         LostItem model
  |                               |
  +---------------+---------------+
                  |
                  v
                MongoDB
          (users, lostitems)
```


**Tests (Jest)**

We use Jest to test the main features without connecting to MongoDB.

- Service tests: Test lost item operations, validation, and
  authorization rules (owner, admin, and other users).
- Authentication tests: Test signup, login, logout, and sessions.
- Route and HTMX tests: Test API responses, HTML fragments,
  and error handling.
- Accessibility tests: Check that pages and forms meet basic
  accessibility requirements.

Run all tests with `npm test`.

- A page load (`GET /lost-items`) goes through the router, controller,
  service, and repository. The controller renders an EJS page.
- Signup and login go through the auth routes, controller, and service.
  After login, the session is used to identify the current user.
- For create, edit, and delete requests, `requireLogin` checks if the
  user is logged in. The service also checks ownership or admin
  permissions before allowing edits or deletes.
- HTMX requests return HTML fragments, while API requests return JSON.
- Errors are handled by `middleware/errorHandler.js`.

## Sprint 3: HTMX and Tailwind

**HTMX interaction: submitting the report form.** `views/lost-items/new.ejs` loads htmx (installed from npm and served at `/vendor/htmx/htmx.min.js`). The `<form>` has `hx-post="/lost-items"`, `hx-target="#form-feedback"` and `hx-swap`. The route answers with a fragment from `views/fragments/` (`form-success.ejs` or `form-error.ejs`), never a full page or JSON.

To check it:

1. Start the app, open http://localhost:3000/lost-items/new, and open the browser's Network tab.
2. Fill in the form and click **Submit**. One `POST /lost-items` request appears, the address bar stays the same, and only the area under the form changes.
3. From a terminal, ask for the fragment directly (this saves a real item):

```bash
curl -s -H 'HX-Request: true' \
  --data-urlencode 'title=Green umbrella' \
  --data-urlencode 'description=Left in room 101' \
  --data-urlencode 'category=Other' \
  --data-urlencode 'location=Library' \
  --data-urlencode 'dateLost=2026-10-12' \
  http://localhost:3000/lost-items
```

The output starts with a `<div role="status"` confirmation and has no `<html>`, `<head>` or `<body>`. Leave out `title` to see the `400` error fragment instead.

**More HTMX: edit and delete on the details page.** `views/lost-items/show.ejs` uses `hx-patch` for the edit form and `hx-delete` (with `hx-confirm`) for the delete button. The edit answer swaps the updated card into the page with `hx-swap-oob`, and the delete answer sends an `HX-Redirect` header. See "Feature: View, Edit and Delete a Lost Item". To check the fragments from a terminal (replace `<id>` with a real id from `/api/lost-items`):

```bash
curl -s -X PATCH -H 'HX-Request: true' \
  --data-urlencode 'title=Blue umbrella' \
  http://localhost:3000/lost-items/<id>

curl -s -i -X DELETE -H 'HX-Request: true' http://localhost:3000/lost-items/<id>
```

The first prints the "saved" fragment, the second shows the `HX-Redirect: /lost-items` header.

**Tailwind CSS.** Styles are utility classes in the EJS views. `src/input.css` is the Tailwind entry point and `npm run build:css` compiles it (see "Build the CSS"). To check the responsive layout, open the pages in the browser's device toolbar at 375 px and at 1280 px wide:

| Part            | 375 px (phone)                                       | 1280 px (desktop)                                         |
| --------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| Header          | Navigation sits under the logo                       | Logo and navigation on one row                            |
| Report form     | One column of fields; buttons stacked and full width | Centered card; Category/Date and Color/Brand side by side |
| Lost items list | One column of cards                                  | Three columns of cards                                    |

## Limitations

- The details page still shows **Edit** and **Delete** to every visitor. A person who is not the
  owner (or an admin) gets a clear 403 message when they try, but the buttons are not hidden yet.
- Items reported before ownership existed have no owner, so only an admin can change them.
- There is no CSRF token. `sameSite=lax` cookies reduce the risk, but a token would be safer.
- There is no password reset, email check or rate limiting on login.
- Not tested with a screen reader, and not tested against a real MongoDB in CI (the tests mock
  the repositories).

## Design Decisions

### Dat Quoc Pham (@heoconngoc):

**Sprint 2:**

One design decision I made in Sprint 2 was to create a `docs/sprint-2-contract.md` file before we began implementing the feature. This document defines the technology stack, data model, API endpoints, shared interfaces, error handling, and team responsibilities.

An alternative was to let each team member start coding independently and resolve interface differences during integration. Although this would have allowed us to start coding sooner, it could have introduced inconsistencies and required additional debugging and rework.

For example, we agreed that the dateLost field would use the YYYY-MM-DD format in API requests and responses, while the backend would store it as a Mongoose Date. Since Jerry was working on the frontend and I was implementing the backend validation and database layers, this agreement gave us a consistent data format to follow. Without it, the frontend might have sent a different date format than the backend expected, requiring us to change the form submission logic or validation code during integration.

Writing the contract took some additional time upfront, but it helped us coordinate our work, clarify responsibilities, and reduce the risk of integration issues.

**Sprint 3:**

One design decision I made in Sprint 3 was to test the service layer with Jest by mocking the repository using `jest.unstable_mockModule`, instead of connecting to a real MongoDB. The alternative was an integration test that starts a real MongoDB and exercises the repository and service together.

I chose the mocked repository because `npm test` must pass with no database running, the suite runs in under a second, and each service rule — required fields, invalid `_id`, not found, update/delete — can be triggered without seeding data.

The cost is that the mock can drift from real Mongoose behavior, for example around `findByIdAndUpdate` options. To cover that, I still checked the real repository manually against MongoDB: created an item through the API, restarted the server, fetched it by id, and deleted it. The integration-test alternative would catch that drift automatically, but it would add a database dependency to CI and make the suite slower.

**Sprint 4:**
For sprint 4, I decided to put the authorization checks in the service layer instead of the controllers. At first, I considered checking permissions in each controller, but our project has both API and HTMX routes. This means I would have to write similar checks in multiple places, and it would be easy to miss one.

I think it would be better to keep these checks in one place. The routes check if a user is logged in, and the service checks if they own the item or have the admin role before allowing them to modify or delete it. It made the test easier because I could test the service directly without running database.

On the other hand, the downside is I now have to pass the current user to the service from each controller, change all the test to match the new arguments. It takes more work, but I think it is worth it because the code is easier to maintain and the permission rules are consistent.

### Jerry Chen (@Jerry605185):

**Sprint 2:**

One design decision I made is that I chose to have the browser form send its data with fetch to POST /api/lost-items and show any error on the same page. The alternative was server-rendered form, which is post to a page route such as /lost-items, and on failure re-render new.ejs with the error message. I chose fetch because it can return 201 on success and a 400 with {success: false, error} on a validation failure. The alternative version would need a second POST route that repeats the controller's Ok/Err handling. It would also need to pass all eight field values back into the template after every error so the user's typing isn't lost. With fetch the page never reloads, so the typed values stay in place on their own. The error text starts with the field name, such as "location must be between 1 and 150 characters", so the script can highlight and focus that input. The cost is that the form needs JavaScript. With JavaScript off, it posts to the same endpoint and shows raw JSON instead of a friendly page. I accepted that because this project targets ordinary browsers and one tested endpoint is easier to keep correct than two.

**Sprint 3:**

One design decision I made in Sprint 3 was how the edit form on the item details page updates the screen after a save. PATCH /lost-items/:id returns a small HTML fragment: a "saved" message, plus the updated item card and the form fields as out-of-band swaps (hx-swap-oob). The alternative was to keep my Sprint 2 approach: send the form with fetch to PATCH /api/lost-items/:id, get JSON back, and write a script that rebuilds the card and refills the inputs. I chose fragments because the card is already drawn by one EJS partial, item-card.ejs, which the list page, the details page and the update response all share, so the markup and the HTML escaping live in one place. Returning the fields matters for this app because the service trims every text value before saving. If the form kept what the user typed, it could show " Blue umbrella " while the card shows "Blue umbrella". Dat's review caught this, and now the form always shows what was stored. The JSON version would have cost a second copy of the card markup in browser JavaScript, kept in sync by hand. That script would also have to escape user text itself, and one missed escape would be an XSS bug on a page that shows other people's reports. It would also need code to copy every returned field into the inputs. The cost of my choice is that the page routes and the JSON API need separate handlers (submitLostItemEdit and updateLostItemApi), and the fragments need their own tests. I accepted that because both handlers are short and call the same service.
