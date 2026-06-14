import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'fallback-secret-please-set-env-var-in-production'
)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('admin_token')?.value

  const isAuthenticated = token
    ? await jwtVerify(token, SECRET)
        .then(() => true)
        .catch(() => false)
    : false

  if (pathname.startsWith('/admin/dashboard') || pathname.startsWith('/api/admin')) {
    if (!isAuthenticated) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
      }
      const loginUrl = new URL('/admin', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/api/admin/:path*'],
}
