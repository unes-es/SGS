# CLAUDE.md — SGS Project Guide

This file is the entry point for any Claude instance (Claude Code especially) working
on this repository. Read this first. Deeper detail lives in `docs/ARCHITECTURE.md`,
`docs/DEPLOYMENT.md`, and `docs/ROADMAP.md`. Sprint-by-sprint task tracking lives in
`BACKLOG.md` at the repo root — that file, not this one, is the source of truth for
"what's done / what's next."

> **A note on how this file was produced:** it was reconstructed by another Claude
> instance from ~8 months of chat history with Younes, not from reading this codebase
> directly. Treat specifics (file paths, exact schema fields, current Dockerfile
> contents) as **the best available reconstruction, not verified ground truth** —
> cross-check against the actual files in this repo before relying on any single
> detail, especially anything marked ⚠️ below.

---

## What SGS is

**SGS** (École Supérieure de Gestion et Sciences) is a full-stack school management
platform for a private school client in Morocco running **two campuses**. It covers
student records, attendance, grades, staff/payroll, cash register operations,
document generation (attestations, transcripts, bulletins), admissions, notifications,
and financial/KPI reporting.

- **Live:** https://sgs.nextsi.ma
- **Repo:** github.com/unes-es/SGS
- **Built by:** Younes, solo full-stack developer/consultant, nextsi.ma, Casablanca
- **Client:** a private school (two campuses — Casablanca + Rabat, per site content)

---

## Who you're working with

Younes is the sole developer on this project — frontend, backend, database, and
DevOps all fall to him. Work with him accordingly:

- **Tell him exactly which files to change**, with complete, paste-ready code blocks.
  Don't make him guess at partial diffs.
- **Don't generate large files unprompted.** Confirm scope first for anything big.
- **Flag proactive product ideas** with a `💡 Product Idea` tag when you see an
  opportunity — he's explicitly asked for this.
- He works in **sprints**, tracked in `BACKLOG.md`. When a sprint completes, update
  that file (checkbox + commit message), don't leave status only in chat.
- He prefers **concise** responses over exhaustive ones.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + TailwindCSS |
| Frontend data | TanStack Query + Axios (JWT refresh interceptor) |
| Frontend state | Zustand (user persisted, access token **not** persisted) |
| Backend | Fastify + Node.js |
| ORM | Prisma **7** with `@prisma/adapter-pg` driver adapter |
| Database | PostgreSQL 16 |
| Hosting | Hetzner VPS, Docker Compose, Nginx, Let's Encrypt |
| PDF generation | Server-side (attestations, reçus, bulletins, relevés) |
| Testing | Postman collection (`SGS API`, `base_url` + `access_token` variables) |

See `docs/ARCHITECTURE.md` for the full breakdown.

---

## Critical conventions — read before touching code

1. **Prisma 7 requires the driver adapter.** Schema needs `previewFeatures =
   ["driverAdapters"]` and the client is instantiated with `@prisma/adapter-pg`.
   **Run `npx prisma generate` after every schema change** — it will not happen
   automatically. Migration files **must be committed to git**; production runs
   `prisma migrate deploy`, not `migrate dev`.

2. **Prisma Studio does not work with the driver adapter.** Use pgAdmin or
   `docker exec -it sgs-postgres psql -U <user> -d <db>` instead.

3. **Fastify `preHandler` hooks apply to the whole scope**, regardless of where in
   the file a route is declared. Public routes (e.g. `candidatures/public`, public
   `centres`/`filieres` GETs) must live in their own `fastify.register()` scope,
   separate from the authenticated scope — otherwise `authenticate` silently applies
   to them too.

4. **Backend module pattern is fixed and consistent** across every domain:
   `*.routes.js` → `*.controller.js` → `*.service.js`. No DB calls in controllers,
   no business logic in routes. New modules should follow this exactly.

5. **Multi-centre data isolation matters a lot to the client** — it was raised as
   explicit feedback after the Phase 1 demo (see `docs/ROADMAP.md`). Every
   centre-scoped model carries a `centreId` and queries must filter by it.
   ⚠️ Known fragility: some frontend queries rely on the JWT for centre scoping
   rather than passing `centreId` explicitly — see Known Issues in `BACKLOG.md`.

6. **Auth persistence on reload:** `ProtectedRoute` must check both `user` (Zustand,
   persisted) and `accessToken` (not persisted) — not just the token — or page
   refresh incorrectly bounces the user to login. An `AuthInit` component calls the
   refresh endpoint on mount when `user` exists but `accessToken` doesn't.

7. **Deploy/migration ordering matters.** Running `prisma migrate deploy` inside the
   container's own startup `CMD` caused restart loops when a migration failed
   (P3009). ⚠️ There was back-and-forth across sessions on whether migrations should
   run inside the Dockerfile `CMD` or as an explicit step in `deploy.sh` after
   containers are up — **check the current `Dockerfile` and `deploy.sh` on the VPS
   /repo to see which pattern is actually in place now** before assuming either.
   Full context in `docs/DEPLOYMENT.md`.

8. **Field placement gotcha:** `telephone` lives on `Utilisateur`, not on `Eleve`.
   `dateNaissance` must be wrapped in `new Date()` before Prisma insertion.

---

## Current status (as of last known sync)

- ✅ **Phase 1 (MVP)** — complete
- ✅ **Phase 1.2** (Sprints 1–7, polish) — complete
- ✅ **Phase 2** Sprint 1 (Candidatures), Sprint 2 (Bulletins PDF), Sprint 4
  (Notifications), Sprint 5 (Rapports & KPI) — complete
- ⏭️ **Phase 2** Sprint 3 (Portail Parents) — intentionally deferred to Phase 2.2
- ❓ **Phase 2** Sprint 6 (Paramètres & Documents avancés) — not yet confirmed
  started; check `BACKLOG.md` for the latest
- 🔧 Recent infra incident: Let's Encrypt auto-renewal broke, cert expired; a fix
  was walked through (see `docs/DEPLOYMENT.md`) — **verify it was actually applied**
  (cron entry for renewal + Nginx reload, and the `.well-known/acme-challenge`
  route in Nginx config) rather than assuming it's resolved.

Full phase/sprint history and rationale: `docs/ROADMAP.md`.
Checkbox-level task tracking: `BACKLOG.md` (repo root, keep this updated).

---

## Where to look next

- **`docs/ARCHITECTURE.md`** — folder structure, Prisma schema overview, auth flow,
  roles/permissions, module pattern, multi-centre isolation approach.
- **`docs/DEPLOYMENT.md`** — VPS/Docker/Nginx setup, deploy script, SSL, backups,
  known migration gotchas.
- **`docs/ROADMAP.md`** — full phase-by-phase plan (Phase 1 through Phase 3) with
  the reasoning behind sequencing and deferrals, plus the open product-ideas backlog.
- **`BACKLOG.md`** — the live, authoritative sprint checklist. Update this, not this
  file, when work completes.

When in doubt about current code state, **read the actual files in this repo** —
this document reflects the state of the project as reconstructed from chat history,
not a live read of the codebase.
