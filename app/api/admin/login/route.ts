import { NextResponse } from 'next/server'
import { checkAdminPassword, createAdminToken, setAdminCookie } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: 'Passwort fehlt' }, { status: 400 })
    }

    if (!checkAdminPassword(password)) {
      return NextResponse.json({ error: 'Falsches Passwort' }, { status: 401 })
    }

    const token = await createAdminToken()
    await setAdminCookie(token)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
