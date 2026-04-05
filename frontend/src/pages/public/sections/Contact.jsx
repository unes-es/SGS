import { useState } from 'react'

export default function Contact() {
  const [form, setForm]   = useState({ prenom:'', nom:'', email:'', telephone:'', sujet:'Renseignement sur une filière', message:'' })
  const [sent, setSent]   = useState(false)
  const set = (k, v) => setForm(f => ({...f,[k]:v}))

  return (
    <section id="contact" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-14">
          <div className="flex items-center gap-3 text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">
            <span className="w-5 h-0.5 bg-blue-600 rounded"></span>
            Contact
          </div>
          <h2 className="text-4xl font-bold text-gray-900">
            Une question ? <span className="italic font-light text-blue-600">Parlons-en</span>
          </h2>
          <p className="text-gray-500 mt-3">Notre équipe est disponible du lundi au samedi de 8h à 20h.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-14 items-start">

          {/* Info */}
          <div className="space-y-6">
            {[
              { ico:'📞', title:'Téléphone', lines:['Casa : 05 22 00 00 01', 'Rabat : 05 37 00 00 02'] },
              { ico:'📧', title:'Email',     lines:['contact@sgs.ma', 'admissions@sgs.ma'] },
              { ico:'💬', title:'WhatsApp',  lines:['+212 6 00 00 00 03 · Réponse rapide'] },
              { ico:'🕐', title:'Horaires',  lines:['Lun–Ven : 08h00–18h00', 'Samedi : 09h00–13h00'] },
            ].map(c => (
              <div key={c.title} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {c.ico}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm mb-1">{c.title}</div>
                  {c.lines.map(l => (
                    <div key={l} className="text-gray-500 text-sm">{l}</div>
                  ))}
                </div>
              </div>
            ))}

            {/* Social */}
            <div className="pt-4 border-t border-gray-100">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Suivez-nous</div>
              <div className="flex gap-2">
                {['📘 Facebook', '📷 Instagram', '💼 LinkedIn'].map(s => (
                  <button key={s}
                    className="border border-gray-200 text-gray-600 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-gray-50 transition">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-7">
            {sent ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✅</div>
                <div className="font-bold text-gray-900 mb-1">Message envoyé !</div>
                <div className="text-gray-500 text-sm">Nous vous répondrons dans les 24 heures.</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 mb-0.5">Envoyez-nous un message</h3>
                  <p className="text-gray-400 text-sm">Réponse dans les 24 heures</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FI label="Prénom"  value={form.prenom}  onChange={v => set('prenom',v)} />
                  <FI label="Nom"     value={form.nom}     onChange={v => set('nom',v)} />
                </div>
                <FI label="Email *"   value={form.email}   onChange={v => set('email',v)}   type="email" />
                <FI label="Téléphone" value={form.telephone} onChange={v => set('telephone',v)} />
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sujet</label>
                  <select value={form.sujet} onChange={e => set('sujet',e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500">
                    <option>Renseignement sur une filière</option>
                    <option>Inscription / Candidature</option>
                    <option>Frais et paiement</option>
                    <option>Partenariat entreprise</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message *</label>
                  <textarea value={form.message} onChange={e => set('message',e.target.value)}
                    rows={4} placeholder="Votre message..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
                <button
                  onClick={() => { if (form.email && form.message) setSent(true) }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition">
                  📤 Envoyer le message
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function FI({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500" />
    </div>
  )
}