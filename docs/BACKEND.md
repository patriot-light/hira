# Backend Documentation

Entry point

- Main file: backend/src/server.js

Scripts

- `yarn start` — `node src/server.js`
- `yarn dev` — `node --watch src/server.js`
- `yarn test` — runs tests in `backend/tests/`

Configuration & environment

- Environment variables (typical):
  - `MONGODB_URI` — MongoDB connection string
  - `PORT` — server port (default 3000)
  - `JWT_SECRET` — secret for signing JWT tokens

Database

- Configuration at backend/src/config/database.js
- Uses the official `mongodb` Node.js driver

Routing

- Routes are declared under backend/src/routes/ and include:
  - `authRoutes.js`, `usersRoutes.js`, `studentsRoutes.js`, `teachersRoutes.js`, `sessionsRoutes.js`, `evaluationsRoutes.js`, `reportsRoutes.js`, `exportRoutes.js`

Middleware

- `backend/src/middleware/auth.js` — JWT auth middleware
- `backend/src/middleware/error.js` — centralized error handling

Services

- Business logic is encapsulated in `backend/src/services/` (e.g., `sessionService.js`, `evaluationService.js`).

Exports & rendering

- Export utilities use `pdfkit`, `exceljs`, and `puppeteer-core` for generating documents and exports.

Testing

- Tests are in `backend/tests/` and use Node's built-in runner; `supertest` is included for integration tests.

Operational notes

- For production, run the server behind a reverse proxy and use a process manager or container orchestration.
