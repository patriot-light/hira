# Development Workflow

Local development

1. Install dependencies (see `INSTALLATION.md`).
2. Run backend and frontend concurrently in separate terminals:

```powershell
# Terminal A
cd backend
yarn dev

# Terminal B
cd frontend
yarn start
```

Environment variables

- Keep per-environment `.env` files out of source control. Add `.env` to `.gitignore`.
- Typical variables: `MONGODB_URI`, `PORT`, `JWT_SECRET`, `NODE_ENV`.

Branching & PRs

- Use feature branches with descriptive names: `feature/<area>-<short-desc>`.
- Open PRs against `main` and include a short description, testing steps, and screenshots when UI changes are involved.

Linting & formatting

- The frontend includes ESLint; run linting during CI. Add `pre-commit` hooks as desired.

Database seeding

- Add lightweight seeding scripts under `backend/scripts/seed.js` if required. Run with `node backend/scripts/seed.js`.

API client

- Use `frontend/src/services/api.js` to centralize API calls and token handling.
