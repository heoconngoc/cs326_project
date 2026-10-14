# Sprint 2 — Technical Agreement

## 1. Technology & Architecture

- **Backend:** Node.js, Express.js (ES Modules)
- **Frontend:** EJS, HTML, CSS, Vanilla JavaScript
- **Database:** MongoDB Atlas + Mongoose
- **Architecture:** Routes → Controller → Service → Repository

**Sprint 2 Feature:** Submit a lost item through a browser form, validate the input, save it to MongoDB, and display the result.

Out of scope: image uploads, authentication, and item claiming.

## 2. Data Model

**MongoDB Collection:** `lostitems`

| Field | Type | Required | Validation / Default |
|---|---|---|---|
| title | String | Yes | 3–100 characters |
| description | String | Yes | 1–1000 characters |
| category | String | Yes | 1–50 characters |
| location | String | Yes | 1–150 characters |
| dateLost | Date | Yes | Valid date, not in the future |
| color | String | No | Max 50 characters; default `""` |
| brand | String | No | Max 80 characters; default `""` |
| contactInfo | String | No | Max 150 characters; default `""` |
| status | String | Auto | Default `"open"` |
| _id | ObjectId | Auto | MongoDB-generated |
| createdAt, updatedAt | Date | Auto | Mongoose timestamps |

**Conventions:**
- Required strings are trimmed and cannot be empty.
- The API accepts and returns `dateLost` in `YYYY-MM-DD` format.
- `contactInfo` is stored but excluded from public API responses.
- Server-generated fields cannot be set by the client.
- Validation belongs to the service; database access belongs to the repository.

## 3. API Contract

| Method | Endpoint | Purpose | Success |
|---|---|---|---|
| GET | `/lost-items` | Lost items page | 200 HTML |
| GET | `/lost-items/new` | New item form | 200 HTML |
| POST | `/api/lost-items` | Create a lost item | 201 JSON |
| GET | `/api/lost-items` | List items (newest first) | 200 JSON |

### POST /api/lost-items

**Request (JSON):**

```json
{
  "title": "Lost Badminton Racket",
  "description": "Lost near Franklin DC",
  "category": "Sport",
  "location": "Franklin DC",
  "dateLost": "2026-10-12",
  "color": "Black",
  "brand": "Yonex",
  "contactInfo": "example@umass.edu"
}
```

**Success — 201 Created:**

```json
{
  "success": true,
  "data": {
    "id": "670d1234567890abcdef1234",
    "title": "Lost Badminton Racket",
    "description": "Lost near Franklin DC",
    "category": "Sport",
    "location": "Franklin DC",
    "dateLost": "2026-10-12",
    "color": "Black",
    "brand": "Yonex",
    "status": "open",
    "createdAt": "2026-10-14T18:00:00.000Z"
  }
}
```

**Validation error — 400 Bad Request:**

```json
{
  "success": false,
  "error": "Title is required"
}
```

**Server error — 500 Internal Server Error:**

```json
{
  "success": false,
  "error": "Something went wrong"
}
```

### GET /api/lost-items

Returns an array of public items in the same format as the POST response, ordered by `createdAt` descending.

```json
{
  "success": true,
  "data": []
}
```

An empty database returns an empty array.

## 4. Shared Interfaces & Error Handling

### Controller → Service

File: `services/lostItemsService.js`

| Function | Input | Output |
|---|---|---|
| `createLostItem(input)` | Request body object | `Promise<Ok(item) \| Err(message)>` |
| `getAllLostItems()` | None | `Promise<item[]>` |

### Service → Repository

File: `repositories/lostItemsRepository.js`

| Function | Input | Output |
|---|---|---|
| `insertLostItem(itemData)` | Validated item data | `Promise<document>` |
| `findAllLostItems()` | None | `Promise<document[]>` |

### Error Conventions

- **Validation errors:** Service returns `Err(message)`; controller responds with HTTP 400.
- **Successful validation:** Service returns `Ok(item)` after persistence.
- **Unexpected errors:** Async handlers forward errors to Express error-handling middleware, which responds with HTTP 500.
- **Frontend:** Check `response.ok` and display errors to the user.

## 5. Team Responsibilities

| Dat Quoc Pham | Jerry Chen |
|---|---|
| MongoDB connection and Mongoose model | EJS pages and frontend styling |
| Repository layer | Browser JavaScript and form submission |
| Service layer and input validation | Routes and controllers |

**Shared responsibilities:**
- Update README, including the System Diagram and individual Design Decisions.
- Review each other's pull requests before merging into `main`.
