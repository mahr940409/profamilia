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
  return <div className="searchable-select" ref={ref}>
    <input id={id} className="catalog-search" value={text} placeholder={placeholder} disabled={disabled} autoComplete="off"
      onFocus={() => setOpen(true)} onChange={event => { setText(event.target.value); onChange(''); setOpen(true) }} />
    {open && !disabled && <div className="catalog-options" role="listbox">
      {filtered.length ? filtered.map(item => <button type="button" role="option" aria-selected={item.id === value} key={item.id}
        onClick={() => { onChange(item.id); setText(item.name); setOpen(false) }}>{item.name}</button>) : <span className="catalog-empty">No hay opciones coincidentes</span>}
    </div>}
  </div>
}
