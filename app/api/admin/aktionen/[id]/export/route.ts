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

    const headers = [
      'Name',
      ...aktion.optionen.map((o) => o.label),
      'Anmeldedatum',
    ]

    const rows = aktion.anmeldungen.map((a) => {
      const responseMap = new Map(a.optionen.map((ao) => [ao.optionId, ao.value]))
      return [
        a.name,
        ...aktion.optionen.map((o) => {
          if (!responseMap.has(o.id)) {
            return o.type === 'CHECKBOX' ? 'Nein' : '–'
          }
          if (o.type === 'TEXT') {
            return responseMap.get(o.id) || '–'
          }
          return 'Ja'
        }),
        format(new Date(a.createdAt), 'dd.MM.yyyy HH:mm', { locale: de }),
      ]
    })

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    ws['!cols'] = [
      { wch: 25 },
      ...aktion.optionen.map((o) => ({ wch: o.type === 'TEXT' ? 30 : 15 })),
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
