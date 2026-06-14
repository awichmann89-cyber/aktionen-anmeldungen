'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatDate, formatDateTime, isRegistrationOpen } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, Users, Calendar, Clock, ExternalLink, Trash2, Edit } from 'lucide-react'

interface Aktion {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  anmeldeschluss: string
  slug: string
  _count: { anmeldungen: number }
}

export default function DashboardPage() {
  const [aktionen, setAktionen] = useState<Aktion[]>([])
  const [loading, setLoading] = useState(true)

  async function loadAktionen() {
    try {
      const res = await fetch('/api/admin/aktionen')
      const data = await res.json()
      setAktionen(data)
    } catch {
      toast.error('Fehler beim Laden der Aktionen')
    } finally {
      setLoading(false)
    }
  }

  async function deleteAktion(id: string, name: string) {
    if (!confirm(`Aktion "${name}" wirklich löschen? Alle Anmeldungen gehen verloren.`)) return

    try {
      const res = await fetch(`/api/admin/aktionen/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Aktion gelöscht')
        loadAktionen()
      } else {
        toast.error('Fehler beim Löschen')
      }
    } catch {
      toast.error('Verbindungsfehler')
    }
  }

  useEffect(() => {
    loadAktionen()
  }, [])

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aktionen</h1>
          <p className="text-muted-foreground mt-1">Alle Aktionen verwalten und neue anlegen</p>
        </div>
        <Button asChild>
          <Link href="/admin/dashboard/aktionen/new">
            <Plus className="h-4 w-4" />
            Neue Aktion
          </Link>
        </Button>
      </div>

      <Separator />

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Lade Aktionen...</div>
      ) : aktionen.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-muted-foreground">Noch keine Aktionen angelegt.</p>
          <Button asChild>
            <Link href="/admin/dashboard/aktionen/new">
              <Plus className="h-4 w-4" />
              Erste Aktion anlegen
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {aktionen.map((aktion) => {
            const open = isRegistrationOpen(aktion.anmeldeschluss)
            const publicUrl = `${baseUrl}/anmeldung/${aktion.slug}`

            return (
              <Card key={aktion.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-tight">{aktion.name}</CardTitle>
                    <Badge variant={open ? 'success' : 'secondary'}>
                      {open ? 'Offen' : 'Geschlossen'}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{aktion.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-3">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>
                        {formatDate(aktion.startDate)} – {formatDate(aktion.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>Anmeldeschluss: {formatDateTime(aktion.anmeldeschluss)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 shrink-0" />
                      <span>{aktion._count.anmeldungen} Anmeldung(en)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 pt-1">
                    <Button variant="ghost" size="sm" asChild className="flex-1 text-xs h-8">
                      <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                        Öff. Link
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="flex-1 h-8">
                      <Link href={`/admin/dashboard/aktionen/${aktion.id}`}>
                        <Edit className="h-3 w-3" />
                        Details
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive h-8"
                      onClick={() => deleteAktion(aktion.id, aktion.name)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
