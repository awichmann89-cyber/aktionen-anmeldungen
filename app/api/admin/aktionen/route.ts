import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

export async function GET() {
  try {
    const aktionen = await prisma.aktion.findMany({
      include: {
        optionen: { orderBy: { order: 'asc' } },
        _count: { select: { anmeldungen: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(aktionen)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, startDate, endDate, anmeldeschluss, optionen } = body

    if (!name || !description || !startDate || !endDate || !anmeldeschluss) {
      return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 })
    }

    const slug = nanoid(10)

    const aktion = await prisma.aktion.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        anmeldeschluss: new Date(anmeldeschluss),
        slug,
        optionen: {
          create: (optionen || []).map(
            (o: { label: string; type: string }, i: number) => ({
              label: o.label,
              type: o.type || 'CHECKBOX',
              order: i,
            })
          ),
        },
      },
      include: {
        optionen: { orderBy: { order: 'asc' } },
      },
    })

    return NextResponse.json(aktion, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 })
  }
}
