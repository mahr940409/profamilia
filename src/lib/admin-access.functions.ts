import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
export const adminStatus=createServerFn({method:'GET'}).handler(async()=>{
 if(!process.env['SESSION_SECRET'])return {unlocked:false}
 const {adminSession}=await import('./admin-session.server')
 const session=await adminSession();if(session.data.unlocked===true)return {unlocked:true}
 const {reporterSession}=await import('./reporter-session.server');const reporter=await reporterSession();return {unlocked:reporter.data.isAdmin===true&&reporter.data.mustChangePassword!==true,fullName:reporter.data.fullName}
})
export const unlockAdmin=createServerFn({method:'POST'}).inputValidator(z.object({password:z.string().min(1).max(256)})).handler(async({data})=>{
 const {adminSession,matchesPassword}=await import('./admin-session.server')
 const expected=process.env['SITE_PASSWORD'];if(!expected)throw new Error('El acceso de administrador no está configurado.')
 const session=await adminSession()
 if(!matchesPassword(data.password,expected)){await new Promise(resolve=>setTimeout(resolve,500));return {success:false}}
 await session.update({unlocked:true});return {success:true}
})
export const lockAdmin=createServerFn({method:'POST'}).handler(async()=>{const {adminSession}=await import('./admin-session.server');const session=await adminSession();await session.clear();return {success:true}})
