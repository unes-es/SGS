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
- [ ] Email notifications (Brevo/Resend) — **status still unconfirmed**,
      check `mailer.js` before assuming this is live. Not touched
      tonight.

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

## 📋 PHASE 2.2 — Portail Candidat/Étudiant (Not started)

### Sprint 1 — Roles & Auth
- [ ] Add CANDIDAT and ETUDIANT roles to schema
- [ ] On candidature submit → auto-create CANDIDAT user account
- [ ] Send email with credentials (matricule + temp password)
- [ ] Candidat login page (separate from admin)
- [ ] On acceptance → convert CANDIDAT to ETUDIANT role
- [ ] Minor check during conversion → optionally create PARENT account
### Sprint 2 — Candidat Portal
- [ ] Candidat dashboard: view candidature status
- [ ] Document upload on candidature (CIN, diplôme, photo)
- [ ] Messages from secretariat
- [ ] Status history timeline
### Sprint 3 — Student Portal (ETUDIANT)
- [ ] ETUDIANT dashboard (notes, absences, emploi du temps, paiements)
- [ ] Document download (attestations, bulletins)
- [ ] View emploi du temps for their class
- [ ] View and download receipts
### Sprint 4 — Candidature Enhancements
- [ ] Document attachments on candidatures (admin side)
- [ ] Welcome email when élève created (credentials + first steps)
- [ ] Conversion rate stat on Candidatures dashboard
- [ ] Bulk actions (accept/refuse multiple candidatures)
- [ ] Export candidatures to Excel
---

## 📋 PHASE 2.3 — Programmes & Formations (Not started)

### Sprint 1 — Types de formation
- [ ] Add typeFormation to Classe model: JOUR, SOIR, WEEKEND, HYBRIDE, INTENSIF
- [ ] Filter classes by type in admin
- [ ] Display type badge on class cards and emploi du temps
- [ ] Different time slot defaults per type (soir: 18h-22h, weekend: 8h-18h)
### Sprint 2 — Gestion des créneaux
- [ ] Emploi du temps aware of formation type
- [ ] Time slot templates per formation type
- [ ] Different pricing per type (fraisScolarite varies by format)
### Sprint 3 — Reporting par format
- [ ] Enrollment stats by formation type
- [ ] Revenue by formation type
- [ ] Capacity utilization per format
- [ ] Comparison charts in dashboard
---

## 🔮 PHASE 3 — Advanced (Not started)

### Site Vitrine
- [ ] CMS for actualités and événements (manage from admin)
- [ ] Gestion des événements pour affichage vitrine
- [ ] SEO optimization
- [ ] Contact form wired to backend
### Infrastructure & DevOps
- [x] Domain + SSL (sgs.nextsi.ma) — verified live 01/09, `certbot.timer`
      active, cert valid to 2026-11-24. The "auto-renewal broken"
      incident referenced elsewhere in these docs is resolved.
- [ ] Add domain for nextsi.ma company landing page
- [ ] Wildcard SSL (*.nextsi.ma) for future projects
- [ ] CI/CD GitHub Actions (auto-deploy on push) — currently `deploy.sh`,
      run manually
- [ ] Staging environment
### Security & Compliance
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

- [ ] **Regroup Sidebar nav by domain, not by dev phase** — `Sidebar.jsx`'s
      `NAV` array currently groups items under `PHASE 1` / `PHASE 2` /
      `PHASE 3` section headers, which reflects *when a feature shipped*,
      not what it's for — meaningless to the school staff actually using
      it. Regroup by nature instead, e.g.: **Académique** (Élèves,
      Absences, Classes, Filières, Emplois du temps, Notes), **RH**
      (Personnel, Salaires), **Finance** (Caisse, Documents),
      **Admissions** (Candidatures, Notifications), **Rapports**
      (Rapports), plus whatever Portail Parents/Site Vitrine/Paramètres
      land under once they exist. Dashboard stays its own top-level item.
- [ ] **Set a real page title** — `frontend/index.html` still has
      `<title>frontend</title>`, the unchanged Vite scaffold default,
      showing literally "frontend" in every browser tab. Should be "SGS"
      or similar (e.g. "SGS — École Supérieure de Gestion et Sciences",
      matching the school name used elsewhere). Worth also considering
      per-route titles at the same time (e.g. "Élèves — SGS") while
      touching this, though that's a separate, larger change (needs a
      title-setting mechanism per route, not just the static HTML tag).

---

## 💡 Product Ideas Backlog

- [ ] **Candidature conversion rate** — stat card: Acceptées/Total on candidatures dashboard
- [ ] **Welcome email** — auto-send credentials when élève or personnel created
- [ ] **Document QR code** — anti-fraud verification for printed documents
- [ ] **WhatsApp integration** — absence alerts and payment reminders via WhatsApp
- [ ] **Student self-service** — students can request attestations directly from their portal
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
- [ ] No input sanitization on public routes — **partially fixed 01/09**:
      `candidatures/public` now has a Fastify schema + service-level
      whitelist (see Phase 2 Sprint 1 above). The public `centres`/
      `filieres` GET endpoints are read-only, so mass-assignment doesn't
      apply there, but they still take no query validation at all — low
      risk, not addressed tonight.
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
