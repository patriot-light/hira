# API Reference (Overview)

This file provides a high-level overview of the available REST endpoints. For full endpoint-level details, extend this file with OpenAPI/Swagger if desired.

Auth

- POST `/api/auth/login` — authenticate and receive JWT token
- POST `/api/auth/register` — register a new account

Users

- GET `/api/users` — list users
- GET `/api/users/:id` — fetch a user
- PUT `/api/users/:id` — update a user

Sessions & Evaluations

- GET `/api/sessions` — list sessions
- POST `/api/sessions` — create a session
- GET `/api/evaluations` — list evaluations

Exports

- GET `/api/export/pdf` — generate PDF export (may use puppeteer)
- GET `/api/export/excel` — generate Excel export

Error handling

- Errors are returned in a consistent JSON format by the centralized error middleware.

Extending the docs

- Consider adding a machine-readable OpenAPI spec and attaching example requests and responses.
