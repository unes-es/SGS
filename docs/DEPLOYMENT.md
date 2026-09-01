# SGS — Deployment & Infrastructure Reference

Companion to `CLAUDE.md`. Covers the production environment, deploy process, and
recurring infra issues. Reconstructed from chat history — **the migration/CMD
ordering in particular had back-and-forth across sessions; verify current state on
the VPS before changing it.**

> **2026-08-27 update (from a separate session working on other projects on this
> VPS, not this repo):** the app root has moved from `/opt/sgs` to `/opt/apps/sgs`
> (this box now hosts multiple projects under an `/opt/apps/<project>/`
> convention - `News`/`Newsverz` and `Boutik` also live there). All paths below
> that say `/opt/sgs/...` should read `/opt/apps/sgs/...` instead. Also: root SSH
> login is currently working (used directly, repeatedly, from another session),
> contradicting this doc's "root SSH login disabled" claim below - **verify actual
> sshd config before relying on either claim.**
>
> Two other changes to `docker-compose.yml` / `nginx/default.conf` were made from
> outside this repo, for `nextsi.ma` (not `sgs.nextsi.ma` - SGS's own domain and
> routes are untouched):
> - `docker-compose.yml`'s `nginx` service now has an explicit top-level `name: sgs`
>   (defensive fix after a real incident where two *other* projects on this VPS,
>   both defaulting to the same directory-basename-derived Compose project name,
>   collided and one deleted the other's running container - see `News`'s and
>   `Boutik`'s own `BACKLOG.md` for the full story). No-op for this project's own
>   resources since the name matches what was already implicit.
> - One new bind mount on the `nginx` service: `/opt/apps/nextsi-landing/public:/usr/share/nginx/landing:ro`,
>   and `nextsi.ma`/`www.nextsi.ma`'s server block now serves from that path
>   instead of falling through to SGS's own `frontend/dist` build - `nextsi.ma` is
>   now a real project-listing landing page, not a stray copy of the SGS app.
>   `sgs.nextsi.ma` itself is unaffected.

> **2026-09-01 incident: `sgs-nginx` is the shared reverse proxy for the whole
> VPS, not just this project - and `deploy.sh` restarts it on every deploy.**
> It currently terminates TLS and routes for `sgs.nextsi.ma`, `nextsi.ma`, and
> (via a leftover config, see below) `postiz.nextsi.ma`. This project's own
> `deploy.sh` runs `docker compose down` + `up -d --build`, which recreates
> this container - meaning **every SGS deploy briefly takes down every domain
> this nginx serves, not just sgs.nextsi.ma**, and any bad config anywhere in
> `nginx/conf.d` (including config for a project this repo has nothing to do
> with) can turn "briefly" into "stays down."
>
> That's exactly what happened tonight: `nginx/postiz.conf` referenced an
> upstream container (`postiz`) that no longer exists (Postiz was stopped
> earlier as architecturally not viable on this shared VPS - see that
> project's own notes). Nginx refuses to start at all if *any* conf.d file
> references an unresolvable upstream, so the moment this container got
> recreated by an SGS deploy, all three domains went down together
> (`connection refused` on 443) until the stale file was found and moved
> aside (`nginx/postiz.conf` → `nginx/postiz.conf.disabled-stale-upstream`)
> and the container restarted. It had been a landmine for a while - it just
> hadn't been triggered because nothing had restarted this container since
> Postiz was decommissioned.
>
> **Before running `deploy.sh` (or anything that restarts `sgs-nginx`)
> going forward:** check `nginx/conf.d` (or wherever the live conf.d
> actually lives - verify the path, don't assume) for config referencing
> containers/services that may no longer exist, for any project. Cheaper
> fix worth doing at some point: switch this project's `deploy.sh` to
> restart only `backend` (and `frontend` build output, which doesn't need a
> container restart - nginx just serves the rebuilt static files), and only
> touch `nginx` explicitly when nginx config actually changed - not as a
> matter of course on every deploy.

---

## Hosting

- **Provider:** Hetzner Cloud
- **Server:** `sgs-prod`, Ubuntu 24.04, CX22 (2 vCPU / 4GB RAM) at time of setup
- **User:** `younes` (non-root, sudo, SSH-key auth; root SSH login disabled)
- **Firewall (ufw):** OpenSSH, 80, 443 only
- **App root:** `/opt/sgs`

```
/opt/sgs/
├── backend/          → running Fastify app (built from /opt/sgs/repo/Backend)
├── frontend/          → built React app (dist/ contents copied here)
├── nginx/              → nginx conf.d
├── uploads/            → attestations/, documents/, bons-de-caisse/, releves/
├── postgres-data/     → PostgreSQL persistent volume
├── repo/                → git clone of github.com/unes-es/SGS (deploy source)
├── docker-compose.yml
├── deploy.sh
└── .env                 → POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB / JWT secrets
```

---

## docker-compose.yml (three services)

```yaml
services:
  postgres:
    image: postgres:16
    container_name: sgs-postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - /opt/sgs/postgres-data:/var/lib/postgresql/data
    networks: [sgs-network]

  backend:
    build:
      context: ./repo/Backend
      dockerfile: Dockerfile
    container_name: sgs-backend
    restart: always
    depends_on: [postgres]
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      NODE_ENV: production
      PORT: 3000
    volumes:
      - /opt/sgs/uploads:/app/uploads
    networks: [sgs-network]

  nginx:
    image: nginx:alpine
    container_name: sgs-nginx
    restart: always
    ports: ["80:80", "443:443"]
    volumes:
      - /opt/sgs/repo/Frontend/dist:/usr/share/nginx/html
      - /opt/sgs/nginx:/etc/nginx/conf.d
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on: [backend]
    networks: [sgs-network]

networks:
  sgs-network:
    driver: bridge
```

⚠️ The `backend.context` and the Nginx frontend volume were both migrated from
serving `/opt/sgs/backend` and `/opt/sgs/frontend` directly to serving from
`/opt/sgs/repo/Backend` and `/opt/sgs/repo/Frontend/dist` once proper git-based
deploy was set up. **Confirm which paths the live `docker-compose.yml` actually
uses** before editing it.

### Environment variables (names only — never commit real values)

| Variable | Used by |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | postgres, backend |
| `DATABASE_URL` | backend (Prisma) — special-character passwords **must be URL-encoded**, e.g. via `python3 -c "import urllib.parse; print(urllib.parse.quote(PASSWORD, safe=''))"` |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | backend |
| `NODE_ENV`, `PORT` | backend |

`.env.example` should be committed with empty values so a fresh clone documents
what's required. Real `.env` files are git-ignored.

---

## Deploy process

`deploy.sh` (at `/opt/sgs/deploy.sh`) — last known good version:

```bash
#!/bin/bash
set -e
echo "🔄 Pulling latest code..."
cd /opt/sgs/repo
git pull

echo "📦 Building frontend..."
cd /opt/sgs/repo/Frontend
npm install
npm run build

echo "🚀 Restarting services..."
cd /opt/sgs
docker compose down
docker compose --env-file .env up -d --build

echo "⏳ Waiting for backend to start..."
sleep 10

echo "🗄️ Running database migrations..."
docker exec sgs-backend npx prisma migrate deploy || echo "⚠️ Migration warning — check logs"

echo "✅ Deploy done!"
```

Run future deploys with:
```bash
/opt/sgs/deploy.sh
```

### ⚠️ Migration ordering — unresolved ambiguity, verify before touching

Two different patterns were discussed across sessions and it's not fully certain
which one is live now:

1. **Dockerfile CMD runs migrations on container start:**
   `CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]` — this was
   in place at one point and caused a **restart loop** when a migration failed
   (P3009 — resolved by manually marking the migration finished in
   `_prisma_migrations` then running `prisma migrate deploy` manually).
2. **`deploy.sh` runs migrations explicitly** via `docker exec sgs-backend npx prisma
   migrate deploy` after containers are up (shown above), with the Dockerfile CMD
   simplified to just `CMD ["node", "src/server.js"]` — this was the fix proposed to
   avoid the restart-loop failure mode.

**Before changing deploy behavior:** read the actual `Backend/Dockerfile` CMD line
and `deploy.sh` on the server to see which pattern is currently in effect, rather
than assuming either. If both run migrations (belt-and-suspenders), that's fine and
idempotent; if neither does, new schema changes will silently not apply to
production (this happened once — a `notifications` table didn't exist after a
schema change because the container wasn't rebuilt/migrated).

### Prisma 7 + driver adapter gotcha
`prisma.config.ts` lives at `Backend/prisma.config.ts` (not `Backend/prisma/
prisma.config.ts`) in this project. A `P1013: invalid port number` error during
deploy was traced to the driver-adapter connection string handling — **not** to
password encoding (which was double-checked and was fine). If this error recurs,
check `prisma.config.ts` location/content first, not the `DATABASE_URL` encoding.

---

## SSL / Let's Encrypt

Cert managed by Certbot, referenced by Nginx via `/etc/letsencrypt` mounted
read-only into the nginx container.

**Known incident:** the cert expired because auto-renewal wasn't actually running
(no active systemd timer or cron job doing it). Remediation:

1. Check status: `certbot certificates`
2. Force renewal: `certbot renew --force-renewal`, then reload Nginx
3. Diagnose why renewal wasn't automatic: `systemctl list-timers`, `crontab -l`
4. Add a cron entry that chains renewal with a **Docker-based** Nginx reload (plain
   `systemctl reload nginx` won't touch the containerized instance):
   ```cron
   0 3 * * * certbot renew --quiet && docker exec sgs-nginx nginx -s reload
   ```
5. **Common silent failure mode:** a misconfigured `.well-known/acme-challenge`
   route in the Nginx config can make renewal fail repeatedly even when the
   cron/timer is present and firing. If renewal fails again, check that route
   first.

⚠️ **Verify this cron entry actually exists on the server now** — the fix was
walked through in conversation but not explicitly confirmed as applied and tested
by a subsequent successful auto-renewal.

---

## Backups & logging

- **DB backups:** daily cron at 2am, 30-day retention (set up in Phase 1.2 Sprint 6).
- **Docker log rotation:** configured in the same sprint — check `docker-compose.yml`
  `logging` options or a host-level `/etc/docker/daemon.json` override for the
  current rotation policy.
- **Rate limiting:** `@fastify/rate-limit`, applied with `global: false` and enabled
  specifically on auth routes (login/refresh) to prevent brute-force without
  throttling normal API traffic.

---

## Local dev vs. production

Local dev uses Docker Compose for Postgres + pgAdmin only, with the backend run
directly (`node`/`nodemon`) against `localhost`. Postman is used for API testing:
collection `SGS API`, collection variable `base_url` (`http://localhost:3000`
locally), and a Tests-tab script on the login request that auto-saves
`access_token` to the collection variable on every login response.
