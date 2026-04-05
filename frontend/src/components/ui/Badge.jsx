const variants = {
  green:  'bg-emerald-50 text-emerald-700',
  red:    'bg-red-50 text-red-600',
  amber:  'bg-amber-50 text-amber-700',
  blue:   'bg-blue-50 text-blue-700',
  violet: 'bg-violet-50 text-violet-700',
  gray:   'bg-gray-100 text-gray-600',
}

export default function Badge({ label, variant = 'gray' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {label}
    </span>
  )
}