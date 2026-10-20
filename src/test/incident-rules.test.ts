import { describe,it,expect } from 'vitest'
import { variation, summarize, daysInPeriod, dateBogota, filterIncidents, evolution, incidentSchema, type Incident } from '@/lib/incident-data'
const row:Incident={id:'1',employee_id:'e1',incident_type_id:'t1',created_at:'2026-10-16T02:37:00Z',employees:{name:'Juan Pérez'},incident_types:{name:'Digitó mal la EPS'}}
describe('Reglas de incidentes',()=>{
 it('calcula la variación como segundo menos primero sobre primero',()=>expect(variation(10,15)).toBe(50))
 it('no calcula una variación con período inicial cero',()=>expect(variation(0,5)).toBeNull())
 it('incluye días sin incidentes en el promedio',()=>expect(summarize([row],'2026-10-01','2026-10-10').daily).toBe(0.1))
 it('cuenta ambos extremos del período',()=>expect(daysInPeriod('2026-10-01','2026-10-10')).toBe(10))
 it('muestra los registros en America/Bogota',()=>expect(dateBogota(row.created_at)).toBe('2026-10-15'))
 it('filtra por día colombiano y ambos catálogos',()=>{expect(filterIncidents([row],{employee:'e1',type:'t1',start:'2026-10-15',end:'2026-10-15'})).toHaveLength(1);expect(filterIncidents([row],{employee:'e2',type:'t1',start:'2026-10-15',end:'2026-10-15'})).toHaveLength(0)})
 it('no fabrica incidentes cuando el período está vacío',()=>expect(summarize([],'2026-10-01','2026-10-10').total).toBe(0))
 it('incluye días con cero en la evolución',()=>expect(evolution([row],'2026-10-14','2026-10-15','day')).toEqual([{name:'2026-10-14',count:0},{name:'2026-10-15',count:1}]))
 it('exige seleccionar ambos campos',()=>expect(incidentSchema.safeParse({employee_id:'',incident_type_id:''}).success).toBe(false))
})