import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api/axios'

const TYPE_LABELS = {
  ATTESTATION_SCOLARITE: 'Attestation de scolarité',
  RELEVE_NOTES: 'Relevé de notes',
  RECU_PAIEMENT: 'Reçu de paiement',
  ATTESTATION_TRAVAIL: 'Attestation de travail',
  BULLETIN: 'Bulletin',
  FICHE_PAIE: 'Fiche de paie',
  AUTRE: 'Document',
}

// Public, unauthenticated - reached by scanning the QR code printed on a
// document's footer (see Backend's utils/qr.js / documents.service.js's
// verify()). No login, no PII beyond a first name + last initial - anyone
// with the physical document (or a photo of it) can check it's genuine.
export default function Verify() {
  const { numeroSerie } = useParams()
  const [state, setState] = useState({ loading: true, result: null })

  useEffect(() => {
    let cancelled = false
    api.get(`/documents/verify/${numeroSerie}`)
      .then(res => { if (!cancelled) setState({ loading: false, result: res.data.data }) })
      .catch(() => { if (!cancelled) setState({ loading: false, result: { valid: false } }) })
    return () => { cancelled = true }
  }, [numeroSerie])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        {state.loading ? (
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        ) : state.result?.valid ? (
          <>
            <div className="text-5xl mb-3">✅</div>
            <h1 className="text-lg font-bold text-gray-900">Document authentique</h1>
            <p className="text-sm text-gray-500 mt-1 mb-5">Délivré par SGS</p>
            <div className="text-left space-y-2 text-sm border-t border-gray-100 pt-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Type</span>
                <span className="font-semibold text-gray-900">{TYPE_LABELS[state.result.type] || state.result.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">N° de série</span>
                <span className="font-mono text-gray-900">{state.result.numeroSerie}</span>
              </div>
              {state.result.targetName && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Concerne</span>
                  <span className="font-semibold text-gray-900">{state.result.targetName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Généré le</span>
                <span className="text-gray-900">{new Date(state.result.generatedAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-5xl mb-3">❌</div>
            <h1 className="text-lg font-bold text-gray-900">Document non reconnu</h1>
            <p className="text-sm text-gray-500 mt-1">
              Ce numéro de série ne correspond à aucun document émis par SGS.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
