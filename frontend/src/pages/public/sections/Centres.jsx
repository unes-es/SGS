import { useState } from 'react'

const CENTRES = [
  {
    name:     'SGS Casablanca',
    badge:    'Siège principal',
    address:  '123 Boulevard Hassan II, Maarif, 20000',
    phone:    '05 22 00 00 01',
    email:    'contact@sgs-casa.ma',
    founded:  2018,
    students: 284,
    teachers: 22,
    filieres: 4,
    color:    'from-blue-950 to-teal-950',
    accent:   'text-blue-400',
    glyph:    '🏙️',
    chips:    ['BTS Informatique', 'Licence Gestion', 'BTS Commerce', 'Lic. Mécatronique'],
  },
  {
    name:     'SGS Rabat',
    badge:    'Campus Agdal',
    address:  '45 Avenue Mohammed V, Agdal, 10090',
    phone:    '05 37 00 00 02',
    email:    'contact@sgs-rabat.ma',
    founded:  2022,
    students: 187,
    teachers: 15,
    filieres: 3,
    color:    'from-violet-950 to-rose-950',
    accent:   'text-violet-400',
    glyph:    '🏛️',
    chips:    ['BTS Informatique', 'Licence Gestion', 'BTS Commerce'],
  }
]

export default function Centres() {
  const [modal, setModal] = useState(null)

  return (
    <section id="centres" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="mb-14">
          <div className="flex items-center gap-3 text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">
            <span className="w-5 h-0.5 bg-blue-600 rounded"></span>
            Nos Centres
          </div>
          <h2 className="text-4xl font-bold text-gray-900 leading-tight">
            Deux campus au cœur<br />
            <span className="italic font-light text-blue-600">du Maroc économique</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {CENTRES.map(c => (
            <div key={c.name}
              onClick={() => setModal(c)}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden cursor-pointer group hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">

              {/* Image area */}
              <div className={`h-48 bg-gradient-to-br ${c.color} relative flex items-center justify-center`}>
                <div className="text-[80px] opacity-10 select-none">{c.glyph}</div>
                <div className="absolute bottom-4 left-5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"></span>
                  <span className="text-white text-sm font-semibold">{c.name}</span>
                </div>
                <div className="absolute top-4 right-4 bg-yellow-500 text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full">
                  {c.badge}
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <div className="text-gray-500 text-sm flex items-center gap-1.5 mb-5">
                  📍 {c.address}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 py-4 border-y border-gray-100 mb-5">
                  {[
                    { val: c.students, lbl: 'Étudiants' },
                    { val: c.filieres, lbl: 'Filières' },
                    { val: c.teachers, lbl: 'Profs' },
                    { val: c.founded,  lbl: 'Fondé' },
                  ].map(s => (
                    <div key={s.lbl} className="text-center">
                      <div className="text-lg font-bold text-gray-900">{s.val}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{s.lbl}</div>
                    </div>
                  ))}
                </div>

                {/* Chips */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {c.chips.map(ch => (
                    <span key={ch} className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {ch}
                    </span>
                  ))}
                </div>

                <button className="w-full bg-gray-900 hover:bg-blue-600 text-white text-sm font-bold py-3 rounded-xl transition-colors">
                  Découvrir ce centre →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Centre modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className={`h-32 bg-gradient-to-br ${modal.color} flex items-center justify-center text-5xl`}>
              {modal.glyph}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{modal.name}</h3>
              <p className="text-gray-400 text-sm mb-5">{modal.badge} · Fondé en {modal.founded}</p>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { val: modal.students, lbl: 'Étudiants' },
                  { val: modal.teachers, lbl: 'Professeurs' },
                  { val: modal.filieres, lbl: 'Filières' },
                ].map(s => (
                  <div key={s.lbl} className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-gray-900">{s.val}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{s.lbl}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <div>📍 {modal.address}</div>
                <div>📞 {modal.phone}</div>
                <div>📧 {modal.email}</div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setModal(null)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                  Fermer
                </button>
                <button
                  onClick={() => { setModal(null); document.querySelector('#preinscription')?.scrollIntoView({ behavior:'smooth' }) }}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-500 transition">
                  S'inscrire →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}