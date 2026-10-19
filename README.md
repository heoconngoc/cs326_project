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

- Node.js and npm — download from <https://nodejs.org/en/download>
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

### Configure the environment

The server reads `PORT` and `MONGODB_URI` from the environment. Create a `.env`
file from the template and adjust it to your MongoDB server:

```bash
cp .env.example .env
```

The `npm start` script loads it automatically with Node's `--env-file` flag.

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

3. Click **Submit**. The browser sends the form as a JSON
   `POST /api/lost-items` request.
4. On success, the server saves the item to MongoDB and redirects the browser to
   `/lost-items?created=1`, where a success banner is shown and the new item
   appears at the top of the list.
5. If validation fails, the server responds with `400` and a message, and the
   form displays it inline — nothing is saved.
6. `contact info` is stored for staff but is never returned by the public API. We are still thinking about how we should display the `contact info` regarding the personal privacy.

## API Endpoints

| Method | Endpoint          | Description                      | Success  |
| ------ | ----------------- | -------------------------------- | -------- |
| GET    | `/`               | Home page                        | 200 HTML |
| GET    | `/lost-items`     | Lost items list, newest first    | 200 HTML |
| GET    | `/lost-items/new` | Report-a-lost-item form          | 200 HTML |
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
  | POST /api/lost-items (JSON)
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
- A form submit flows `Browser → app.js → apiRouter → controller → service →
repository → MongoDB`, and the controller returns JSON.
- If any layer throws, the wrapped async handler forwards the error to the
  error-handling middleware in `middleware/errorHandler.js`.

## Design Decisions

**Dat Quoc Pham (@heoconngoc):**

One design decision I made in Sprint 2 was to create a `docs/sprint-2-contract.md` file before we began implementing the feature. This document defines the technology stack, data model, API endpoints, shared interfaces, error handling, and team responsibilities.

Another option was to have each team member start coding independently and discuss details as needed during that process. While that approach might allow us to start programming earlier, it could also cause inconsistencies between our implementations and require additional changes, debugging when integrating our work.

By agreeing on a technical contract beforehand, we could work on different parts of the project with a shared understanding of how everything should fit together. Although writing this document initially took a little extra time, It truly helped to make our collaboration more organized and minimized integration issues.

**Jerry Chen (@Jerry605185):**

One design decision I made is that I chose to have the browser form send its data with fetch to POST /api/lost-items and show any error on the same page. The alternative was server-rendered form, which is post to a page route such as /lost-items, and on failure re-render new.ejs with the error message. I chose fetch because it can return 201 on success and a 400 with {success: false, error} on a validation failure. The alternative version would need a second POST route that repeats the controller's Ok/Err handling. It would also need to pass all eight field values back into the template after every error so the user's typing isn't lost. With fetch the page never reloads, so the typed values stay in place on their own. The error text starts with the field name, such as "location must be between 1 and 150 characters", so the script can highlight and focus that input. The cost is that the form needs JavaScript. With JavaScript off, it posts to the same endpoint and shows raw JSON instead of a friendly page. I accepted that because this project targets ordinary browsers and one tested endpoint is easier to keep correct than two.
