# Sprint 4 Technical Agreement

## 1. Authentication Design

- **Method:** Session-based authentication using `express-session` + `connect-mongo`.
- **Passwords:** Hashed using `bcrypt`.
- **Roles:** `user` (default) and `admin`.
- **Session:** Stored in MongoDB; browser receives an HttpOnly session cookie.
- **Admin:** Created through a server-side script, never through public signup.

## 2. Authentication API

| Method | Endpoint | Request Body | Success |
|---|---|---|---|
| POST | `/auth/signup` | `{ email, password }` | 201 + user |
| POST | `/auth/login` | `{ email, password }` | 200 + user |
| POST | `/auth/logout` | None | 200 |
| GET | `/auth/me` | None | 200 + user |

**Public user response:**
```json
{
  "id": "userId",
  "email": "user@example.com",
  "role": "user"
}
```

## 3. Authorization Rules

- Guests can view lost items but must log in to create, edit, or delete them.
- Owners can edit/delete their own items.
- Admins can edit/delete any item.
- `requireLogin` checks authentication at the route layer.
- The service layer checks ownership or admin role after loading the item.

**Error responses:**
- `400` — Invalid input
- `401` — Not authenticated
- `403` — Not authorized
- `404` — Resource not found
- `409` — Email already registered

## 4. Responsibilities

**Dat:** User model, authentication backend, sessions, authorization, backend tests.

**Jerry:** Signup/login pages, navigation updates, frontend integration, accessibility.
