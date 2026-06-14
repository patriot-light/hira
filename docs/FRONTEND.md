# Frontend Documentation

Overview

- React SPA located in `frontend/` using CRACO, Tailwind CSS, and Radix UI primitives.

Scripts

- `yarn start` — development server (CRACO)
- `yarn build` — production build
- `yarn test` — test runner

Structure

- `src/components/` — UI components and layout
- `src/features/` — feature modules (auth, evaluations, sessions, etc.)
- `src/services/api.js` — centralized API client (axios)
- `src/context/` — application contexts such as `AuthContext`

Styling

- Tailwind CSS is configured at `tailwind.config.js`.

Internationalization

- Uses `i18next` and `react-i18next` with configuration in `src/i18n/`.

Build & Deployment

- Run `yarn build` to produce a static production bundle in `frontend/build/`.

Notes

- The `frontend/package.json` indicates the project expects Yarn but `npm` can be used as an alternative.
