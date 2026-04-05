import { useState, useEffect } from 'react'

export default function StickyButtons() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(t)
  }, [])

  const scrollToInscr = () =>
    document.querySelector('#preinscription')?.scrollIntoView({ behavior: 'smooth' })

  if (!visible) return null

  return (
    <>
      {/* Sticky CTA */}
      <button
        onClick={scrollToInscr}
        className="fixed bottom-6 right-6 z-50 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold text-sm px-5 py-3.5 rounded-full shadow-xl shadow-yellow-500/30 hover:-translate-y-1 transition-all flex items-center gap-2">
        ✏️ <span className="hidden sm:inline">Candidater maintenant</span>
      </button>

      {/* WhatsApp */}
      <button
        className="fixed bottom-6 left-6 z-50 w-13 h-13 w-12 h-12 bg-green-500 hover:bg-green-400 text-white rounded-full shadow-xl shadow-green-500/30 hover:scale-110 transition-all flex items-center justify-center text-2xl"
        title="WhatsApp">
        💬
      </button>
    </>
  )
}