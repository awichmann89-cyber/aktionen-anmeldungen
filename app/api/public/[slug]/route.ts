import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    const aktion = await prisma.aktion.findUnique({
      where: { slug },
      include: {
        optionen: { orderBy: { order: 'asc' } },
      },
    })

    if (!aktion) {
      return NextResponse.json({ error: 'Aktion nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json(aktion)
  } catch {
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
