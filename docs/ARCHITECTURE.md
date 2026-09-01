# SGS — Architecture Reference

Companion to `CLAUDE.md`. This covers structure, data model, and cross-cutting
patterns in more depth. As with `CLAUDE.md`, treat this as a reconstruction from
project history — **verify against the live repo**, especially the Prisma schema,
since new models (Notification, Candidature, etc.) were added after the initial
schema was designed and this list may not be exhaustive.

---

## Repository layout

Monorepo, two top-level app folders. ⚠️ Casing was `Backend/` and `Frontend/` in the
GitHub repo at deploy-setup time (mirroring a Windows local path) — confirm current
casing before assuming `backend/`/`frontend/` lowercase.

```
SGS/
├── Backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.js
│   ├── prisma.config.ts        # ⚠️ lives at Backend/ root, not Backend/prisma/
│   ├── src/
│   │   ├── server.js           # entry point
│   │   ├── app.js              # Fastify setup, plugin registration, route mounting
│   │   ├── config/
│   │   │   ├── db.js           # Prisma client instance (driver adapter)
│   │   │   └── env.js
│   │   ├── middlewares/
│   │   │   ├── auth.js         # JWT verify + attach req.user
│   │   │   ├── roles.js        # role-based access control
│   │   │   ├── validate.js
│   │   │   └── errorHandler.js
│   │   ├── modules/            # one folder per domain, routes/controller/service each
│   │   │   ├── auth/
│   │   │   ├── centres/
│   │   │   ├── filieres/
│   │   │   ├── classes/
│   │   │   ├── matieres/
│   │   │   ├── eleves/
│   │   │   ├── absences/
│   │   │   ├── notes/
│   │   │   ├── personnel/
│   │   │   ├── salaires/
│   │   │   ├── caisse/
│   │   │   ├── documents/
│   │   │   ├── candidatures/
│   │   │   ├── notifications/
│   │   │   └── rapports/
│   │   └── utils/
│   │       ├── jwt.js
│   │       ├── hash.js
│   │       ├── pdf.js
│   │       └── mailer.js       # ⚠️ status unconfirmed — see Notifications section
│   └── Dockerfile
├── Frontend/
│   ├── src/
│   │   ├── pages/               # Dashboard, Eleves, Absences, Notes, Personnel,
│   │   │                        # Salaires, Caisse, Documents, Filieres, Classes,
│   │   │                        # EmploisDuTemps, Candidatures, Notifications, Rapports
│   │   ├── components/
│   │   ├── store/                # Zustand (auth store)
│   │   ├── api/                  # Axios instance + per-module API functions
│   │   └── App.jsx / router
│   └── vite.config.js
└── BACKLOG.md
```

**Known tech debt in this layout** (see `BACKLOG.md` → Known Issues):
- `/api/matieres` is registered as an inline route in `app.js` instead of its own
  module — should be extracted.
- `prisma.config.ts.bak` leftover file should be cleaned up.
- Frontend bundle is ~908KB — code splitting not yet done.

---

## Backend module pattern

Every domain module follows the same three-file shape, strictly:

```
modules/<domain>/
├── <domain>.routes.js       # endpoint definitions, middleware wiring, no logic
├── <domain>.controller.js   # req/res handling, calls service, no DB access
└── <domain>.service.js      # business logic + all Prisma queries
```

New modules (e.g. anything for Phase 2.2/2.3) should match this exactly rather than
introducing a new shape.

### Fastify public-route scoping (important)

`app.js` applies `addHook('preHandler', authenticate)` at a scope level. Any route
declared inside that scope requires auth **regardless of where in the file it's
written** — declaration order doesn't exempt a route. Public endpoints
(`candidatures/public` POST, public `centres`/`filieres` GET for the landing page)
must be registered in a **separate `fastify.register()`** block that never receives
the `authenticate` preHandler. This bit twice already (the `filieres/stats/eleves-par-
filiere` route was made public but its controller still assumed `req.user` existed —
fixed with `req.user?.role` null-safe checks). When adding a new public route, isolate
it the same way from the start rather than patching the controller after.

---

## Data model overview

Prisma 7, PostgreSQL, UUID primary keys, `@@map` to snake_case table names. This list
reflects what was designed/discussed across sessions — **read `prisma/schema.prisma`
directly for the authoritative current state**, since models were added incrementally
(Candidature and Notification came in Phase 2, after the original Phase 1 schema).

### Enums (known)
`Role`, `StatutEleve`, `TypeContrat`, `TypeAbsence`, `TypeEval`, `TypeFrais`,
`ModePaiement`, `StatutPaiement`, `TypeBonCaisse`, `JourSemaine`, `TypeDocument`,
`StatutCandidature` (`EN_ATTENTE`, `EN_COURS`, `ACCEPTEE`, `REFUSEE`).

### Roles
```
SUPER_ADMIN      — full platform config, cross-centre
DIRECTEUR        — full access, scoped to their own centre; validates sensitive ops
COMPTABLE        — financial modules, paiements, caisse
PROFESSEUR       — own classes, saisie notes/absences, read-only élève dossier
SECRETAIRE       — dossiers élèves, inscriptions, document generation
PARENT           — reserved for Phase 2.2 Portail Parents (not yet built)
```

### Core models (known, non-exhaustive)
`Centre`, `Filiere`, `Classe`, `Matiere`, `Eleve`, `Absence`, `Note`, `Personnel`,
`Salaire`, `Caisse`, `PaiementEleve`, `BonCaisse`, `Document`, `Utilisateur`,
`Candidature`, `Notification`.

Most centre-scoped models carry `centreId String` with `@@index([centreId])` and a
relation back to `Centre`. This is the mechanism multi-campus isolation depends on —
any new model that holds centre-specific data needs the same field + index.

### Candidature model (Phase 2 Sprint 1)
```prisma
model Candidature {
  id              String             @id @default(uuid())
  centreId        String
  filiereId       String?
  prenom          String
  nom             String
  email           String
  telephone       String?
  dateNaissance   DateTime?          @db.Date
  adresse         String?
  nomParent       String?
  telParent       String?
  message         String?
  statut          StatutCandidature  @default(EN_ATTENTE)
  noteInterne     String?
  traitePar       String?
  traiteAt        DateTime?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  centre          Centre             @relation(fields: [centreId], references: [id])
  filiere         Filiere?           @relation(fields: [filiereId], references: [id])
  traiteParUser   Utilisateur?       @relation(fields: [traitePar], references: [id])
}
```
Accepted candidatures convert directly into an `Eleve` record via a
`ConvertirEleveModal` on the frontend, pre-filled from the candidature and with
`classe` filtered by `filiere`.

---

## Auth flow

- **Access token:** JWT, short-lived (~15 min).
- **Refresh token:** httpOnly cookie, 7-day expiry.
- **Frontend:** Zustand persists `user` but deliberately **not** the access token
  (kept in memory only). On mount, if `user` exists but `accessToken` doesn't, an
  `AuthInit` component calls the refresh endpoint to silently re-establish the
  session before rendering protected routes — this is what fixed the
  "refresh bounces to login" bug.
- **Axios:** automatic refresh interceptor — a 401 triggers a refresh-token call and
  retries the original request transparently.
- **Cookie `secure` flag:** was explicitly set to `false` during initial VPS
  deployment testing (pre-SSL). ⚠️ Confirm this is `secure: true` (or
  `process.env.NODE_ENV === 'production'`) now that HTTPS is live — leaving it
  `false` in production is a real gap if it was never reverted.

---

## PDF generation

Server-side generation for: attestation de scolarité, reçu de paiement, attestation
de travail, relevé de notes, bulletin. The bulletin system (`getBulletin()`)
aggregates weighted averages, rank, and an automatic mention/appréciation per
élève/période. Documents carry a `numeroSerie` (unique) for the anti-fraud/QR-code
feature planned in Phase 2 Sprint 6.

---

## Notifications system (Phase 2 Sprint 4)

- `Notification` Prisma model.
- Broadcast created automatically on new candidature submission.
- Daily cron (`node-cron`) checks impayés and generates alerts.
- Frontend notification center in the Topbar (bell icon, dropdown, unread count),
  **polling every 30 seconds** — not push/websocket-based.
- Sidebar badges show pending-candidatures count and unread-notifications count.
- ⚠️ Email delivery (Brevo/Resend, listed in Phase 2 Sprint 4 backlog) does not appear
  to have been confirmed built — check `mailer.js` and whether it's wired up before
  assuming email notifications work end to end.

---

## Reporting (Phase 2 Sprint 5)

Backend: `rapports.service.js`, `rapports.controller.js`, `rapports.routes.js`,
registered in `app.js`. Covers: financial reports, attendance rate, success rate by
filière, FEC/SAGE export.

Frontend: `Rapports.jsx` with four tabs — **Financier**, **Présence**, **Réussite**,
**Export SAGE** — year/month filters, Recharts bar charts, detail tables, and a file
download trigger for the FEC export.

**Open item:** whether `getRapportFinancier()` returns a `parMois` array in the shape
the monthly chart expects was never confirmed resolved — verify the actual API
response shape against what `Rapports.jsx` consumes if the chart looks off.

---

## Frontend conventions

- **Data fetching:** TanStack Query for all server state — no manual `useEffect`
  fetch-and-setState patterns.
- **Client state:** Zustand for auth only; everything else derives from queries.
- **Styling:** TailwindCSS v4.
- **Mobile:** full responsive pass done in Phase 1.2 Sprint 7 — hamburger sidebar
  with slide-in overlay, `StatCard` stacked layout, `Card` wraps overflow content in
  `overflow-x-auto`, modals use `max-h-[90vh] overflow-y-auto`, filter inputs
  `w-full sm:w-64`.
- **Print views:** dedicated `.print-area` / `.no-print` CSS classes for emplois du
  temps and élèves lists.
- **Charts:** Recharts (revenue bar chart, élèves-par-filière donut, rapports charts).
