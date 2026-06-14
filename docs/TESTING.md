# Testing

Backend

- Run backend tests with:

```powershell
cd backend
yarn test
```

- Tests are located in `backend/tests/` and use Node's test runner; `supertest` is available for HTTP integration tests.

Frontend

- Run frontend tests with:

```powershell
cd frontend
yarn test
```

CI Recommendations

- Run unit and integration tests on pull requests.
- Fail the pipeline on test regressions.

Adding tests

- Backend: add `*.test.js` files under `backend/tests/` and use `node --test` or `supertest` for endpoint tests.
- Frontend: use the existing test setup (CRACO/react-scripts) and jest-compatible tests.
