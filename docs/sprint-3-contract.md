# Sprint 3 — Technical Agreement

## 1. Goals

- Complete per-record MongoDB/Mongoose repository operations.
- Add Jest service-layer tests with mocked repositories.
- Set up GitHub Actions for automated testing.
- Implement at least one HTMX interaction.
- Apply responsive Tailwind CSS styling.
- Update README, system diagram, and design decisions.

## 2. Technology & Architecture

- **Backend:** Node.js, Express.js (ES Modules)
- **Frontend:** EJS, HTMX, **Tailwind CSS (new)**
- **Database:** MongoDB + Mongoose
- **Testing:** **Jest (new)**
- **CI:** **GitHub Actions (new)**
- **Architecture:** Routes → Controller → Service → Repository → MongoDB

## 3. Team Responsibilities

### Dat Quoc Pham — Backend & Testing

| Task | Deliverable |
|---|---|
| Mongoose repository | `getAll`, `findById`, `create`, `updateById`, `removeById` operations |
| Service-layer tests | Jest tests covering all validation rules using mocked repository |
| CI | GitHub Actions workflow running tests automatically |
| System diagram | Updated architecture showing MongoDB, tests, and mocked repository |

### Jerry Chen — Frontend & UI

| Task | Deliverable |
|---|---|
| HTMX | At least one interaction using HTMX and server-rendered HTML partials |
| Tailwind CSS | Restyled EJS pages |
| Responsive design | Mobile and desktop layouts |
| UI verification | Working interactions, validation messages, and error handling |


### Shared Responsibility
- Update README with Sprint 3 changes and verification instructions.
- Write one attributed Design Decision each, including an alternative and tradeoffs.
- Add a clearly labeled Sprint 3 Disclosure section.
- Review each other's pull requests before merging.
- Verify all deliverables on `main`.
