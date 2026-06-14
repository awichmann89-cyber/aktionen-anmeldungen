import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

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
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!aktion) {
      return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
    }

    // Tabellenheader
    const headers = [
      'Name',
      ...aktion.optionen.map((o) => o.label),
      'Anmeldedatum',
    ]

    // Tabellenzeilen
    const rows = aktion.anmeldungen.map((a) => {
      const selectedOptionIds = new Set(a.optionen.map((ao) => ao.optionId))
      return [
        a.name,
        ...aktion.optionen.map((o) => (selectedOptionIds.has(o.id) ? 'Ja' : 'Nein')),
        format(new Date(a.createdAt), 'dd.MM.yyyy HH:mm', { locale: de }),
      ]
    })

    // Excel-Workbook erstellen
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

    // Spaltenbreiten setzen
    ws['!cols'] = [
      { wch: 25 },
      ...aktion.optionen.map(() => ({ wch: 15 })),
      { wch: 20 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Teilnehmer')

    const filename = `${aktion.name.replace(/[^a-zA-Z0-9äöüÄÖÜß\s]/g, '_')}_Teilnehmer.xlsx`
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Fehler beim Export' }, { status: 500 })
  }
}
