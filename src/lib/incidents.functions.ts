import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'
import { incidentSchema, catalogSchema, type Incident } from './incident-data'

export const publicCatalogs = createServerFn({ method: 'GET' }).handler(async () => {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!
  const client = createClient<Database>(process.env['SUPABASE_URL']!, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => { const headers = new Headers(init?.headers); if(key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization'); headers.set('apikey',key); return fetch(input,{...init,headers}) } } })
  const [employees, types] = await Promise.all([client.from('employees').select('id,name').order('name'), client.from('incident_types').select('id,name').order('name')])
  if(employees.error || types.error) throw new Error('No se pudieron cargar las opciones. Intenta de nuevo.')
  return { employees: employees.data ?? [], types: types.data ?? [] }
})

export const savePublicIncident = createServerFn({ method: 'POST' }).inputValidator(incidentSchema).handler(async ({data}) => {
  const key=process.env['SUPABASE_PUBLISHABLE_KEY']!
  const client=createClient<Database>(process.env['SUPABASE_URL']!,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const headers=new Headers(init?.headers);if(key.startsWith('sb_') && headers.get('Authorization')===`Bearer ${key}`)headers.delete('Authorization');headers.set('apikey',key);return fetch(input,{...init,headers})}}})
  const {error}=await client.rpc('record_public_incident',{_employee_id:data.employee_id,_incident_type_id:data.incident_type_id})
  if(error) throw new Error('No se pudo guardar. Verifica que las opciones sigan activas e intenta de nuevo.')
  return {success:true}
})

export const adminData = createServerFn({method:'GET'}).handler(async ()=>{
  const {requireAdminSession}=await import('./admin-session.server');await requireAdminSession()
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server')
  const [employees,types]=await Promise.all([supabaseAdmin.from('employees').select('*').order('name'),supabaseAdmin.from('incident_types').select('*').order('name')])
  if(employees.error||types.error)throw new Error('No se pudieron consultar los catálogos.')
  const rows: Incident[]=[]
  for(let offset=0;;offset+=1000){
    const {data,error}=await supabaseAdmin.from('incidents').select('id,employee_id,incident_type_id,created_at,employees(name),incident_types(name)').order('created_at',{ascending:false}).order('id').range(offset,offset+999)
    if(error)throw new Error('No se pudieron consultar los registros.')
    rows.push(...(data??[])); if((data?.length??0)<1000)break
  }
  return {employees:employees.data??[],types:types.data??[],rows}
})

export const saveCatalog = createServerFn({method:'POST'}).inputValidator(catalogSchema).handler(async ({data})=>{
  const {requireAdminSession}=await import('./admin-session.server');await requireAdminSession()
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server')
  const values={name:data.name,active:data.active}
  const result=data.id?await supabaseAdmin.from(data.kind).update(values).eq('id',data.id):await supabaseAdmin.from(data.kind).insert(values)
  if(result.error)throw new Error('No se pudieron guardar los cambios.')
  return {success:true}
})