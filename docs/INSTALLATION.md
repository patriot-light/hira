# Installation & Quickstart

This document covers getting the project running locally (Windows, macOS, Linux).

Prerequisites

- Node.js 18+ (LTS recommended)
- Yarn or npm
- MongoDB instance (local or hosted)
- Chrome/Chromium if running PDF/export features that use Puppeteer

Repo layout

- `backend/` — Express API server
- `frontend/` — React application

Quick start (using Yarn)

1. Install dependencies for backend and frontend

```powershell
cd backend
yarn install
cd ../frontend
yarn install
```

2. Configure environment variables

- Copy `backend/.env.example` to `backend/.env` (if present) and set `MONGODB_URI`, `JWT_SECRET`, and other keys.

3. Start services for development

```powershell
# Backend (watch)
cd backend
yarn dev

# Frontend (hot reload)
cd ../frontend
yarn start
```

Notes

- The backend `package.json` defines `start` (`node src/server.js`) and `dev` (`node --watch src/server.js`) scripts.
- The frontend uses CRACO; run with `yarn start`, `yarn build`, `yarn test`.
