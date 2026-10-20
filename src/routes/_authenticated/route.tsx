import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { adminStatus } from '@/lib/admin-access.functions'
export const Route=createFileRoute('/_authenticated')({beforeLoad:async()=>{const status=await adminStatus();if(!status.unlocked)throw redirect({to:'/reporter-login'})},component:Outlet})
