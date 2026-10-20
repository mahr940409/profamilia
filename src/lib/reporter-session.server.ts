import { useSession, setResponseHeader } from '@tanstack/react-start/server'

type ReporterSession = { accessToken?: string; refreshToken?: string; userId?: string; username?: string; fullName?: string; mustChangePassword?: boolean; isAdmin?: boolean }

export async function reporterSession() {
  const password = process.env['SESSION_SECRET']
  if (!password) throw new Error('La sesión no está configurada.')
  setResponseHeader('cache-control', 'no-store')
  return useSession<ReporterSession>({ password, name: 'profamilia-reporter', maxAge: 60 * 60 * 8, cookie: { httpOnly: true, secure: process.env['NODE_ENV'] === 'production', sameSite: 'lax', path: '/' } })
}

export async function requireReporterSession() {
  const session = await reporterSession()
  if (!session.data.userId || !session.data.accessToken) throw new Error('Debes iniciar sesión.')
  return session
}
