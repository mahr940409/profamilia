import { createFileRoute } from '@tanstack/react-router'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useState, type FormEvent } from 'react'
import { ClipboardList, UserRound, Save, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppHeader } from '@/components/app-header'
import { SearchableCatalogSelect } from '@/components/searchable-catalog-select'
import { publicCatalogs, savePublicIncident } from '@/lib/incidents.functions'
import { incidentSchema } from '@/lib/incident-data'


const options=queryOptions({queryKey:['public-catalogs'],queryFn:()=>publicCatalogs()})
export const Route=createFileRoute('/')({
 head:()=>({meta:[{title:'Registrar incidente | Incidentes Profamilia'},{name:'description',content:'Registro público de incidentes asociados a empleados de Profamilia.'},{property:'og:title',content:'Incidentes Profamilia'},{property:'og:description',content:'Registro público y seguro de incidentes.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
 loader:({context})=>context.queryClient.ensureQueryData(options),component:Index,
})
function Index(){
 const {data}=useSuspenseQuery(options)
 const save=useServerFn(savePublicIncident)
 const [employee,setEmployee]=useState(''),[type,setType]=useState(''),[saving,setSaving]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(false)
 async function submit(event:FormEvent){event.preventDefault();if(saving)return;setSuccess(false);setError('');const input=incidentSchema.safeParse({employee_id:employee,incident_type_id:type});if(!input.success){setError('Selecciona un incidente y un empleado antes de guardar.');return}setSaving(true);try{await save({data:input.data});setEmployee('');setType('');setSuccess(true)}catch(e){setError(e instanceof Error?e.message:'No se pudo guardar el incidente.')}finally{setSaving(false)}}
 return <><AppHeader/><main className="public-main public-minimal"><div className="public-heading"><h1>Incidentes Profamilia</h1><p>Registra un incidente de manera sencilla y segura.</p></div><div className="public-grid"><form className="incident-form" onSubmit={submit}><div className="form-title"><div className="form-icon"><ClipboardList size={20}/></div><h2>Nuevo incidente</h2></div><div className="form-fields">{success&&<div role="status" className="message-success"><CheckCircle2 size={18}/>Incidente guardado correctamente.</div>}<label className="field-label" htmlFor="employee"><UserRound/>Nombre <span className="field-required">*</span></label><SearchableCatalogSelect id="employee" value={employee} onChange={setEmployee} items={data.employees} placeholder="Escribe para buscar un nombre" disabled={saving}/><div className="field-gap"><label className="field-label" htmlFor="incident"><ClipboardList/>Incidente <span className="field-required">*</span></label><SearchableCatalogSelect id="incident" value={type} onChange={setType} items={data.types} placeholder="Escribe para buscar un incidente" disabled={saving}/></div>{error&&<p role="alert" className="message-error">{error}</p>}<Button type="submit" disabled={saving||!data.employees.length||!data.types.length} className="save-button">{saving?<Loader2 className="animate-spin"/>:<Save/>}{saving?'Guardando…':'Guardar'}</Button></div></form></div></main></>
}
