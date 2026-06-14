import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { aktionId, name, selectedOptionIds } = body

    if (!aktionId || !name?.trim()) {
      return NextResponse.json({ error: 'Name und Aktion sind Pflichtfelder' }, { status: 400 })
    }

    // Prüfen ob Anmeldeschluss noch nicht überschritten
    const aktion = await prisma.aktion.findUnique({
      where: { id: aktionId },
    })

    if (!aktion) {
      return NextResponse.json({ error: 'Aktion nicht gefunden' }, { status: 404 })
    }

    if (new Date() > new Date(aktion.anmeldeschluss)) {
      return NextResponse.json(
        { error: 'Der Anmeldeschluss ist bereits überschritten' },
        { status: 400 }
      )
    }

    // Anmeldung erstellen
    const anmeldung = await prisma.anmeldung.create({
      data: {
        aktionId,
        name: name.trim(),
        optionen: {
          create: (selectedOptionIds || []).map((optionId: string) => ({ optionId })),
        },
      },
    })

    return NextResponse.json(anmeldung, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Fehler bei der Anmeldung' }, { status: 500 })
  }
}
