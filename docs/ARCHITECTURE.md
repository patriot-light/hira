# Architecture Overview

Hira is a two-tier web application:

- Frontend: React-based single-page application (SPA) built with CRACO and Tailwind CSS.
- Backend: Node.js + Express API that exposes REST endpoints and handles business logic, PDF and Excel exports, and MongoDB persistence.

Key components

- `frontend/` — UI components, feature modules, services for API calls.
- `backend/src/` — Express app, routers under `routes/`, business logic in `services/`, and MongoDB integration in `config/database.js`.
- `plugins/` — build and dev tooling extensions (frontend build helpers).

Data flow

1. User interacts with SPA; SPA calls backend REST endpoints using `axios` through `frontend/src/services/api.js`.
2. Backend routes delegate to service-layer functions (e.g., `sessionService`, `evaluationService`).
3. Services access MongoDB using the `mongodb` driver; exported documents may be generated as PDFs/Excel (using `pdfkit`, `exceljs`) and optionally rendered via `puppeteer-core`.

Scalability and considerations

- Stateless backend design allows horizontal scaling; keep sessions/token secrets in secure store.
- Use indexes in MongoDB collections for commonly filtered fields (e.g., `userId`, `sessionDate`).
