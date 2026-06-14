# Operations & Deployment

Runbook

- Ensure environment variables are set (see `BACKEND.md`).
- Start services with a process manager or container:

Docker (recommended pattern)

1. Build backend image, ensure Chromium is available if using Puppeteer.
2. Build frontend static assets with `yarn build` and serve via CDN or static web server.

Monitoring & backups

- Add application logs to a centralized logging system (e.g., ELK, Datadog).
- Regularly back up MongoDB and test restores.

Scaling

- Backend is stateless; scale with multiple replicas behind a load balancer.

Security

- Keep `JWT_SECRET` and DB credentials in a secrets manager.
- Enforce HTTPS in production, and use rate limiting on sensitive endpoints.
