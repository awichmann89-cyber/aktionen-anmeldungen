import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const settings = await prisma.setting.findMany()
    const result: Record<string, string> = {}
    for (const s of settings) result[s.key] = s.value
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { kontaktEmail } = body

    await prisma.setting.upsert({
      where: { key: 'kontaktEmail' },
      update: { value: kontaktEmail || '' },
      create: { key: 'kontaktEmail', value: kontaktEmail || '' },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
  }
}
