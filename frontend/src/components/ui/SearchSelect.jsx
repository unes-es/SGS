import { useState, useRef, useEffect, useMemo } from 'react'

// Accent-insensitive substring match so "junaid" still finds "Djunaïd" -
// matches the search behavior élèves/personnel already expect from the
// list pages' own search boxes.
const normalize = (s) => (s || '')
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')

// Typeahead replacement for a plain <select> when the option list is long
// (élèves, personnel - can run into the hundreds) - a native dropdown with
// 150+ alphabetically-sorted-by-nothing-in-particular entries makes
// finding one specific person a scroll-and-squint exercise. Same trigger
// UI as a <select> (click to open, shows the current selection), but
// typing filters the list instead of jumping to matching letters.
//
// options: [{ value, label, sublabel? }]. Client-side filtering only -
// fine up to a few hundred options (matches how these lists are already
// fetched, e.g. elevesApi.getAll({ limit: 200 })); would need
// server-side search past that.
export default function SearchSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Rechercher...',
  emptyLabel = 'Aucun résultat',
  disabled = false,
  className = ''
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const selected = options.find(o => o.value === value)

  const filtered = useMemo(() => {
    if (!query.trim()) return options
    const q = normalize(query)
    return options.filter(o =>
      normalize(o.label).includes(q) || normalize(o.sublabel).includes(q)
    )
  }, [options, query])

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    if (disabled) return
    setOpen(true)
    setQuery('')
    // Focus after the input swaps from showing the selected label to the
    // empty search box - without the timeout, focus() fires before the
    // re-render that actually mounts the now-empty, now-editable input.
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleSelect = (option) => {
    onChange(option.value)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        disabled={disabled}
        value={open ? query : (selected?.label || '')}
        onChange={e => setQuery(e.target.value)}
        onFocus={handleOpen}
        onClick={handleOpen}
        placeholder={open ? placeholder : (selected ? '' : placeholder)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
      />
      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2.5 text-sm text-gray-400">{emptyLabel}</div>
          ) : (
            filtered.slice(0, 100).map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => handleSelect(o)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition ${o.value === value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
              >
                <div className="font-medium">{o.label}</div>
                {o.sublabel && <div className="text-xs text-gray-400">{o.sublabel}</div>}
              </button>
            ))
          )}
          {filtered.length > 100 && (
            <div className="px-3 py-1.5 text-xs text-gray-400 border-t border-gray-100">
              {filtered.length - 100} autres résultats — affinez la recherche
            </div>
          )}
        </div>
      )}
    </div>
  )
}
