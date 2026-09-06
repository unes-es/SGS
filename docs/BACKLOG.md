# SGS — Product Backlog

> Last updated: 01/09/2026 (evening pass) — rewritten from verified state
> (git history, live production checks, and a full local run of the test
> suite/build), not carried forward from the previous version of this
> file, which had drifted significantly out of sync with reality. See
> `docs/ROADMAP.md` for the narrative version of how this happened.
> Stack: React + Fastify + PostgreSQL + Prisma 7
> Live: https://sgs.nextsi.ma

---

## ✅ PHASE 1 — MVP (Complete)

### Core modules (all done)
- Auth (JWT, 6 roles, refresh token)
- Centres, Filières, Classes, Matières
- Élèves (auto-matricule, dossier complet)
- Absences (justification + stats)
- Notes (moyennes pondérées + classement)
- Personnel + Salaires
- Caisse (paiements, bons de caisse, solde, impayés)
- Documents (type-based numeroSerie)
- Emplois du temps (schedule grid)
- Site vitrine + formulaire pré-inscription
---

## ✅ PHASE 1.2 — Polish (Complete)

- Sprint 1: Toasts (sonner) + ConfirmDialog + global error handling
- Sprint 2: PDF génération (attestation scolarité, reçu paiement, attestation travail)
- Sprint 3: Search + pagination + empty states
- Sprint 4: Dashboard charts (revenus 6 mois, élèves par filière)
- Sprint 5: Print views (emplois du temps, liste élèves)
- Sprint 6: Rate limiting + DB backups + logging
- Sprint 7: Mobile responsive admin
### Phase 1.2 TODOs
- [x] Document creation form: filter list by document type (élèves vs
      personnel) — **fixed 01/09 (evening)**. Was deeper than originally
      scoped: `Document.eleveId` was required, so there was no way to
      generate an ATTESTATION_TRAVAIL/FICHE_PAIE for a staff member
      without picking a bogus "élève", and `generatePdf()`'s
      ATTESTATION_TRAVAIL branch resolved "personnel" from
      `doc.generePar` (whoever clicked generate) instead of an actual
      selected employee — confirmed locally that this produced an
      attestation about the admin, not the teacher it was meant for.
      Added a nullable `personnelId`, made `eleveId` optional, the
      creation form now shows a Personnel selector for those two types,
      and `generatePdf()` 422s with a clear message instead of silently
      rendering wrong data when nothing can be resolved.
- [x] Reçu paiement PDF: let user select which paiement to print (not
      just latest) — **fixed 01/09**, see Phase 2 Sprint 5 below.
- [x] Relevé de notes PDF — done (Phase 2 Sprint 2).
---

## 🔄 PHASE 2 — Extended Features (In Progress)

### Sprint 1 — Candidatures ✅
- [x] Candidature model + backend module
- [x] Admin page: list, stats, filters, detail panel
- [x] Status management (EN_ATTENTE, EN_COURS, ACCEPTEE, REFUSEE)
- [x] Manual candidature creation by admin
- [x] Convert accepted candidature → create élève directly
- [x] Landing page form wired to backend
- [x] Dynamic centres/filières dropdowns on form
- [x] Public API routes (centres, filieres, candidatures/public)
- [x] **01/09 security fix**: `POST /candidatures/public` had no field
      whitelist — since it has no auth guard and is called by both the
      public form and the admin's own manual-creation modal, a raw
      request could set `statut` (straight to ACCEPTEE), `noteInterne`,
      `traitePar`, or `traiteAt` directly, bypassing review entirely.
      Confirmed exploitable locally before the fix. Now whitelisted at
      both the Fastify schema level and the service layer.

### Sprint 2 — Bulletins automatiques ✅
- [x] Backend: bulletin endpoint (notes + moyennes + rang par élève/période)
- [x] PDF bulletin: toutes matières, coefficients, moyennes pondérées
- [x] Mention et appréciation automatique
- [x] Relevé de notes PDF
- [x] Frontend: generate bulletin button

### Sprint 3 — Portail Parents ⏭️ Deferred to Phase 2.2
Intentionally not started — see `docs/ROADMAP.md`. The `PARENT` role
exists in the schema; the actual portal is meant to be built on top of
the `CANDIDAT`/`ETUDIANT` auth foundation in Phase 2.2, not before it.

### Sprint 4 — Notifications & Alertes ✅
- [x] Notification model, broadcast on candidature creation
- [x] Alertes impayés automatiques (daily cron via node-cron)
- [x] Notification center in Topbar (30s polling), sidebar badges
- [ ] Email notifications for impayés/alerts — `mailer.js` (Resend) now
      definitely exists and works (built + verified for Phase 2.2's
      candidat/élève/personnel emails), but `notifications.service.js`
      itself never calls it — impayés alerts and broadcasts are still
      in-app only, no email sent. A real gap now, not just unconfirmed.

### Sprint 5 — Rapports & KPI ✅ (finished and shipped 01/09)
This was fully written back in April/May but sat **uncommitted on disk
for ~4 months** — never pushed, never deployed, despite earlier project
notes describing it as complete. Found and committed tonight, but not
before fixing several real bugs surfaced while actually testing it
against a live database for the first time:

- [x] `getRapportFinancier` — backend returned `{months, totals}`; the
      frontend reads `totalEntrees`/`totalSorties`/`solde`/`parMois`
      directly off the response. Now returns both shapes, plus a
      `paiements` line-item list the frontend table was already built
      for but the backend never sent.
- [x] `getTauxPresence` / `getTauxReussite` — both returned bare arrays;
      the frontend destructures `{parClasse, parEleve}` /
      `{parFiliere, parClasse}` off an object. Rewrote both to actually
      produce that shape (Présence now also produces a real
      "top absences par élève" list, which didn't exist before).
- [x] `getTauxPresence` filtered `Classe` on `isActive` — a field that
      only exists on `Filiere`, not `Classe`. This made the Présence tab
      500 on every request that didn't pass an explicit `classeId` (i.e.
      the common case). Confirmed via a real request against local data
      before and after the fix.
- [x] Frontend `Rapports.jsx` imported axios from `../lib/axios`, which
      doesn't exist (`../../api/axios` is the real shared instance,
      following every other admin page's convention) — this alone made
      the page fail to build. The corrected import then exposed a
      *second* bug: every call also hardcoded an extra `/api/` prefix on
      top of the shared instance's own `baseURL: '/api'`, which would
      have 404'd as `/api/api/rapports/...` once the import was fixed.
- [x] Reçu paiement PDF: let admin select which paiement (Phase 1.2
      carry-over) — added `paiementId` on `Document` (migration), a
      paiement dropdown in the creation modal, `generatePdf()` uses it
      when set.
- [ ] Open item carried from `docs/ROADMAP.md`: verify the `Financier`
      tab's chart actually looks right against real multi-month
      production data now that the shape mismatch is fixed — the shapes
      match and it returns real data locally, but hasn't been eyeballed
      against production numbers yet.

### Sprint 6 — Paramètres & Documents avancés ✅ (done 01/09, evening)
- [x] Page Paramètres: logo école, couleurs, infos centre —
      `/admin/parametres`, SUPER_ADMIN/DIRECTEUR only, respects the
      centre switcher (edits whichever centre is selected, not always
      the admin's own).
- [x] Logo upload → used in PDF headers (replacing current placeholder)
      — `POST /centres/:id/logo`, PNG/JPEG/WEBP up to 2MB. SVG rejected
      on purpose: pdfkit can't embed vector images without a much
      heavier dependency, so an SVG would silently never show up on a
      PDF. `couleurPrimaire` also now actually drives the PDF header/
      accent color, which it never did before (was hardcoded blue).
      Found + fixed along the way: `generatePdf()`/`getBulletin()`
      resolved "the centre" via `prisma.centre.findFirst()` - always
      whichever centre sorts first, not the document's actual centre.
      Invisible while every centre looked identical; would have been a
      real bug now that branding is real (Rabat documents showing
      Casablanca's logo).
- [x] QR code anti-fraude sur documents officiels — every
      Document-table-backed PDF (attestations, reçus - anything with a
      real `numeroSerie`) gets a QR code linking to a new public
      `GET /documents/verify/:numeroSerie`, landing on a new
      `/verify/:numeroSerie` page. Response is deliberately minimal (no
      full PII) since anyone with the physical paper can scan it.
      Bulletins aren't `Document`-table rows, so they don't get one -
      plain footer, same as before. Found + fixed a real routing bug
      while wiring this: the public route was declared "before" the
      module's `authenticate` hook, which doesn't actually determine
      exemption in Fastify (a hook on a shared parent scope applies to
      children registered on it regardless of source order) - had to
      move it into its own sibling `fastify.register()` scope,
      matching `candidatures.routes.js`'s already-correct pattern.
- [~] Modèles de documents personnalisables — interpreted as "documents
      reflect the school's actual branding" (logo/color/info, the three
      items above), not a separate swappable-layout template editor.
      That reading matches how this sprint was originally scoped
      (logo/couleurs/infos-centre listed right alongside it) - flag if
      a real template editor (multiple layouts, WYSIWYG) was actually
      wanted, that's meaningfully bigger scope than what shipped here.

Verified locally end-to-end for all of the above (uploaded a test
logo, generated a real attestation PDF and confirmed the logo/color
show up correctly, hit the verify endpoint with both a real and a fake
serial). Not yet re-verified against production - deploy this before
trusting it live.

### Unplanned — SUPER_ADMIN centre switcher ✅ (done 01/09, evening)
Was a "Known Issues" tech-debt item below; promoted to a full fix
because the backend already had everything needed. See "Known Issues"
section for detail — moved here since it's now shipped, not debt.
- [x] `centreStore` (Zustand, persisted) + Topbar dropdown, SUPER_ADMIN-only
- [x] Wired into all ~10 centre-scoped controllers' pages
      (absences, caisse, candidatures, classes, eleves, filieres,
      notifications, personnel, rapports, salaires) plus Dashboard
- [x] Create-forms (Classes/Filières/Personnel/Salaires) now default new
      records to the centre being viewed, not always the admin's own
- [x] Found + fixed along the way: `eleves.controller.js`'s SUPER_ADMIN
      branch had no fallback to the admin's own centre (every other
      module does), so the Élèves list had been showing students from
      both centres mixed together with no way to filter it down.
---

## 📋 PHASE 2.2 — Portail Candidat/Étudiant (Sprint 1 shipped 01/09)

### Sprint 1 — Roles & Auth ✅ (done 01/09, deployed + verified end-to-end)
- [x] Add CANDIDAT and ETUDIANT roles to schema
- [x] On candidature submit → auto-create CANDIDAT user account (skips
      gracefully if the email already belongs to a staff/PARENT account)
- [x] Send email with a "set your password" link (Resend, not a temp
      password — reuses the same hashed-token mechanism as forgot-password)
- [x] Candidat/étudiant login page (`/candidat/login`, separate from admin)
- [x] Forgot/reset password flow (rate-limited, account-enumeration-safe,
      single-use tokens, 48h TTL)
- [x] Minimal portal status page (`/portail`) — candidature status for
      CANDIDAT, dossier élève summary for ETUDIANT
- [x] On acceptance/conversion → promote CANDIDAT to ETUDIANT on the same
      account (via `candidatureId` in `ConvertirEleveModal`), not a duplicate
- [x] `/auth/register` now requires SUPER_ADMIN auth — was fully public
- [ ] Minor check during conversion → optionally create PARENT account
      (deferred — no parent email field exists yet; belongs with Portail
      Parents)
- ⚠️ Resend is on the `resend.dev` sandbox domain — only delivers to the
  Resend account owner's own inbox until a real sending domain is verified.
  Confirmed working end-to-end to that inbox; other recipients get a
  logged, non-fatal 422 from Resend (`sendEmail` never throws).
- [x] Production `docker-compose.yml` backend service now has
  `RESEND_API_KEY`/`EMAIL_FROM` wired into its `environment:` block —
  **fixed 03/09**, added next to `FRONTEND_URL` on the live VPS compose
  file directly (`/opt/apps/sgs/docker-compose.yml`), `docker compose up -d
  backend` to recreate, confirmed both vars present via `printenv` inside
  the container and the backend came back up clean. Not yet verified with
  a real end-to-end send (would need a live candidature/reset-password
  flow to trigger one) — do that before assuming delivery actually works,
  not just that the key is present.
- ⚠️ Still on the `resend.dev` sandbox domain — even now that the key is
  wired, delivery is limited to the Resend account owner's own inbox until
  a real sending domain is verified.
### Sprint 2 — Candidat Portal ✅ (done 01/09, deployed + verified end-to-end)
- [x] Candidat dashboard: view candidature status (shipped Sprint 1)
- [x] Document upload on candidature (CIN, diplôme, photo) — 5MB cap,
      PNG/JPEG/WEBP/PDF, stored under `/uploads/candidatures/`
- [x] Messages from secretariat — two-way, staff reply best-effort emails
      the candidat (candidat message doesn't email staff, they're already
      watching the admin panel)
- [x] Status history timeline — merged into the same feed as messages
      (`CandidatureEvenement`, `type: MESSAGE | STATUT_CHANGE`) rather
      than a separate widget, so both show interleaved in order
- Admin side: `CandidaturePanel` in `Candidatures.jsx` now shows received
  documents + the same message thread with a reply box, scoped to
  SUPER_ADMIN/DIRECTEUR/SECRETAIRE for uploading/replying, open to any
  authenticated staff for viewing (matches the existing statut pattern)
- Fixed in passing: `axios.js`'s 401/refresh-failure redirect always sent
  the user to `/admin/login`, even for a CANDIDAT/ETUDIANT session — that
  interceptor is shared by both apps, now checks `user.role` first
### Sprint 3 — Student Portal (ETUDIANT) ✅ (done 01/09, deployed + verified end-to-end)
- [x] ETUDIANT dashboard (notes, absences, emploi du temps, paiements) —
      tabbed view, all read-only
- [x] Document download (attestations, bulletins) — own scoped endpoint
      (`/api/portal/eleve/documents/:id/pdf`), not the staff route reused;
      verified an ETUDIANT gets 404 on another élève's document id
- [x] View emploi du temps for their class
- [x] View and download receipts (paiements list + generated documents)
### Sprint 4 — Candidature Enhancements ✅ (done 01/09, deployed + verified end-to-end)
- [x] Document attachments on candidatures (admin side) — staff can now
      upload too, same endpoint the candidat portal already used
- [x] Welcome email when élève created (credentials + first steps) — a
      "set your password" link for a directly-enrolled élève with no
      prior candidature; an "inscription confirmée" notification (no new
      password) for one promoted from an existing CANDIDAT account
- [x] Conversion rate stat on Candidatures dashboard — accepted ≠
      converted, so this counts candidatures whose account actually made
      it to ETUDIANT, not just ACCEPTEE
- [x] Bulk actions (accept/refuse multiple candidatures) — checkbox
      selection + bulk bar, routes through the same updateStatut() as a
      single change (timeline + candidat email included)
- [x] Export candidatures to Excel — CSV with UTF-8 BOM + `;` delimiter
      (opens correctly in Excel with accents intact), not a real .xlsx —
      no new dependency needed, same approach as the existing FEC/SAGE
      export in rapports.service.js

**Phase 2.2 (Portail Candidat/Étudiant) is now fully shipped — all 4
sprints done and deployed to sgs.nextsi.ma.** One known follow-up, not
blocking: Resend is still on the `resend.dev` sandbox domain, so even
though the API key is now wired into production (fixed 03/09, see Sprint 1
note above), delivery is limited to the Resend account owner's own inbox
until a real sending domain is verified.
---

## 📋 PHASE 2.3 — Programmes & Formations ✅ (fully shipped 01/09)

### Sprint 1 — Types de formation ✅ (done 01/09, deployed + verified end-to-end)
- [x] Add typeFormation to Classe model: JOUR, SOIR, WEEKEND, HYBRIDE, INTENSIF
      — defaults to JOUR, every pre-2.3 class stayed correctly labeled
      with no data migration beyond the column add
- [x] Filter classes by type in admin
- [x] Display type badge on class cards and emploi du temps
- [x] Different time slot defaults per type when adding a créneau (SOIR:
      18h-20h, INTENSIF: 8h-12h, others: 8h-10h — still freely editable
      per créneau, just a saner starting point)
### Sprint 2 — Gestion des créneaux ✅ (done 01/09, deployed + verified end-to-end)
- [x] Emploi du temps aware of formation type — badge + per-format
      créneau time defaults (shipped as part of Sprint 1)
- [x] Time slot templates per formation type — covered by the same
      per-format defaults above; deliberately didn't build a separate
      named-template system on top, would have been over-engineering
- [x] Different pricing per type (fraisScolarite varies by format) — new
      `FormationTarif` model, an optional (filière, format) override with
      fallback to the filière's own `fraisScolarite`. Same status as that
      field: a reference/display value in the admin panel, not wired into
      `PaiementEleve` amounts (those are entered by staff at payment
      time). Editable inline in the filière detail panel, with a reset
      (↺) to fall back to the filière price again.
### Sprint 3 — Reporting par format ✅ (done 01/09, deployed + verified end-to-end)
- [x] Enrollment stats by formation type
- [x] Revenue by formation type
- [x] Capacity utilization per format
- [x] Comparison charts in dashboard — new "Formats" tab in Rapports.jsx:
      3 KPI cards, a dual-axis bar chart (élèves + revenu), detail table

**Phase 2.3 (Programmes & Formations) is now fully shipped — all 3
sprints done and deployed to sgs.nextsi.ma**, same day as Phase 2.2.
---

## ✨ FEATURE ADDITIONS (06/09) — Capacité, import, parent, calendrier

Four features picked from the product-ideas backlog below, done together
in one pass. Verified live against a local dev DB (backend + frontend
both running locally, not sgs.nextsi.ma) via direct service calls, real
HTTP requests (including multipart file upload), and a real browser
session for every UI piece — not deployed to production as part of this
pass; see "Not yet deployed" note at the end of this section.

### Classe capacity alerts ✅
- [x] `checkCapacite()` in `notifications.service.js`, mirrors
      `checkImpayés()` exactly: runs on the same 8am cron (`app.js`),
      groups classes ≥80% of `capaciteMax` by centre, one broadcast
      `CAPACITE` notification per centre per day (same "already sent
      today" dedup as impayés). New `TypeNotification.CAPACITE` enum
      value + icon/color in `Topbar.jsx`/`Notifications.jsx`.
- [x] The visual capacity bar in `Classes.jsx` (color-coded green/amber/
      red) already existed before this pass — this only added the
      *proactive* notification, not a new visual, closing the actual gap
      ("notify admin," not "let admin notice if they look").
- [x] Verified live: forced a real class to 100% (temporarily lowered its
      `capaciteMax`, ran the cron function, confirmed the exact
      notification text and dedup, restored the class, cleaned up the
      test notification).

### Bulk import (Excel) ✅ — Élèves only, Personnel not included
- [x] `POST /eleves/import` (multipart .xlsx) — `eleves.controller.js`
      parses the sheet with `exceljs`, `eleves.service.js`'s
      `importFromRows()` reuses `create()` row-by-row (one code path for
      "how an élève gets created," whether that's the admin form or a
      spreadsheet). Runs sequentially, not `Promise.all` — matricule
      generation reads-then-increments and would race under concurrency,
      and 100+ simultaneous welcome emails isn't something to fire at the
      mailer at once.
- [x] **Chose `exceljs` over `xlsx` (SheetJS) deliberately**: `npm install
      xlsx` reported a new critical vulnerability (unpatched prototype-
      pollution/ReDoS advisories SheetJS never fixed in the npm-published
      package) on exactly the attack surface this feature touches -
      parsing untrusted uploaded files. `exceljs` only added one
      moderate, low-relevance advisory (old transitive `uuid`, used
      internally for ids, not security-sensitive here).
- [x] Case/accent-insensitive column matching (`Prenom`/`prénom`/`PRENOM`
      all match); required columns: Prenom, Nom, Email, DateNaissance,
      Classe (matched by exact name, scoped to the caller's centre - never
      trusts a row to name another centre's class). Optional: Telephone,
      CIN, Adresse, NomParent, TelParent. Per-row failures (bad classe
      name, invalid date, missing required column) don't block the rest
      of the batch - full report shown in the admin modal (`Eleves.jsx`'s
      new "📥 Importer" button).
- [x] Verified live: generated a real .xlsx with `exceljs`, uploaded it
      through the actual HTTP endpoint (not just the service function) -
      valid rows imported with sequential matricules, a bad classe name
      failed independently without blocking the valid rows, a fully-blank
      trailing row was correctly skipped rather than reported as a
      failure. Confirmed in the browser too (modal shows the documented
      column list and a working file picker).
- [ ] Personnel import not built - same `importFromRows` pattern would
      apply, not scoped into this pass. Natural follow-up if needed.

### Parent portal ✅
- [x] New `Eleve.parentUserId` (nullable FK to `Utilisateur`) - one
      column, not a join table, since the common case (one parent account
      seeing all their children) is directly supported by a nullable FK
      on the child side. Doesn't support two separate parent logins for
      the same child (e.g. mother + father each with their own account) -
      would need a join table if that's ever needed.
- [x] `Eleves.jsx` detail panel: "Lier un compte parent" - links an
      existing PARENT account by email, or creates a new one (random
      password, "set your password" welcome email, same mechanism as the
      élève welcome flow) if none exists. Rejects an email already used by
      a non-PARENT account rather than silently repurposing it. Also
      "Délier ce compte parent."
- [x] `portal.service.js` gained a full parent-facing surface
      (`getMyChildren`, `getChildNotes/Absences/EmploiDuTemps/Paiements/
      Documents(+Pdf)`), all eleveId-scoped rather than resolving a single
      implicit record like the ETUDIANT side does — a parent can have more
      than one child. Every function verifies the requested eleveId is
      actually one of the caller's own children first (`assertOwnChild`,
      404 not 403 on a mismatch) before touching any data - same
      "provably can't touch someone else's record" posture as the rest of
      the portal module.
      `PARENT` added to the portal's `authorize()` allow-list and to
      `App.jsx`'s `PortalRoute` - reuses the exact same `/candidat/login`
      page and `/auth/login` endpoint as CANDIDAT/ETUDIANT, no new login
      flow needed.
- [x] `PortailPage.jsx`: a PARENT sees a child-selector (only shown when
      there's more than one child) and the same notes/absences/emploi/
      paiements/documents tab layout as the student portal, just wired to
      the eleveId-scoped endpoints.
- [x] Verified live end-to-end: linked a real parent account to a real
      élève through the actual admin UI, confirmed the eleve's `parent`
      field populates immediately; hit the parent's own `/portal/enfants`
      and `/portal/enfants/:id/notes` endpoints with a real token for that
      account and confirmed correct data; confirmed a parent hitting a
      *different* élève's id gets a 404, not someone else's data.
- [ ] `/admin/portail` sidebar entry ("👨‍👩‍👧 Portail Parents") still shows
      the pre-existing "Bientôt disponible" placeholder - this pass built
      the actual external parent-facing portal and the per-élève linking
      action, not an admin-side overview page listing all parent accounts
      and who they're linked to. The generic `/admin/utilisateurs` page
      already lets an admin filter by `role=PARENT`, just without showing
      linked children - a dedicated overview page is a natural (small)
      follow-up, not done here.

### Academic calendar ✅
- [x] New `EvenementCalendrier` model (`type`: FERIE/VACANCES/EXAMEN/
      AUTRE, `titre`, `dateDebut`, `dateFin`, nullable `centreId` for
      "both campuses" - same convention as `Actualite`/`Evenement`). New
      `calendrier` module (service/controller/routes), registered at
      `/api/calendrier`. Read open to any authenticated staff member,
      write restricted to SUPER_ADMIN/DIRECTEUR - same shape as
      `centres.routes.js`.
- [x] New `Calendrier.jsx` admin page (sidebar: "🎉 Calendrier
      académique," under Pédagogie): inline create form + an
      upcoming/past split list, delete per entry. **Deliberately a flat
      list, not a calendar-grid widget** - the value here is "define and
      see what's coming up," a real month-view calendar UI would be a
      much bigger separate piece of work.
- [x] **Deliberately not wired into Absence validation or emploi du temps
      generation** - marking an absence on a FERIE date, or generating a
      créneau during VACANCES, behaves exactly as before this pass. This
      release defines and displays the calendar; making the rest of the
      app calendar-aware is real follow-up work, not silently bundled in
      here as a behavior change nobody asked for yet.
- [x] Verified live: full CRUD cycle (create/list/update/delete) through
      real HTTP requests, then the actual create form and rendered
      upcoming/past list through the browser UI, with the entry showing
      the correct type badge, date range, and centre label.

**Not yet deployed to sgs.nextsi.ma.** Everything above was built and
verified against local dev only (own local Postgres, local backend/
frontend). Deploying requires the standard `deploy.sh` flow plus running
the new Prisma migration in production
(`20260906145554_feature_additions_capacite_calendrier_parent`) - not run
against the production DB as part of this pass.

---

## 🔮 PHASE 3 — Advanced (In progress)

### Site Vitrine ✅ (done 04/09, deployed + verified end-to-end)
- [x] CMS for actualités and événements (manage from admin) — new
      `Actualite`/`Evenement` Prisma models, `actualites`/`evenements`
      backend modules (public read + SUPER_ADMIN/DIRECTEUR-gated write,
      matching `candidatures.routes.js`'s public/protected split), new
      admin pages under a "SITE VITRINE" sidebar section. `centreId` is
      nullable on both models — null means "both campuses", matching how
      the landing page already presents itself as one shared site rather
      than per-centre.
- [x] Gestion des événements pour affichage vitrine — same module as
      above; public feed only shows published + not-yet-passed events
      (`dateDebut >= today`), soonest first, so past events stay in the
      DB for admin history without cluttering the public agenda.
- [x] Contact form wired to backend — new `MessageContact` model +
      `contact` module (`POST /api/contact` public, same
      schema-validation + `additionalProperties: false` pattern as
      `candidatures/public`). Submitting broadcasts an in-app
      `CONTACT`-type notification to every active centre's staff (new
      admin "Messages" page, badge in the sidebar/topbar like
      Candidatures/Notifications already had). No outbound email to staff
      on submission (in-app notification only) - could add later via
      `mailer.js` if staff want an email copy too, not built.
- [x] SEO optimization — `index.html` had zero meta tags beyond
      `<title>` before this; added description, robots, canonical, OG,
      and Twitter card tags (describing the landing page itself, since
      this is a single-page app - `/admin`, `/candidat`, `/portail` are
      private application routes, not content). New `robots.txt`
      (disallows the private routes) and a one-URL `sitemap.xml`.
      💡 Product idea: no `og:image`/`twitter:image` yet - there's no real
      1200x630 social-share asset, only the vector favicon, and a broken
      image tag looks worse than none. Worth generating one once branding
      assets exist beyond the logo.
- Old hardcoded `ARTICLES`/`EVENTS` arrays in
  `Actualites.jsx`/`Evenements.jsx` (public sections) replaced with real
  API calls; both sections render `null` (not an empty header) when
  nothing's published yet, so the site doesn't show an awkward blank
  "La vie de l'école" section before staff publish a first item.
- Found + fixed in passing: `/admin/utilisateurs` had no entry in
  `Topbar.jsx`'s per-page title map (silently falling back to the
  generic title) - a pre-existing gap from when that page shipped, not
  introduced by this pass.
- Verified end-to-end via a temporary QA admin account (created and
  deleted after testing, not a real credential): published a test
  article and événement, confirmed both render correctly on the public
  landing page with real data; submitted the public Contact form through
  the actual browser UI (not just curl), confirmed the message landed in
  the admin Messages inbox with the right stats/filter behavior, the
  in-app notification broadcast fired for both centres, and "Marquer
  traité" correctly moves a message between the À traiter/Traités tabs.
  All test data (article, événement, message, notifications, QA account)
  deleted after verification - nothing left behind in the DB.

### Unplanned — Cross-centre isolation on single-record endpoints ✅ (fixed 04/09, deployed + verified)
Raised by Younes: "for personnel it should be center isolated no?" Checking
personnel exposed a much bigger issue - the same gap existed almost
everywhere. Every module's `getAll` already scoped its `where` clause by
the caller's own `centreId` (per the multi-centre isolation note in
`CLAUDE.md`), but the single-record `getById`/`update`/`delete`-style
endpoints never checked that the record actually belonged to the caller's
centre at all - any authenticated staff member who knew or could guess a
UUID could read or modify another campus's data. Confirmed live before
fixing (see verification below), not just a theoretical read of the code.
- [x] New shared `src/utils/centreAccess.js` (`assertSameCentre`) - throws
      a 404, not 403, when a record's centre doesn't match the caller's
      (SUPER_ADMIN exempt). 404 rather than 403 is deliberate: telling a
      non-SUPER_ADMIN caller "this exists but isn't yours" would itself
      leak that another centre has a record at that id.
- [x] Fixed across all 8 affected modules:
      - **personnel**: `getById`, `update`, `deactivate`
      - **eleves**: `getById`, `update`, `updateStatut`
      - **classes**: `getById`, `update`, `remove`
      - **absences**: `getById`, `justify`, `remove` (centre derived via
        `eleve.centreId` - Absence has no centreId of its own)
      - **notes**: `getById`, `update`, `remove` (same, via
        `eleve.centreId`)
      - **filieres**: `update`, `remove`, `upsertTarif`, `removeTarif` -
        `getById` itself stays intentionally unchecked, since
        `filieres.routes.js`'s `GET /:id` is genuinely public (landing
        page reads filière info with no auth)
      - **salaires**: `getById`, `payer`
      - **documents**: `getById`, `remove`, `getByEleve`, `generatePdf`
        (centre derived via `eleve.centreId` OR `personnel.centreId` -
        whichever the document is tied to)
- [x] `portal.service.js`'s `getMyEleveDocumentPdf` (ETUDIANT self-service
      document download) left deliberately NOT passing `user` through to
      `documentsService.getById()`/`generatePdf()` - its own existing
      per-élève ownership check (`doc.eleveId !== eleve.id`) is strictly
      tighter than a centre-level check and already covers this path
      correctly. Updated a stale comment there that claimed these
      functions had "NO ownership check" - no longer true, just not the
      relevant check for that caller.
- Verified end-to-end against the live app (not just the code) with two
  temporary DIRECTEUR accounts, one per centre, plus a temporary
  SUPER_ADMIN: a Rabat DIRECTEUR got a real 404 reading AND writing a
  Casablanca personnel record and a Casablanca élève record (confirmed
  broken before the fix, fixed after); a Casablanca DIRECTEUR reading the
  same Casablanca record still got a normal 200; a SUPER_ADMIN based at
  Rabat could still read the Casablanca record, confirming the exemption
  still works. All three test accounts deleted after verification.
- Deployed to production the same session; see `docs/DEPLOYMENT.md`
  deploy process - no migration needed (the fix is authorization logic
  only, not a schema change).

### Unplanned — Centres management admin page ✅ (done 04/09, deployed + verified)
Raised alongside the isolation fix above. The backend already had full
CRUD for centres (`centres.service.js` had `create`/`update`/`remove`/
`updateLogo` from the start) - there was simply no admin page to reach
any of it beyond editing the *currently selected* centre's branding in
Parametres. No way to add a third campus, or find/reactivate a
deactivated one, from the UI at all.
- [x] New `GET /centres/admin/all` (SUPER_ADMIN-only) - `getAll()` stays
      public/active-only as before (the landing page reads it directly,
      unauthed); the admin variant includes inactive centres and a
      per-centre headcount (élèves/personnel). Eleve has a `centreId`
      column but no declared Prisma relation back to `Centre`, so its
      count is a separate `groupBy` merged in, not a `_count.include`
      like personnel/utilisateurs.
- [x] New `/admin/centres` page (SUPER_ADMIN-only, matches the route's own
      gating) - list with headcounts, create modal (nom/slug/ville/
      adresse/téléphone/email, slug auto-generated from nom until
      manually edited), activate/deactivate.
- [x] Found + fixed while wiring the deactivate button: routing it
      through a plain `PUT { isActive: false }` would have quietly let a
      DIRECTEUR deactivate a whole campus - `centres.routes.js`'s `DELETE`
      (which is what actually flips `isActive` off) is deliberately
      SUPER_ADMIN-only, stricter than `PUT`'s SUPER_ADMIN+DIRECTEUR.
      Deactivate now goes through `centresApi.deactivate()` → `DELETE`;
      reactivate stays a `PUT { isActive: true }`, consistent with
      `PUT` already being DIRECTEUR-allowed for any other centre edit.
- Logo/couleur editing deliberately stays in Parametres (scoped to
  whichever centre the switcher has selected) rather than being
  duplicated here - this page is about the list itself.
- Verified end-to-end in the browser: created a real test campus,
  confirmed it appeared with correct auto-slug and 0 headcounts,
  deactivated it and confirmed it dropped out of the public `GET
  /centres` response immediately, reactivated it, then deleted the test
  centre and QA account - nothing left behind.
### Infrastructure & DevOps
- [x] Domain + SSL (sgs.nextsi.ma) — verified live 01/09, `certbot.timer`
      active, cert valid to 2026-11-24. The "auto-renewal broken"
      incident referenced elsewhere in these docs is resolved.
- [ ] Add domain for nextsi.ma company landing page
- [ ] Wildcard SSL (*.nextsi.ma) for future projects
- [ ] CI/CD GitHub Actions (auto-deploy on push) — currently `deploy.sh`,
      run manually
- [ ] Staging environment
- [ ] `deploy.sh` tears the stack down (`docker compose down`) *before*
      confirming the rebuild succeeds - a failed `--build` (hit for real
      04/09, a corrupted Docker builder cache, unrelated to the code)
      leaves the site fully down with no auto-rollback. Should build
      first, confirm success, then swap in. See `docs/DEPLOYMENT.md`'s
      new section for the incident + manual recovery steps used this
      time.
### Security & Compliance
- [x] **User management page** — done 01/09 (unplanned, wasn't on this
      list). New "Utilisateurs" admin page (`/admin/utilisateurs`,
      SUPER_ADMIN + DIRECTEUR view, SUPER_ADMIN-only to change a role or
      deactivate a login) — every login-capable account in one place,
      which previously didn't exist anywhere (Personnel only showed
      staff, nothing showed CANDIDAT/ETUDIANT accounts at all). Still the
      same fixed 8-role model underneath, not per-permission access
      control — see "Something more granular" if that's ever needed.
- [x] **Self-service "Mon compte" (edit info / change password)** — done
      04/09 (unplanned, raised by Younes: "is there a way for a user to
      change his password or informations?" - answer was no, anywhere).
      Only prior path to change a password was the logged-out
      forgot-password email link; no account (staff or CANDIDAT/ETUDIANT)
      could edit its own prénom/nom/téléphone/email at all.
      New `PATCH /auth/me` and `POST /auth/me/password` (any authenticated
      role, no `authorize()` role gate - this only ever touches the
      caller's own account). Password change re-verifies the current
      password server-side (`bcrypt.compare`) rather than trusting a
      valid access token alone - a stolen-but-still-valid token shouldn't
      be enough to lock the real owner out. New shared
      `components/MonCompteModal.jsx`, wired into both the admin Sidebar
      (click the user block at the bottom) and the candidat/étudiant
      portal header ("Mon compte" link) - one component, one set of
      endpoints, both surfaces. Verified end-to-end: changed a real test
      account's password through the actual UI, confirmed login with the
      old password then fails and the new one works; separately confirmed
      via curl that a CANDIDAT-role account can use both endpoints too
      (the portal path shares this component/API, wasn't re-verified
      through its own UI click-through). Test accounts deleted after.
- [ ] 2FA for admin accounts
- [ ] Audit log (who did what and when)
- [ ] GDPR-compliant data export/deletion
- [ ] Session management (active sessions list)
### Integrations
- [ ] SAGE export (licensed by client) — export itself is built (Sprint
      5); this item is about verifying the output against a real
      licensed SAGE install, which only the client can do
- [ ] WhatsApp notifications (popular in Morocco)
- [ ] Payment gateway (CMI, PayZone for online payments)
- [ ] Google Calendar sync for emplois du temps
---

## 🎨 UI/UX Polish (added 01/09, evening)

- [x] **Regroup Sidebar nav by domain, not by dev phase** — done, later
      01/09. Now: PÉDAGOGIE, RESSOURCES HUMAINES, FINANCE & DOCUMENTS,
      ADMISSIONS & COMMUNICATION, RAPPORTS, SYSTÈME. Found + fixed a real
      bug in the same file while at it: the centre indicator read
      `user?.centre?.nom`, a field that has never existed on that object
      (login only returns a flat `centreId`) - it's shown the static
      fallback "Centre" since it was written, with a "Changer ↓" hint
      that did nothing (no `onClick` at all). Now fetches and shows the
      real active centre; the non-functional "Changer" text is gone.
- [x] **Set a real page title** — done, later 01/09. `<title>SGS —
      Gestion Scolaire</title>`, `lang="fr"` (was `"en"` on an
      entirely French-language app).
- [x] **Per-route page titles** — done 01/09 (later pass). New
      `usePageTitle` hook + a longest-prefix route→title map, wired into
      `App.jsx`. "Élèves — SGS", "Candidatures — SGS", etc. instead of
      the same static title everywhere.

---

## 💡 Product Ideas Backlog

- [x] ~~**Candidature conversion rate**~~ — done, Phase 2.2 Sprint 4 (not
      Acceptées/Total as originally scoped here — ACCEPTEE and actually
      converted-to-ETUDIANT are different admin actions, so it counts the
      latter; see that section for why).
- [x] ~~**Welcome email**~~ — done, Phase 2.2 Sprint 4 (élève) and later
      the same day (personnel) — see "Personnel accounts always got role
      PROFESSEUR" under Known Issues for the personnel side.
- [x] ~~**Document QR code**~~ — done, Phase 2 Sprint 6 (anti-fraud
      `/verify/:numeroSerie`).
- [ ] **WhatsApp integration** — absence alerts and payment reminders via WhatsApp
- [~] **Student self-service** — partially done: the ETUDIANT portal
      (Phase 2.2 Sprint 3) lets a student download attestations/bulletins
      staff already generated. Requesting a *new* document be generated,
      without a staff member doing it first, is still not built.
- [ ] **Parent communication log** — track all communications with parents per student
- [ ] **Classe capacity alerts** — notify admin when a class reaches 80%/100% capacity
- [ ] **Financial forecasting** — predict next month's revenue based on enrolled students × frais scolarité
- [ ] **Absence pattern detection** — flag students with >3 consecutive absences automatically
- [ ] **Dark mode** — for night-time administrative work
- [ ] **Multi-language** — Arabic/French toggle (important for Moroccan market)
- [ ] **Mobile app** — React Native wrapper for the admin (reuse existing API)
- [ ] **Offline mode** — cache critical data for use without internet
- [ ] **Bulk import** — import students/personnel from Excel at start of year
- [ ] **Academic calendar** — define holidays, exam periods, semester boundaries
---

## 🐛 Known Issues / Tech Debt

- [x] ~~Found 06/09 while testing - `auth.controller.js`'s
      `refreshHandler` minted the new access token with payload `{ id:
      decoded.id }` only, missing `role`/`centreId` that `loginHandler`
      includes~~ — **fixed 06/09**. New `authService.getActiveUserForRefresh()`
      re-reads the current user fresh from the DB on every refresh (not
      just once at login) and mints the new access token with the full
      `{id, role, centreId}` shape - also rejects with 401 if the account
      was deactivated or deleted since the refresh token was issued,
      which the old code never checked at all. Verified live: crafted a
      real refresh-token cookie and confirmed the new access token's
      decoded payload now carries `role`/`centreId`; crafted one for a
      nonexistent user id and confirmed a clean 401 instead of silently
      minting a token for a ghost account.
- [x] ~~`/api/matieres` inline route in app.js~~ — **fixed 01/09**,
      extracted into its own module (matieres.routes/controller/service).
- [x] ~~Frontend bundle size warning (908KB)~~ — **fixed 01/09**, all
      admin pages are now `React.lazy()`-loaded behind one Suspense
      boundary. Main bundle is 306KB; Recharts (348KB) only loads on
      pages that actually chart something.
- [x] ~~Classes query in frontend doesn't pass centreId~~ — **fixed 01/09
      (evening)**, see "Unplanned — SUPER_ADMIN centre switcher" under
      Phase 2 above. Turned into a full centre-switcher feature, not just
      the Classes page.
- [x] ~~Insert-modal élève/personnel dropdowns leaked other centres, and
      were unusable at 150+ entries~~ — **fixed 04/09**, reported by
      Younes with a screenshot (Absences' "Saisir absence" modal showing
      students from the wrong campus while "SGS Rabat" was selected).
      The 01/09 centre-switcher fix above covered every *list* page, but
      the *insert modals* were a separate blind spot - `AbsenceModal`,
      `PaiementModal` (Caisse), `DocumentModal` (both its élève and
      personnel selectors), `EmploiModal`'s professeur selector, and
      `Emplois`'/`Notes`' own classe lists were all fetching every
      élève/personnel/classe across every centre, ignoring the switcher
      entirely - confirmed live before fixing (a SUPER_ADMIN based at
      Casablanca, viewing Rabat, still saw and could pick Casablanca
      students). Same `centreId: selectedCentreId || undefined` pattern
      added to each. Found + fixed two bare `queryFn: someApi.getAll`
      references in passing (`Emplois.jsx`'s personnel/classes queries,
      `Notes.jsx`'s classes query) - react-query calls a bare queryFn
      with its own internal context object, which was getting forwarded
      straight through as axios query-string params.
      Also addressed the UX complaint alongside it: a 150-student
      alphabetical-by-nothing `<select>` was unusable. New
      `components/ui/SearchSelect.jsx` - a typeahead combobox (click to
      open, type to filter by name, accent-insensitive) - replacing the
      `<select>` in all of the same élève/personnel pickers above.
      Left classe/matière/filière/type dropdowns as plain `<select>` -
      those lists are naturally small per centre and wouldn't benefit.
      Verified end-to-end in the browser: created a temporary Rabat
      student, confirmed a SUPER_ADMIN switched to Rabat sees only that
      student in the Absences modal, switched back to Casablanca and
      confirmed only Casablanca's 8 students appear, and confirmed typing
      "omar" in the search box correctly filters to one match and
      selects it. Test data deleted after.
- [x] ~~No input sanitization on public routes~~ — **fixed 01/09**:
      `candidatures/public` already had a Fastify schema + service-level
      whitelist (Phase 2 Sprint 1). The public `centres`/`filieres` GET
      endpoints were genuinely low-risk (`:id` columns are plain
      `String`, not `@db.Uuid`, so a malformed id was already falling
      through to a clean 404, not a crash) — added `format: uuid`/enum
      schema validation anyway, for an explicit 400 instead of relying on
      that incidental fallback, and because the tarifs `:typeFormation`
      param genuinely *would* have 500'd with a raw Prisma error message
      reaching the caller (that endpoint is staff-only, not public, but
      same fix either way).
- [x] ~~Personnel accounts always got role PROFESSEUR~~ — **fixed 01/09**,
      found while answering a question about access control, not from
      this list. `personnel.service.js`'s `create()` hardcoded every new
      hire's login role to PROFESSEUR regardless of `poste` (free text) -
      confirmed live on real data: several staff (Comptable, Directeur
      adjoint, Secrétaire, Administrateur) all had PROFESSEUR-level
      access. New explicit `role` field (create + update), a "Rôle de
      connexion" selector in `Personnel.jsx`, explicitly separate from
      `poste`. Also closed while here: the fallback password for a
      hire with none set was always the literal string `'sgs2026'` -
      now a random password + the existing "set your password" welcome
      email; and a second bug found live in the UI while verifying this -
      any edit with an empty `salaireBase`/`tauxHoraire` 500'd (Prisma
      rejects `""` for a `Decimal?` column) - `"" -> null` now in both
      `create()` and `update()`.
- [x] ~~`prisma.config.ts.bak` leftover file~~ — checked 01/09, this file
      does not actually exist in the repo (only the real
      `prisma.config.ts` does). Either already cleaned up at some point,
      or this was never accurate. Nothing to do.
- [x] ~~`prisma/migrations/` was gitignored~~ — **fixed 01/09**, and this
      was a live footgun: it silently meant no migration created after
      that `.gitignore` line was added would ever reach git (the 5
      migrations that exist before tonight's are only tracked because
      someone force-added them at some point). Tonight's `paiementId`
      migration would have hit exactly this if not caught.
- [ ] `npm audit` reports 13 vulnerabilities (backend: 3 moderate, 9
      high, 1 critical) and 11 (frontend). Not investigated or triaged
      tonight — `npm audit fix` wasn't run blind since it can introduce
      breaking changes without review. Worth a dedicated pass.
- [ ] `Backend/src/app.js` no longer references `prisma` directly (the
      matieres extraction removed its only use) — confirmed clean, no
      action needed, noted here only because it's the kind of thing that
      looks like a miss at a glance.
---

## 🚨 Process note (01/09)

**~4 months of finished work (this entire Sprint 5) sat uncommitted on
one machine with nothing pushed, and production ran an April 10 commit
this whole time** despite project notes elsewhere describing later
sprints as complete. Nothing was lost this time, but it easily could
have been. Two concrete habits worth adopting going forward:

1. **Commit and push at the end of any session that produces working
   code**, even if it's not deployed yet — uncommitted local work is a
   single-machine failure away from gone.
2. **`git status` before trusting any doc that claims a sprint is
   "complete"** — `docs/ROADMAP.md` and the previous version of this
   file both described Sprint 5 as done well before it was ever
   committed. Docs reflect intent/memory; git history (and, better, what's
   actually deployed) reflects reality.
