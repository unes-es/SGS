import { useState } from 'react'

export default function Hero() {
  const scrollTo = (id) => document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section className="relative min-h-screen bg-gray-950 flex items-center overflow-hidden">

      {/* Grid background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      />

      {/* Orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(30,84,212,.2) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(13,140,130,.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-32 w-full">
        <div className="max-w-2xl">

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 text-xs font-bold px-4 py-2 rounded-full mb-8 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
            Inscriptions ouvertes — Rentrée 2026
          </div>

          {/* Title */}
          <h1 className="text-5xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6">
            Formez-vous pour<br />
            <span className="italic font-light text-yellow-400">les métiers</span><br />
            de demain
          </h1>

          <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-xl">
            BTS et Licences professionnelles à Casablanca et Rabat.
            Une formation d'excellence reconnue, des professeurs expérimentés
            et un réseau d'entreprises partenaires.
          </p>

          {/* CTAs */}
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => scrollTo('#preinscription')}
              className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold px-8 py-4 rounded-xl text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-yellow-500/25">
              ✏️ Déposer ma candidature
            </button>
            <button
              onClick={() => scrollTo('#filieres')}
              className="bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold px-6 py-4 rounded-xl text-sm transition-all">
              📚 Voir les programmes →
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-10 mt-16 pt-10 border-t border-white/08 flex-wrap">
            {[
              { val: '471',  lbl: 'Étudiants actifs' },
              { val: '12',   lbl: 'Filières disponibles' },
              { val: '94%',  lbl: "Taux d'insertion" },
              { val: '8 ans', lbl: "D'existence" },
            ].map(s => (
              <div key={s.lbl}>
                <div className="text-3xl font-bold text-white">{s.val}</div>
                <div className="text-xs text-gray-500 mt-1">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}