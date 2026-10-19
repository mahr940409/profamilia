import { useSession, setResponseHeader } from '@tanstack/react-start/server'
import { createHash, timingSafeEqual } from 'node:crypto'

export async function adminSession() {
 const password=process.env['SESSION_SECRET']
 if(!password)throw new Error('El acceso de administrador no está configurado.')
 setResponseHeader('cache-control','no-store')
 const production=process.env['NODE_ENV']==='production'
 return useSession<{unlocked?:boolean}>({password,name:'profamilia-admin',maxAge:60*30,cookie:{httpOnly:true,secure:production,sameSite:'lax',path:'/'}})
}
export function matchesPassword(input:string,expected:string){
 return timingSafeEqual(createHash('sha256').update(input).digest(),createHash('sha256').update(expected).digest())
}
export async function requireAdminSession(){const session=await adminSession();if(session.data.unlocked!==true)throw new Error('Acceso no autorizado. Ingresa la clave de administrador.');return session}
