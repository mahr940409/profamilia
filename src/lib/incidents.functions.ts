import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'
import { z } from 'zod'
import { incidentSchema, catalogSchema, type Incident } from './incident-data'

export const publicCatalogs = createServerFn({ method: 'GET' }).handler(async () => {
  const { requireReporterSession } = await import('./reporter-session.server')
  const session = await requireReporterSession()
  if (session.data.mustChangePassword) throw new Error('Debes cambiar tu contraseña antes de continuar.')
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!
  const client = createClient<Database>(process.env['SUPABASE_URL']!, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => { const headers = new Headers(init?.headers); if(key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization'); headers.set('apikey',key); return fetch(input,{...init,headers}) } } })
  const [employees, types] = await Promise.all([client.from('employees').select('id,name').order('name'), client.from('incident_types').select('id,name').order('name')])
  if(employees.error || types.error) throw new Error('No se pudieron cargar las opciones. Intenta de nuevo.')
  return { employees: employees.data ?? [], types: types.data ?? [] }
})

export const savePublicIncident = createServerFn({ method: 'POST' }).inputValidator(incidentSchema).handler(async ({data}) => {
  const { requireReporterSession } = await import('./reporter-session.server')
  const session = await requireReporterSession()
  if (session.data.mustChangePassword) throw new Error('Debes cambiar tu contraseña antes de registrar incidentes.')
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { error: insertError } = await supabaseAdmin.from('incidents').insert({ employee_id: data.employee_id, incident_type_id: data.incident_type_id, created_by_user_id: session.data.userId! } as never)
  if (insertError) throw new Error('No se pudo guardar. Verifica que las opciones sigan activas e intenta de nuevo.')
  return { success: true }
/*
  const key=process.env['SUPABASE_PUBLISHABLE_KEY']!
  const client=createClient<Database>(process.env['SUPABASE_URL']!,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const headers=new Headers(init?.headers);if(key.startsWith('sb_') && headers.get('Authorization')===`Bearer ${key}`)headers.delete('Authorization');headers.set('apikey',key);return fetch(input,{...init,headers})}}})
  const {error}=await client.rpc('record_public_incident',{_employee_id:data.employee_id,_incident_type_id:data.incident_type_id})
  if(error) throw new Error('No se pudo guardar. Verifica que las opciones sigan activas e intenta de nuevo.')
  return {success:true}
*/
})

export const adminData = createServerFn({method:'GET'}).handler(async ()=>{
  const {requireAdminSession}=await import('./admin-session.server');await requireAdminSession()
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server')
  const [employees,types]=await Promise.all([supabaseAdmin.from('employees').select('*').order('name'),supabaseAdmin.from('incident_types').select('*').order('name')])
  if(employees.error||types.error)throw new Error('No se pudieron consultar los catálogos.')
  const rows: Incident[]=[]
  for(let offset=0;;offset+=1000){
    const {data,error}=await supabaseAdmin.from('incidents').select('id,employee_id,incident_type_id,created_at,created_by_user_id,employees(name),incident_types(name)').order('created_at',{ascending:false}).order('id').range(offset,offset+999)
    if(error)throw new Error('No se pudieron consultar los registros.')
    rows.push(...(data??[])); if((data?.length??0)<1000)break
  }
  const reporterIds=[...new Set(rows.map(row=>row.created_by_user_id).filter((id):id is string=>Boolean(id)))]
  const reporterResult=reporterIds.length?await supabaseAdmin.from('reporter_profiles' as never).select('user_id,full_name').in('user_id',reporterIds):{data:[],error:null}
  if(reporterResult.error)throw new Error('No se pudieron consultar los reportadores.')
  const reporters=new Map((reporterResult.data as {user_id:string;full_name:string}[]).map(profile=>[profile.user_id,{full_name:profile.full_name}]))
  return {employees:employees.data??[],types:types.data??[],rows:rows.map(row=>({...row,reporter_profiles:row.created_by_user_id?reporters.get(row.created_by_user_id)??null:null}))}
})

export const saveCatalog = createServerFn({method:'POST'}).inputValidator(catalogSchema).handler(async ({data})=>{
  const {requireAdminSession}=await import('./admin-session.server');await requireAdminSession()
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server')
  const values={name:data.name,active:data.active}
  const result=data.id?await supabaseAdmin.from(data.kind).update(values).eq('id',data.id):await supabaseAdmin.from(data.kind).insert(values)
  if(result.error)throw new Error('No se pudieron guardar los cambios.')
  return {success:true}
})

export const deleteCatalog = createServerFn({method:'POST'}).inputValidator(catalogSchema.pick({kind:true,id:true})).handler(async ({data})=>{
  const {requireAdminSession}=await import('./admin-session.server');await requireAdminSession()
  if(!data.id)throw new Error('No se indicó el registro a eliminar.')
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server')
  const result=await supabaseAdmin.from(data.kind).delete().eq('id',data.id)
  if(result.error)throw new Error('No se puede eliminar: puede tener registros asociados.')
  return {success:true}
})

export const deleteIncident = createServerFn({method:'POST'}).inputValidator(z.object({id:z.string().uuid()})).handler(async ({data})=>{
  const {requireAdminSession}=await import('./admin-session.server');await requireAdminSession()
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server')
  const result=await supabaseAdmin.from('incidents').delete().eq('id',data.id)
  if(result.error)throw new Error('No se pudo eliminar el incidente.')
  return {success:true}
})
