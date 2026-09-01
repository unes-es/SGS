import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Per-route page titles (BACKLOG.md UI/UX Polish - the static <title> in
// index.html only ever showed "SGS — Gestion Scolaire" everywhere,
// admin included; this is the "actual title-setting mechanism per route"
// that was flagged as separate, larger scope at the time.
//
// Matched by longest-prefix so a param'd route (e.g. /reset-password/:token)
// doesn't need its own literal entry - "/reset-password" already covers it.
// Keep this list in path-order isn't required; longest-match wins regardless.
const TITLES = {
  '/':                    'Accueil',
  '/admin/login':         'Connexion',
  '/candidat/login':      'Espace Candidat',
  '/forgot-password':     'Mot de passe oublié',
  '/reset-password':      'Réinitialiser le mot de passe',
  '/portail':             'Mon espace',
  '/verify':              'Vérification de document',

  '/admin':               'Tableau de bord',
  '/admin/eleves':        'Élèves',
  '/admin/absences':      'Absences',
  '/admin/classes':       'Classes',
  '/admin/notes':         'Notes',
  '/admin/personnel':     'Personnel',
  '/admin/caisse':        'Caisse',
  '/admin/documents':     'Documents',
  '/admin/filieres':      'Filières',
  '/admin/salaires':      'Salaires',
  '/admin/emplois':       'Emplois du temps',
  '/admin/candidatures':  'Candidatures',
  '/admin/notifications': 'Notifications',
  '/admin/portail':       'Portail Parents',
  '/admin/vitrine':       'Site Vitrine',
  '/admin/parametres':    'Paramètres',
  '/admin/rapports':      'Rapports & KPI',
}

function titleFor(pathname) {
  // Exact match first (covers "/admin" and "/" without a trailing-slash
  // prefix match swallowing them), then longest-prefix among the rest.
  if (TITLES[pathname]) return TITLES[pathname]

  let best = null
  for (const path of Object.keys(TITLES)) {
    if (path !== '/' && pathname.startsWith(path + '/') && (!best || path.length > best.length)) {
      best = path
    }
  }
  return best ? TITLES[best] : null
}

export default function usePageTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    const label = titleFor(pathname)
    document.title = label ? `${label} — SGS` : 'SGS — Gestion Scolaire'
  }, [pathname])
}
