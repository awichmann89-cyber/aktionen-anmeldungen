import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OptionType } from '@prisma/client'
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

    const incoming: { id?: string; label: string; type?: string }[] = optionen || []

    // Vorhandene Optionen dieser Aktion ermitteln, um Bestehende zu erkennen
    const existing = await prisma.option.findMany({
      where: { aktionId: id },
      select: { id: true },
    })
    const existingIds = new Set(existing.map((e) => e.id))

    // ids, die im neuen Stand bleiben (= vorhandene Optionen, die behalten werden)
    const keepIds = incoming
      .filter((o) => o.id && existingIds.has(o.id))
      .map((o) => o.id as string)

    const aktion = await prisma.$transaction(async (tx) => {
      // Nur wirklich entfernte Optionen löschen (deren Antworten werden bewusst mitgelöscht)
      await tx.option.deleteMany({
        where: { aktionId: id, id: { notIn: keepIds.length > 0 ? keepIds : ['__none__'] } },
      })

      // Bestehende aktualisieren, neue anlegen – Reihenfolge über order
      for (let i = 0; i < incoming.length; i++) {
        const o = incoming[i]
        if (o.id && existingIds.has(o.id)) {
          await tx.option.update({
            where: { id: o.id },
            data: { label: o.label, type: (o.type || 'CHECKBOX') as OptionType, order: i },
          })
        } else {
          await tx.option.create({
            data: { aktionId: id, label: o.label, type: (o.type || 'CHECKBOX') as OptionType, order: i },
          })
        }
      }

      return tx.aktion.update({
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
        },
        include: {
          optionen: { orderBy: { order: 'asc' } },
        },
      })
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
