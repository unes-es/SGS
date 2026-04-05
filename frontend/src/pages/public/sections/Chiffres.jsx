import { useEffect, useRef, useState } from 'react'

const CHIFFRES = [
  { val: 1200, suffix: '+', label: 'Étudiants formés depuis 2018' },
  { val: 48,   suffix: '',  label: 'Entreprises partenaires' },
  { val: 94,   suffix: '%', label: "Taux d'insertion moyen" },
  { val: 180,  suffix: '+', label: 'Diplômés par an' },
]

function useCountUp(target, active) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    let current = 0
    const step  = target / 60
    const timer = setInterval(() => {
      current = Math.min(current + step, target)
      setCount(Math.floor(current))
      if (current >= target) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [active, target])
  return count
}

function ChiffreItem({ val, suffix, label, active }) {
  const count = useCountUp(val, active)
  return (
    <div className="text-center py-8 px-4 border-r border-white/10 last:border-r-0">
      <div className="text-5xl font-bold text-white leading-none mb-2">
        {count}{suffix}
      </div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  )
}

export default function Chiffres() {
  const [active, setActive] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setActive(true); obs.disconnect() } },
      { threshold: 0.5 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="bg-blue-600 py-4">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {CHIFFRES.map(c => (
            <ChiffreItem key={c.label} {...c} active={active} />
          ))}
        </div>
      </div>
    </div>
  )
}