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

Edit and delete are open to every visitor. There is no login or owner check yet.

## API Endpoints

| Method | Endpoint              | Description                                                            | Success                                      |
| ------ | --------------------- | ---------------------------------------------------------------------- | -------------------------------------------- |
| GET    | `/`                   | Home page                                                              | 200 HTML                                     |
| GET    | `/lost-items`         | Lost items list, newest first                                          | 200 HTML                                     |
| GET    | `/lost-items/new`     | Report-a-lost-item form                                                | 200 HTML                                     |
| POST   | `/lost-items`         | Form submit from HTMX; answers with an HTML fragment (no `<html>`)     | 201 or 400 HTML fragment                     |
| GET    | `/lost-items/:id`     | Item details page with edit form and delete button                     | 200 HTML (400 / 404 error page)              |
| PATCH  | `/lost-items/:id`     | Edit from HTMX; answers with a fragment (saved message + updated card) | 200 HTML fragment (400 / 404 error fragment) |
| DELETE | `/lost-items/:id`     | Delete from HTMX; sets `HX-Redirect: /lost-items`                      | 200 HTML fragment (400 / 404 error fragment) |
| GET    | `/api/lost-items`     | List items as JSON, newest first                                       | 200 JSON                                     |
| POST   | `/api/lost-items`     | Create a lost item                                                     | 201 JSON                                     |
| GET    | `/api/lost-items/:id` | Get one item as JSON                                                   | 200 JSON (400 / 404)                         |
| PATCH  | `/api/lost-items/:id` | Update the editable fields                                             | 200 JSON (400 / 404)                         |
| DELETE | `/api/lost-items/:id` | Delete an item                                                         | 200 JSON (400 / 404)                         |

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
- No MongoDB is needed; all 117 tests pass with the database environment unset.
- CI runs `npm test -- --ci` in `.github/workflows/test.yml`.

## System Diagram

The app uses a Routes → Controller → Service → Repository layering.

```
Browser
  |
  | POST /lost-items, PATCH /lost-items/:id, DELETE /lost-items/:id
  | (sent by HTMX; an HTML fragment comes back)
  | GET /lost-items/:id (full details page)
  v
server.js
(connects with config/database.js, then starts the app)
  |
  v
app.js
(Express app: static files, JSON/urlencoded
parsing, mounts routers, 404 handler, and error-handling middleware)
  |
  |
  v
routes/lostItemsRoutes.js
(maps paths to controller functions, no logic)
  |
  |
  v
controllers/lostItemsController.js
(reads the request, calls the service, shapes the response)
  |
  |
  v
services/lostItemsService.js  <-- __tests__/lostItemsService.test.js (Jest)
(Validation and business rules for the feature)
(uses utils/validateLostItem.js and utils/result.js)
  |
  |
  v
repositories/lostItemsRepository.js
(the only layer that reads/writes storage; mocked in the service test)
  |
  |
  v
models/LostItem.js
  |
  |
  v
MongoDB
(collection: "lostitems")
```

**Tests (Jest)**

```text
__tests__/lostItemsService.test.js
  -> tests services/lostItemsService.js
  -> mocks repositories/lostItemsRepository.js
     using jest.unstable_mockModule

__tests__/htmxFragments.test.js
  -> tests POST /lost-items and HTML fragments
  -> mocks services/lostItemsService.js

__tests__/itemDetailsFragments.test.js
  -> tests GET, PATCH, DELETE /lost-items/:id
  -> tests validation errors and HTML fragments
  -> mocks services/lostItemsService.js
```

All tests can run without a MongoDB connection using `npm test`.

- A page load (e.g. `GET /lost-items`) flows
  `Browser → app.js → pageRouter → controller → service → repository → MongoDB`,
  then the controller renders an EJS view and returns HTML.
- A form submit flows `Browser (htmx) → app.js → pageRouter → controller →
service → repository → MongoDB`, and the controller renders a small EJS
  fragment from `views/fragments/` that htmx swaps into the page.
- The JSON API (`POST /api/lost-items`) takes the same path through `apiRouter`
  and the controller returns JSON instead.
- If any layer throws, the wrapped async handler forwards the error to the
  error-handling middleware in `middleware/errorHandler.js`.

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

The application currently does not support authentication or authorization. Users do not need to log in to create, view, edit, or delete lost item reports. As a result, any visitor can modify or delete reports created by other users.

This is a security limitation of the current implementation. We plan to address this in Sprint 4 by implementing authentication and authorization. Each lost item report will be associated with its owner, and only authorized users will be allowed to edit or delete their own reports.

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

### Jerry Chen (@Jerry605185):

**Sprint 2:**

One design decision I made is that I chose to have the browser form send its data with fetch to POST /api/lost-items and show any error on the same page. The alternative was server-rendered form, which is post to a page route such as /lost-items, and on failure re-render new.ejs with the error message. I chose fetch because it can return 201 on success and a 400 with {success: false, error} on a validation failure. The alternative version would need a second POST route that repeats the controller's Ok/Err handling. It would also need to pass all eight field values back into the template after every error so the user's typing isn't lost. With fetch the page never reloads, so the typed values stay in place on their own. The error text starts with the field name, such as "location must be between 1 and 150 characters", so the script can highlight and focus that input. The cost is that the form needs JavaScript. With JavaScript off, it posts to the same endpoint and shows raw JSON instead of a friendly page. I accepted that because this project targets ordinary browsers and one tested endpoint is easier to keep correct than two.

**Sprint 3:**

One design decision I made in Sprint 3 was how the edit form on the item details page updates the screen after a save. PATCH /lost-items/:id returns a small HTML fragment: a "saved" message, plus the updated item card and the form fields as out-of-band swaps (hx-swap-oob). The alternative was to keep my Sprint 2 approach: send the form with fetch to PATCH /api/lost-items/:id, get JSON back, and write a script that rebuilds the card and refills the inputs. I chose fragments because the card is already drawn by one EJS partial, item-card.ejs, which the list page, the details page and the update response all share, so the markup and the HTML escaping live in one place. Returning the fields matters for this app because the service trims every text value before saving. If the form kept what the user typed, it could show " Blue umbrella " while the card shows "Blue umbrella". Dat's review caught this, and now the form always shows what was stored. The JSON version would have cost a second copy of the card markup in browser JavaScript, kept in sync by hand. That script would also have to escape user text itself, and one missed escape would be an XSS bug on a page that shows other people's reports. It would also need code to copy every returned field into the inputs. The cost of my choice is that the page routes and the JSON API need separate handlers (submitLostItemEdit and updateLostItemApi), and the fragments need their own tests. I accepted that because both handlers are short and call the same service.
