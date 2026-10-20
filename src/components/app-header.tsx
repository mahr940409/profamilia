import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, ArrowUpRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { adminStatus } from '@/lib/admin-access.functions'
export function AppHeader(){
 const {data:user}=useQuery({queryKey:['admin-session'],queryFn:async()=>{const status=await adminStatus();return status.unlocked},retry:false})
 return <header className="app-header"><div className="header-inner"><Link to="/" className="brand" aria-label="Incidentes Profamilia, inicio"><span className="brand-mark"><Plus strokeWidth={3}/></span><span className="brand-name">profamilia<span>Gestión de incidentes</span></span></Link><Button asChild variant="outline" className="admin-access"><Link to={user?'/admin':'/auth'}><ShieldCheck/><span>{user?'Panel de administración':'Acceso de administrador'}</span><ArrowUpRight/></Link></Button></div></header>
}