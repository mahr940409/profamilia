import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppHeader } from '@/components/app-header'
import { unlockAdmin } from '@/lib/admin-access.functions'
export const Route=createFileRoute('/auth')({head:()=>({meta:[{title:'Acceso de administrador | Incidentes Profamilia'},{name:'description',content:'Acceso privado para la administración de incidentes Profamilia.'},{property:'og:title',content:'Acceso de administrador | Incidentes Profamilia'},{property:'og:description',content:'Acceso privado y autorizado a los registros.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Auth})
function Auth(){
 const navigate=useNavigate(),queryClient=useQueryClient(),unlock=useServerFn(unlockAdmin);const [password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('')
 async function login(e:FormEvent){e.preventDefault();setError('');if(!password){setError('Ingresa la clave de administrador.');return}setBusy(true);try{const result=await unlock({data:{password}});if(!result.success){setError('Clave incorrecta.');return}setPassword('');await queryClient.invalidateQueries({queryKey:['admin-session']});await navigate({to:'/admin'})}catch{setError('No se pudo verificar la clave. Intenta de nuevo.')}finally{setBusy(false)}}
 return <><AppHeader/><main className="auth-main"><Button asChild variant="link" className="mb-8 px-0"><Link to="/"><ArrowLeft/>Volver al registro</Link></Button><div className="eyebrow"><ShieldCheck size={14}/>Acceso privado</div><h1>Acceso de administrador</h1><form className="auth-form" onSubmit={login}><label className="field-label" htmlFor="password">Clave de administrador</label><Input id="password" type="password" autoComplete="current-password" maxLength={256} value={password} onChange={e=>setPassword(e.target.value)} required/>{error&&<p role="alert" className="message-error">{error}</p>}<Button className="save-button" disabled={busy}>{busy?<Loader2 className="animate-spin"/>:<ShieldCheck/>}{busy?'Verificando…':'Ingresar'}</Button></form></main></>
}
