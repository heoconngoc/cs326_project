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

We will be working on developing a lost and found system that benefits those who lost their stuff. This will make the process of lost and found much more effective. People lost their stuff won't need to go the actual lost and found office. Instead, they can just check online if their stuff has been found or not.In addition, the system will allow users to post detailed descriptions of lost items and upload photos, while finders can record found items with information such as category, color, brand, location, and date.

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

The server reads `PORT` and `MONGODB_URI` from the environment. Create a `.env` file from the template `.env.example`:

```bash
cp .env.example .env
```

Update `MONGODB_URI` in `.env` to match your MongoDB setup:

**Local MongoDB without authentication:**
```env
MONGODB_URI=mongodb://127.0.0.1:27017/devdb
```

**Local MongoDB with authentication:**
```env
MONGODB_URI=mongodb://username:password@127.0.0.1:27017/devdb?authSource=admin
```

Replace `username` and `password` with your actual credentials. The `.env.example` template assumes an authenticated MongoDB instance, so developers using MongoDB without authentication must update the URI.

The `npm start` script automatically loads `.env` using Node's `--env-file` flag in `package.json`. Keep `.env` uncommitted because it may contain sensitive credentials. The `.gitignore` file already excludes .env from version control.

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

| Page               | URL                                  |
| ------------------ | ------------------------------------ |
| Home page          | http://localhost:3000                |
| Lost items list    | http://localhost:3000/lost-items     |
| Report a lost item | http://localhost:3000/lost-items/new |

### Troubleshooting

If the server fails to start or MongoDB connection fails:

1. Verify that your MongoDB server is running.
2. Check that `MONGODB_URI` in `.env` matches your MongoDB host, port, database, and authentication settings.
3. If using authentication, verify the username, password, and `authSource`.
4. Restart the application with `npm start` after updating `.env`.

The application connects to MongoDB before starting the HTTP server, so a failed database connection prevents the website from becoming available.

To verify a successful setup, open the home page at `http://localhost:3000` and the lost-items page at `http://localhost:3000/lost-items`.

## Feature: Report a Lost Item

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

## API Endpoints

| Method | Endpoint          | Description                      | Success  |
| ------ | ----------------- | -------------------------------- | -------- |
| GET    | `/`               | Home page                        | 200 HTML |
| GET    | `/lost-items`     | Lost items list, newest first    | 200 HTML |
| GET    | `/lost-items/new` | Report-a-lost-item form          | 200 HTML |
| POST   | `/lost-items`     | Form submit from HTMX; answers with an HTML fragment (no `<html>`) | 201 or 400 HTML fragment |
| GET    | `/api/lost-items` | List items as JSON, newest first | 200 JSON |
| POST   | `/api/lost-items` | Create a lost item               | 201 JSON |

Example POST request:

```bash
curl -X POST http://localhost:3000/api/lost-items \
  -H "Content-Type: application/json" \
  -d '{"title":"Lost Racket","description":"Near Franklin DC","category":"Sport","location":"Franklin DC","dateLost":"2026-10-12","color":"Black","brand":"Yonex"}'
```

## System Diagram

The app uses a Routes → Controller → Service → Repository layering.

```
Browser
  |
  | POST /lost-items (form submit by HTMX; HTML fragment comes back)
  v
app.js
(Express app: static files, JSON/urlencoded
parsing, mounts routers, 404 handler, and error-handling middleware)
  |
  |
  v
routes/lostItemsRoutes.js
(maps paths to controller functions, no logic))
  |
  |
  v
controllers/lostItemsController.js
(reads the request, calls the service, shapes the response)
  |
  |
  v
services/lostItemsService.js
(Validation and business rules for the feature)
(uses utils/validateLostItem.js and utils/result.js)
  |
  |
  v
repositories/lostItemsRepository.js
(the only layer that reads/writes storage)
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

**Tailwind CSS.** Styles are utility classes in the EJS views. `src/input.css` is the Tailwind entry point and `npm run build:css` compiles it (see "Build the CSS"). To check the responsive layout, open the pages in the browser's device toolbar at 375 px and at 1280 px wide:

| Part | 375 px (phone) | 1280 px (desktop) |
| ---- | -------------- | ----------------- |
| Header | Navigation sits under the logo | Logo and navigation on one row |
| Report form | One column of fields; buttons stacked and full width | Centered card; Category/Date and Color/Brand side by side |
| Lost items list | One column of cards | Three columns of cards |

## Design Decisions

**Dat Quoc Pham (@heoconngoc):**

One design decision I made in Sprint 2 was to create a `docs/sprint-2-contract.md` file before we began implementing the feature. This document defines the technology stack, data model, API endpoints, shared interfaces, error handling, and team responsibilities.

An alternative was to let each team member start coding independently and resolve interface differences during integration. Although this would have allowed us to start coding sooner, it could have introduced inconsistencies and required additional debugging and rework.

For example, we agreed that the dateLost field would use the YYYY-MM-DD format in API requests and responses, while the backend would store it as a Mongoose Date. Since Jerry was working on the frontend and I was implementing the backend validation and database layers, this agreement gave us a consistent data format to follow. Without it, the frontend might have sent a different date format than the backend expected, requiring us to change the form submission logic or validation code during integration.

Writing the contract took some additional time upfront, but it helped us coordinate our work, clarify responsibilities, and reduce the risk of integration issues.

**Jerry Chen (@Jerry605185):**

One design decision I made is that I chose to have the browser form send its data with fetch to POST /api/lost-items and show any error on the same page. The alternative was server-rendered form, which is post to a page route such as /lost-items, and on failure re-render new.ejs with the error message. I chose fetch because it can return 201 on success and a 400 with {success: false, error} on a validation failure. The alternative version would need a second POST route that repeats the controller's Ok/Err handling. It would also need to pass all eight field values back into the template after every error so the user's typing isn't lost. With fetch the page never reloads, so the typed values stay in place on their own. The error text starts with the field name, such as "location must be between 1 and 150 characters", so the script can highlight and focus that input. The cost is that the form needs JavaScript. With JavaScript off, it posts to the same endpoint and shows raw JSON instead of a friendly page. I accepted that because this project targets ordinary browsers and one tested endpoint is easier to keep correct than two.
