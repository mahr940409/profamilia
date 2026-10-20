import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, ArrowUpRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { adminStatus } from '@/lib/admin-access.functions'
export function AppHeader(){
 const {data:user}=useQuery({queryKey:['admin-session'],queryFn:async()=>adminStatus(),retry:false})
 return <header className="app-header"><div className="header-inner"><Link to="/" className="brand" aria-label="Profamilia, inicio"><span className="brand-mark"><Plus strokeWidth={3}/></span><span className="brand-name">PROFAMILIA</span></Link><div className="flex items-center gap-3">{user?.fullName&&<span className="text-xs text-muted-foreground">{user.fullName}</span>}<Button asChild variant="outline" className="admin-access"><Link to="/admin"><ShieldCheck/><span>{user?.unlocked?'Panel de administración':'Acceso de administrador'}</span><ArrowUpRight/></Link></Button></div></div></header>
}
