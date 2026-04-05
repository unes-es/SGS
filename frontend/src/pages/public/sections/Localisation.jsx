const CENTRES_LOC = [
  {
    name:    'SGS Casablanca',
    badge:   '● Ouvert · Lun–Sam 08h–20h',
    badgeColor: 'text-blue-600 bg-blue-50',
    address: '123 Boulevard Hassan II, Maarif, 20000',
    phone:   '05 22 00 00 01',
    email:   'casablanca@sgs.ma',
    bus:     'Bus 7, 15, T1 · Tramway Maarif',
    parking: 'Parking gratuit sur place · 50 places',
  },
  {
    name:    'SGS Rabat',
    badge:   '● Ouvert · Lun–Sam 08h–20h',
    badgeColor: 'text-teal-600 bg-teal-50',
    address: '45 Avenue Mohammed V, Agdal, 10090',
    phone:   '05 37 00 00 02',
    email:   'rabat@sgs.ma',
    bus:     'Tramway T1 Agdal · Bus 3, 11',
    parking: 'Parking public Av. Fal Ould Oumeir à 200m',
  }
]

export default function Localisation() {
  return (
    <section id="localisation" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-14">
          <div className="flex items-center gap-3 text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">
            <span className="w-5 h-0.5 bg-blue-600 rounded"></span>
            Localisation
          </div>
          <h2 className="text-4xl font-bold text-gray-900">
            Trouvez-nous <span className="italic font-light text-blue-600">facilement</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">

          {/* Map placeholder */}
          <div className="h-96 lg:h-full min-h-80 rounded-2xl overflow-hidden border border-gray-200 bg-gray-950 relative">
            {/* Grid */}
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:'linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)',
                backgroundSize:'32px 32px'
              }}/>
            {/* Roads */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute w-px h-full left-[30%] bg-white/10"></div>
              <div className="absolute w-full h-px top-[45%] bg-white/10"></div>
              <div className="absolute w-px h-[70%] left-[55%] top-[15%] bg-white/08"></div>
              <div className="absolute w-[60%] h-px right-0 top-[70%] bg-white/08"></div>
            </div>
            {/* Casablanca pin */}
            <div className="absolute top-[60%] left-[26%] flex flex-col items-center">
              <div className="bg-white rounded-xl px-3 py-2 shadow-lg text-center mb-1.5 min-w-32">
                <div className="text-xs font-bold text-gray-900">📍 SGS Casablanca</div>
                <div className="text-xs text-gray-400">Bd Hassan II</div>
              </div>
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg shadow-blue-500/40"></div>
            </div>
            {/* Rabat pin */}
            <div className="absolute top-[28%] left-[52%] flex flex-col items-center">
              <div className="bg-white rounded-xl px-3 py-2 shadow-lg text-center mb-1.5 min-w-28">
                <div className="text-xs font-bold text-gray-900">📍 SGS Rabat</div>
                <div className="text-xs text-gray-400">Av. Mohammed V</div>
              </div>
              <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow-lg shadow-yellow-500/40"></div>
            </div>
            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white/60">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                Casablanca
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span>
                Rabat
              </div>
            </div>
            <div className="absolute bottom-4 left-4 text-xs text-white/25">Maroc · SGS Network</div>
          </div>

          {/* Info cards */}
          <div className="space-y-5">
            {CENTRES_LOC.map(c => (
              <div key={c.name}
                className="border border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🏫</div>
                  <div>
                    <div className="font-bold text-gray-900 text-base">{c.name}</div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badgeColor}`}>{c.badge}</span>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { ico:'📍', val: c.address },
                    { ico:'📞', val: c.phone,   link: true },
                    { ico:'📧', val: c.email,   link: true },
                    { ico:'🚌', val: c.bus },
                    { ico:'🅿️', val: c.parking },
                  ].map(r => (
                    <div key={r.val} className="flex items-start gap-3 text-sm text-gray-600">
                      <span className="flex-shrink-0 text-base">{r.ico}</span>
                      <span className={r.link ? 'text-blue-600 font-semibold' : ''}>{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}