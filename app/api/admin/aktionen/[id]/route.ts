import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fromZonedTime } from 'date-fns-tz'
import { TZ } from '@/lib/utils'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const aktion = await prisma.aktion.findUnique({
      where: { id },
      include: {
        optionen: { orderBy: { order: 'asc' } },
        anmeldungen: {
          include: {
            optionen: { include: { option: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!aktion) {
      return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json(aktion)
  } catch {
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, startDate, endDate, anmeldeschluss, imageUrl, maxTeilnehmer, minAlter, maxAlter, optionen } = body

    await prisma.option.deleteMany({ where: { aktionId: id } })

    const aktion = await prisma.aktion.update({
      where: { id },
      data: {
        name,
        description,
        startDate: fromZonedTime(startDate, TZ),
        endDate: fromZonedTime(endDate, TZ),
        anmeldeschluss: fromZonedTime(anmeldeschluss, TZ),
        imageUrl: imageUrl ?? null,
        maxTeilnehmer: maxTeilnehmer ? Number(maxTeilnehmer) : null,
        minAlter: minAlter != null ? Number(minAlter) : 9,
        maxAlter: maxAlter != null ? Number(maxAlter) : 16,
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

    return NextResponse.json(aktion)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.aktion.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 })
  }
}
