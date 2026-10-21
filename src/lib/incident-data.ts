import { z } from 'zod'

export const incidentSchema = z.object({ employee_id: z.string().uuid('Selecciona un empleado.'), incident_type_id: z.string().uuid('Selecciona un incidente.') })
export const catalogSchema = z.object({ kind: z.enum(['employees', 'incident_types']), id: z.string().uuid().optional(), name: z.string().trim().min(1, 'Escribe un nombre.').max(100), active: z.boolean() })
export type Catalog = { id: string; name: string; active?: boolean }
export type Incident = { id: string; employee_id: string; incident_type_id: string; created_at: string; created_by_user_id?: string | null; employees: { name: string } | null; incident_types: { name: string } | null; reporter_profiles: { full_name: string } | null }
export type Filters = { employee: string; type: string; start: string; end: string }
export const todayBogota = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
export function dateBogota(value: string) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value)) }
export function displayDate(value: string) { return new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) }
export function displayTime(value: string) { return new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)) }
export function daysInPeriod(start: string, end: string) { return Math.round((Date.parse(end + 'T12:00:00Z') - Date.parse(start + 'T12:00:00Z')) / 86400000) + 1 }
export function filterIncidents(rows: Incident[], f: Filters) { return rows.filter(r => (!f.employee || r.employee_id === f.employee) && (!f.type || r.incident_type_id === f.type) && dateBogota(r.created_at) >= f.start && dateBogota(r.created_at) <= f.end) }
export function summarize(rows: Incident[], start: string, end: string) {
  const employees = new Map<string, number>(), types = new Map<string, number>()
  for (const r of rows) { const e = r.employees?.name ?? 'Empleado', t = r.incident_types?.name ?? 'Incidente'; employees.set(e, (employees.get(e) ?? 0) + 1); types.set(t, (types.get(t) ?? 0) + 1) }
  return { total: rows.length, daily: rows.length / Math.max(1, daysInPeriod(start, end)), employees: [...employees].map(([name, count]) => ({ name, count })).sort((a,b) => b.count-a.count), types: [...types].map(([name,count]) => ({ name,count,percent: rows.length ? count / rows.length * 100 : 0 })).sort((a,b) => b.count-a.count) }
}
export function breakdownByEmployeeType(rows: Incident[]) {
  const grouped = new Map<string, Map<string, number>>()
  for (const r of rows) {
    const employee = r.employees?.name ?? 'Empleado'
    const type = r.incident_types?.name ?? 'Incidente'
    const types = grouped.get(employee) ?? new Map<string, number>()
    types.set(type, (types.get(type) ?? 0) + 1)
    grouped.set(employee, types)
  }
  return [...grouped].map(([employee, types]) => ({ employee, total: [...types.values()].reduce((sum, count) => sum + count, 0), types: [...types].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count) })).sort((a, b) => b.total - a.total)
}
export function variation(first: number, second: number) { return first === 0 ? null : (second-first)/first*100 }
export function evolution(rows: Incident[], start: string, end: string, group: 'day'|'week'|'month') {
  const buckets = new Map<string, number>()
  const key = (day: string) => { if(group === 'month') return day.slice(0,7); if(group === 'week') { const d = new Date(day+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7)); return d.toISOString().slice(0,10) } return day }
  for(let i=0;i<daysInPeriod(start,end);i++) { const day=new Date(Date.parse(start+'T12:00:00Z')+i*86400000).toISOString().slice(0,10); buckets.set(key(day),0) }
  rows.forEach(r => {const k=key(dateBogota(r.created_at)); buckets.set(k,(buckets.get(k)??0)+1)})
  return [...buckets].map(([name,count])=>({name,count}))
}
