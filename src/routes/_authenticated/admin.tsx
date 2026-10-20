import { createFileRoute } from '@tanstack/react-router'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { adminData } from '@/lib/incidents.functions'
import { AdminPanel } from '@/components/admin-panel'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
const options=queryOptions({queryKey:['admin-data'],queryFn:()=>adminData(),retry:false})
export const Route=createFileRoute('/_authenticated/admin')({head:()=>({meta:[{title:'Administración | Incidentes Profamilia'},{name:'description',content:'Registros, estadísticas, comparativas y catálogos privados de Incidentes Profamilia.'},{property:'og:title',content:'Administración | Incidentes Profamilia'},{property:'og:description',content:'Panel privado de incidentes.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),loader:({context})=>context.queryClient.ensureQueryData(options),component:Admin,errorComponent:({error})=><main className="auth-main"><h1>Acceso restringido</h1><p className="mt-4">{error instanceof Error?error.message:'Tu cuenta no tiene permisos para consultar esta página.'}</p><Button asChild className="mt-6"><Link to="/auth">Volver al acceso</Link></Button></main>})
function Admin(){const {data}=useSuspenseQuery(options);return <AdminPanel data={data}/>}