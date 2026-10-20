import { ChevronDown, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Catalog } from '@/lib/incident-data'

export function SearchableCatalogSelect({ id, value, onChange, items, placeholder, disabled = false }: { id: string; value: string; onChange: (v: string) => void; items: Catalog[]; placeholder: string; disabled?: boolean }) {
  const selected = items.find(item => item.id === value)
  const [text, setText] = useState(selected?.name ?? '')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => setText(selected?.name ?? ''), [selected?.name])
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const filtered = items.filter(item => item.name.toLowerCase().includes(text.toLowerCase()))
  return <div className={`searchable-select${open ? ' is-open' : ''}`} ref={ref}>
    <div className="catalog-input-wrap">
      <input id={id} className="catalog-search" value={text} placeholder={placeholder} disabled={disabled} autoComplete="off"
        aria-controls={`${id}-options`} aria-expanded={open} role="combobox"
        onFocus={() => setOpen(true)} onChange={event => { setText(event.target.value); onChange(''); setOpen(true) }} />
      {text && !disabled ? <button type="button" className="catalog-clear" aria-label="Limpiar selección" onClick={() => { setText(''); onChange(''); setOpen(true) }}><X size={16}/></button> : <ChevronDown className="catalog-chevron" size={18} aria-hidden="true" />}
    </div>
    {open && !disabled && <div className="catalog-options" role="listbox">
      {filtered.length ? filtered.map(item => <button type="button" role="option" aria-selected={item.id === value} key={item.id}
        onClick={() => { onChange(item.id); setText(item.name); setOpen(false) }}>{item.name}</button>) : <span className="catalog-empty">No hay opciones coincidentes</span>}
    </div>}
  </div>
}
