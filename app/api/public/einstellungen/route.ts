import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'kontaktEmail' } })
    return NextResponse.json({ kontaktEmail: setting?.value || '' })
  } catch {
    return NextResponse.json({ kontaktEmail: '' })
  }
}
