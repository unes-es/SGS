# SGS — Roadmap & Project History

Companion to `CLAUDE.md`. This is the narrative counterpart to `BACKLOG.md`:
`BACKLOG.md` is the live, authoritative checklist (update it when work completes);
this file explains **why** things happened in this order, what was deferred and why,
and what's still genuinely open. Reconstructed from ~8 months of project chat
history (April 2026 – August 2026 at last sync).

---

## Origin & context

SGS was built for a friend of Younes who runs a private school with **two campuses**
(Casablanca — Maarif, and Rabat — Agdal, opened 2022). Younes designed and built the
entire platform solo: frontend, backend, database, DevOps.

The build order agreed early on was:
**complete Phase 1 frontend → deploy to production → test everything live with the
client → then Phase 2.** This ordering was deliberate — the client needed to use the
real thing before further requirements could be meaningfully prioritized, and it's
why Phase 1.2's scope was partly **client feedback from a live Phase 1 demo** rather
than pre-planned.

A physical notebook (dated 29/03/2026) captured that demo feedback by hand, in
French, and had to be reconciled against a sprint plan Claude had produced in an
earlier session — the two didn't originally match, and cross-referencing them
surfaced multi-campus cash isolation as a requirement that hadn't been captured in
the original sprint plan.

---

## Phase 1 — MVP ✅ Complete

Built from scratch over one extended session: Docker + Postgres 16 + pgAdmin,
Fastify (chosen over Express — Younes was Express-familiar but agreed Fastify was
the better fit for this project), Prisma 7 with the driver-adapter pattern (a
breaking change from earlier Prisma versions that shaped several later gotchas), and
11 REST modules following the routes/controller/service pattern: auth, centres,
filieres, classes, matieres, eleves, absences, notes, personnel, salaires, caisse
(paiements + bons de caisse), documents.

Frontend: Vite + React Router + TanStack Query + Zustand + Tailwind v4 + Axios with
refresh interceptor. All Phase 1 admin pages built (Dashboard, Élèves, Absences,
Notes, Personnel, Salaires, Caisse, Documents, Filières with inline Matières panel,
Classes, Emplois du temps), plus a full public landing page (Navbar, Hero, Centres,
Filières, animated stat counters, préinscription form, témoignages, actualités,
événements, localisation, FAQ, contact, sticky CTAs).

Notable fixes along the way: `dateNaissance` needed explicit `new Date()` wrapping;
`telephone` belongs on `Utilisateur` not `Eleve`; Vite's default `App.css` conflicts
with Tailwind and had to be emptied; Prisma Studio doesn't work with the driver
adapter; and a reload/auth-persistence bug (`ProtectedRoute` only checking the
non-persisted access token) caused users to be bounced to login on every refresh.

Then: **VPS + Docker + Nginx + SSL production deployment** on Hetzner (full detail
in `docs/DEPLOYMENT.md`), including working through a Prisma 7 `P1013` connection
string error, a password-URL-encoding detour that turned out not to be the actual
cause, and setting up a `deploy.sh` script for one-command redeploys.

---

## Phase 1.2 — Polish ✅ Complete

Scope here mixed pre-planned polish with the notebook feedback from the client demo.
Seven sprints:

1. Toasts (`sonner`) + `ConfirmDialog` + global error handling
2. Real PDF generation — attestation de scolarité, reçu de paiement, attestation de
   travail (relevé de notes PDF was initially deferred here, later completed)
3. Search + pagination + empty states (including client-side search for Salaires by
   name/poste)
4. Dashboard charts (Recharts) — 6-month revenue bar chart (`getRevenueChart` on
   caisse), élèves-par-filière donut (`getElevesParFiliere` on filieres)
5. Print views for Emplois du temps and Élèves (`.print-area`/`.no-print`), with
   a classe filter
6. Rate limiting (`@fastify/rate-limit`, auth routes only), daily DB backups (2am
   cron, 30-day retention), Docker log rotation
7. Full mobile responsive pass across the admin (hamburger sidebar, stacked
   StatCards, overflow-safe tables/modals)

**Carried forward, not fully closed in Phase 1.2** (tracked in `BACKLOG.md`):
document creation form doesn't yet filter by document type (élèves vs personnel);
reçu paiement PDF only prints the latest paiement, not a selected one.

**The client-feedback items from the notebook** (gestion des caisses, gestion
séparée par centre, gestion des filières disponibles, gestion des évaluations/notes
par matière, relevé de notes) were folded into this phase and Phase 2 rather than
reordering everything — multi-campus cash isolation in particular became an
explicit, higher-priority requirement from this point on.

---

## Phase 2 — Extended Features 🔄 In Progress

### Sprint 1 — Candidatures ✅
Full admissions pipeline: `Candidature` Prisma model (`StatutCandidature` enum:
`EN_ATTENTE`/`EN_COURS`/`ACCEPTEE`/`REFUSEE`), backend module, admin page with
stats/filters/detail panel, manual candidature creation, and — the most involved
piece — `ConvertirEleveModal`, which auto-opens after accepting a candidature and
creates an `Eleve` record pre-filled from it, with `classe` filtered by `filiere`.
The public landing-page form was wired to a public `POST /candidatures/public`
route, which had to be isolated in its own `fastify.register()` scope to avoid
inheriting the global `authenticate` preHandler (see `docs/ARCHITECTURE.md`).

### Sprint 2 — Bulletins automatiques ✅
`getBulletin()` aggregates weighted averages, rank, and an automatic
mention/appréciation per élève/période; PDF generator built on top. Relevé de notes
PDF (carried from Phase 1.2) was completed here.

### Sprint 3 — Portail Parents ⏭️ Deferred to Phase 2.2
Explicitly deprioritized. The `PARENT` role already exists in the schema, but
Younes chose to defer building the actual portal until Phase 2.2 establishes the
`CANDIDAT`/`ETUDIANT` role and auth infrastructure first — building the parent
portal on top of that foundation rather than before it. Not started.

### Sprint 4 — Notifications & Alertes ✅
`Notification` model, broadcast on candidature creation, daily cron (`node-cron`)
checking impayés, notification center in the Topbar with 30-second polling, sidebar
badges for pending candidatures and unread notifications. Email notifications
(Brevo/Resend, listed as part of this sprint's original scope) — **status
unconfirmed**, check `mailer.js` in the backend before assuming this is live.

This sprint also produced the deploy-pipeline fix described in
`docs/DEPLOYMENT.md`: a schema change (new `notifications` table) wasn't reflected
in production because the deploy script wasn't running migrations after the
container rebuild, which is what led to the current migration-ordering approach
(and the ⚠️ flagged ambiguity about which pattern is actually live).

### Sprint 5 — Rapports & KPI ✅
Backend (`rapports.service.js`/`controller`/`routes`) covers rapport financier,
taux de présence, taux de réussite par filière, and FEC/SAGE export. Frontend
`Rapports.jsx` has four tabs (Financier, Présence, Réussite, Export SAGE) with
year/month filters, Recharts charts, detail tables, and a file-download trigger for
FEC export.

**Open question raised but not resolved:** whether `getRapportFinancier()` returns
a `parMois` array in the exact shape the frontend chart expects. If the financial
chart looks wrong, check this first.

**SAGE export note:** the question of whether SAGE export needs an exact licensed
format was raised — the working answer was that the export can be built and
generated regardless of whether the client currently holds a SAGE license, since
the license is only needed for *testing/verifying* the output against real SAGE,
not for generating it.

### Sprint 6 — Paramètres & Documents avancés 📋 Not confirmed started
- Page Paramètres: logo école, couleurs, infos centre
- Logo upload → used in PDF headers (replacing current placeholder)
- Modèles de documents personnalisables
- QR code anti-fraude sur documents officiels
- Fix Phase 1.2 document TODOs (document-type filtering, paiement selection for
  reçu PDF)

Check `BACKLOG.md` for the latest status — this may have started since the last
sync reflected in this document.

---

## Phase 2.2 — Portail Candidat/Étudiant 📋 Planned

Introduces two new roles beyond what Phase 1 shipped with:

- **Sprint 1 — Roles & Auth:** add `CANDIDAT` and `ETUDIANT` to the schema;
  auto-create a `CANDIDAT` account on candidature submission with emailed
  credentials (matricule + temp password); separate candidat login page; on
  acceptance, convert `CANDIDAT` → `ETUDIANT`, with a minor-status check during
  conversion that can optionally create a linked `PARENT` account.
- **Sprint 2 — Candidat Portal:** dashboard showing candidature status, document
  upload (CIN, diplôme, photo), messages from secretariat, status history timeline.
- **Sprint 3 — Student Portal (ETUDIANT):** dashboard (notes, absences, emploi du
  temps, paiements), document download, emploi du temps view, receipt
  view/download.
- **Sprint 4 — Candidature Enhancements:** document attachments on candidatures
  (admin side), welcome email on élève creation, conversion-rate stat on the
  Candidatures dashboard, bulk accept/refuse actions, Excel export of candidatures.

This is also where the deferred **Portail Parents** (Phase 2 Sprint 3) is expected
to land, built on top of the `CANDIDAT`/`ETUDIANT`/`PARENT` auth foundation
established here rather than bolted on separately.

---

## Phase 2.3 — Programmes & Formations 📋 Planned

- **Sprint 1 — Types de formation:** add `typeFormation` to `Classe`
  (`JOUR`/`SOIR`/`WEEKEND`/`HYBRIDE`/`INTENSIF`), filter by type in admin, type
  badges on class cards and emploi du temps, different default time slots per type
  (soir 18h–22h, weekend 8h–18h).
- **Sprint 2 — Gestion des créneaux:** emploi du temps aware of formation type,
  time-slot templates per type, different `fraisScolarite` pricing per format.
- **Sprint 3 — Reporting par format:** enrollment stats, revenue, and capacity
  utilization by formation type, with comparison charts on the dashboard.

---

## Phase 3 — Advanced 🔮 Planned

### Site vitrine
- CMS for actualités/événements manageable from the admin
- SEO optimization
- Contact form wired to backend (currently front-end only, per Phase 1 build)

### Infrastructure & DevOps
- Domain + SSL for sgs.nextsi.ma — ✅ done (see `docs/DEPLOYMENT.md` for the
  ongoing renewal-reliability issue)
- Domain for the nextsi.ma company landing page
- Wildcard SSL (`*.nextsi.ma`) for future projects beyond SGS
- CI/CD via GitHub Actions (auto-deploy on push) — currently deploy is manual via
  `deploy.sh`
- Staging environment — currently there is only production

### Security & Compliance
- 2FA for admin accounts
- Audit log (who did what, when)
- GDPR-compliant data export/deletion
- Session management (active sessions list)

### Integrations
- SAGE export — licensed by the client (see Phase 2 Sprint 5 note above)
- WhatsApp notifications — flagged repeatedly as high-value since WhatsApp is the
  dominant channel in Morocco (absence alerts, payment reminders)
- Payment gateway — CMI or PayZone, for actual online payment (currently
  préinscription is form-only, no payment collection)
- Google Calendar sync for emplois du temps

---

## Product ideas backlog (not yet scheduled into any phase)

Standing list of enhancement ideas raised as opportunities, distinct from committed
scope:

- Candidature conversion-rate stat card (Acceptées/Total) — also listed under
  Phase 2.2 Sprint 4, so may get pulled forward
- Welcome email with credentials on élève/personnel creation
- Document QR code — anti-fraud verification (also in Phase 2 Sprint 6)
- WhatsApp integration for absence/payment alerts
- Student self-service attestation requests
- Parent communication log (all communications per student, in one place)
- Classe capacity alerts at 80%/100%
- Financial forecasting — predict next month's revenue from enrolled students ×
  frais scolarité
- Absence pattern detection — auto-flag >3 consecutive absences
- Dark mode for night admin work
- Arabic/French toggle — flagged as important for the Moroccan market specifically
- Mobile app — React Native wrapper reusing the existing API
- Offline mode — cache critical data for low-connectivity use
- Bulk import — students/personnel from Excel at start of year
- Academic calendar — holidays, exam periods, semester boundaries

When picking these up, use the `💡 Product Idea` convention from `CLAUDE.md` to
flag any *new* ones that come up during other work, and fold accepted ones into
`BACKLOG.md`'s phase structure rather than leaving them only in this list.

---

## Known issues / tech debt (carry-forward)

- `/api/matieres` is an inline route in `app.js`, not a proper module
- Frontend classes query doesn't pass `centreId` explicitly — relies on the JWT,
  which works but is fragile (see multi-centre isolation note in
  `docs/ARCHITECTURE.md`)
- No input sanitization on public routes (`candidatures/public`, public `centres`
  GET)
- `prisma.config.ts.bak` leftover file should be removed
- Frontend bundle size warning (~908KB) — code splitting not yet done

---

## Cost model

A client-facing interactive HTML cost estimator was built covering infrastructure,
dev tooling, and Moroccan tax regimes (auto-entrepreneur vs. SARL/SAS), sized for
the school's actual scale (~1,400 students/year, ~50 staff, 2 centres). Finding:
even projected 5 years out (~7,000 cumulative students), infrastructure cost stays
under ~1,300 MAD/month with no architectural changes needed — the current VPS
sizing has a lot of headroom. Estimator file (if still needed for reference):
`sgs_cost_estimator.html`, previously generated to `/mnt/user-data/outputs/`.
