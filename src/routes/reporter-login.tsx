import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { Loader2, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppHeader } from '@/components/app-header'
import { reporterChangePassword, reporterLogin } from '@/lib/reporter-access.functions'

export const Route = createFileRoute('/reporter-login')({ component: ReporterLogin })
function ReporterLogin() {
  const navigate = useNavigate(), login = useServerFn(reporterLogin), changePassword = useServerFn(reporterChangePassword)
  const [username, setUsername] = useState(''), [password, setPassword] = useState(''), [newPassword, setNewPassword] = useState(''), [needsChange, setNeedsChange] = useState(false), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); setBusy(true); try { const result = await login({ data: { username, password } }); if (result.mustChangePassword) { setNeedsChange(true); return } await navigate({ to: '/' }) } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.') } finally { setBusy(false) } }
  async function updatePassword(event: FormEvent) { event.preventDefault(); setError(''); if (newPassword.length < 8) { setError('La nueva contraseña debe tener al menos 8 caracteres.'); return } setBusy(true); try { await changePassword({ data: { password: newPassword } }); await navigate({ to: '/' }) } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cambiar la contraseña.') } finally { setBusy(false) } }
  return <><AppHeader/><main className="auth-main"><div className="eyebrow"><LogIn size={14}/>Acceso de reportadores</div><h1>{needsChange ? 'Cambia tu contraseña' : 'Ingresar al formulario'}</h1><p>{needsChange ? 'Por seguridad, debes crear una contraseña nueva antes de continuar.' : 'Usa el usuario y la contraseña entregados por el administrador.'}</p>{needsChange ? <form className="auth-form" onSubmit={updatePassword}><label className="field-label" htmlFor="new-password">Nueva contraseña</label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={e=>setNewPassword(e.target.value)} required/>{error&&<p role="alert" className="message-error">{error}</p>}<Button className="save-button" disabled={busy}>{busy?<Loader2 className="animate-spin"/>:<LogIn/>}{busy?'Guardando…':'Continuar'}</Button></form> : <form className="auth-form" onSubmit={submit}><label className="field-label" htmlFor="username">Usuario</label><Input id="username" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} required/><label className="field-label" htmlFor="reporter-password">Contraseña</label><Input id="reporter-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/>{error&&<p role="alert" className="message-error">{error}</p>}<Button className="save-button" disabled={busy}>{busy?<Loader2 className="animate-spin"/>:<LogIn/>}{busy?'Ingresando…':'Ingresar'}</Button></form>}</main></>
}
