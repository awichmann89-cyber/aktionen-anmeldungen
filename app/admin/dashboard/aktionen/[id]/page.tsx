'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatDate, formatDateTime, formatDateTimeInput, isRegistrationOpen } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Download,
  Copy,
  Check,
  Users,
  ExternalLink,
} from 'lucide-react'

interface Option {
  id: string
  label: string
  order: number
}

interface AnmeldungOption {
  optionId: string
  option: Option
}

interface Anmeldung {
  id: string
  name: string
  createdAt: string
  optionen: AnmeldungOption[]
}

interface Aktion {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  anmeldeschluss: string
  slug: string
  optionen: Option[]
  anmeldungen: Anmeldung[]
}

export default function AktionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [aktion, setAktion] = useState<Aktion | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'edit' | 'participants'>('edit')

  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    anmeldeschluss: '',
  })
  const [optionen, setOptionen] = useState<string[]>([])

  async function loadAktion() {
    try {
      const res = await fetch(`/api/admin/aktionen/${id}`)
      if (!res.ok) throw new Error()
      const data: Aktion = await res.json()
      setAktion(data)
      setForm({
        name: data.name,
        description: data.description,
        startDate: formatDateTimeInput(data.startDate),
        endDate: formatDateTimeInput(data.endDate),
        anmeldeschluss: formatDateTimeInput(data.anmeldeschluss),
      })
      setOptionen(data.optionen.map((o) => o.label))
    } catch {
      toast.error('Fehler beim Laden der Aktion')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAktion()
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const validOptionen = optionen.filter((o) => o.trim() !== '')
      const res = await fetch(`/api/admin/aktionen/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, optionen: validOptionen }),
      })
      if (res.ok) {
        toast.success('Aktion gespeichert')
        loadAktion()
      } else {
        toast.error('Fehler beim Speichern')
      }
    } catch {
      toast.error('Verbindungsfehler')
    } finally {
      setSaving(false)
    }
  }

  function copyPublicLink() {
    if (!aktion) return
    const base = window.location.origin
    navigator.clipboard.writeText(`${base}/anmeldung/${aktion.slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Link kopiert!')
  }

  async function handleExport() {
    const res = await fetch(`/api/admin/aktionen/${id}/export`)
    if (!res.ok) {
      toast.error('Fehler beim Export')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${aktion?.name || 'Teilnehmer'}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="text-muted-foreground py-12 text-center">Lade...</div>
  }
  if (!aktion) {
    return <div className="py-12 text-center text-destructive">Aktion nicht gefunden</div>
  }

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/anmeldung/${aktion.slug}`
  const isOpen = isRegistrationOpen(aktion.anmeldeschluss)

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{aktion.name}</h1>
            <Badge variant={isOpen ? 'success' : 'secondary'}>
              {isOpen ? 'Anmeldung offen' : 'Anmeldeschluss überschritten'}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {aktion.anmeldungen.length} Anmeldung(en) · Anmeldeschluss:{' '}
            {formatDateTime(aktion.anmeldeschluss)}
          </p>
        </div>
      </div>

      {/* Public link bar */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-3 flex items-center gap-3">
          <div className="flex-1 text-sm text-blue-800 font-mono truncate">{publicUrl}</div>
          <Button size="sm" variant="outline" onClick={copyPublicLink} className="shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Kopiert' : 'Link kopieren'}
          </Button>
          <Button size="sm" variant="outline" asChild className="shrink-0">
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab('edit')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            tab === 'edit'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Aktion bearbeiten
        </button>
        <button
          onClick={() => setTab('participants')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
            tab === 'participants'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Teilnehmer ({aktion.anmeldungen.length})
        </button>
      </div>

      {tab === 'edit' && (
        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Grunddaten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name der Aktion *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Beschreibung *</Label>
                <Textarea
                  className="min-h-[100px]"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Termine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Startdatum & -zeit *</Label>
                  <Input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Enddatum & -zeit *</Label>
                  <Input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Anmeldeschluss *</Label>
                <Input
                  type="datetime-local"
                  value={form.anmeldeschluss}
                  onChange={(e) => setForm((f) => ({ ...f, anmeldeschluss: e.target.value }))}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Anmeldeoptionen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Achtung: Optionen werden beim Speichern neu erstellt. Bestehende Anmeldungen
                behalten ihre Auswahl.
              </p>
              <Separator />
              {optionen.length === 0 && (
                <p className="text-sm text-muted-foreground italic">Keine Optionen definiert</p>
              )}
              {optionen.map((option, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${i + 1}`}
                    value={option}
                    onChange={(e) =>
                      setOptionen((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setOptionen((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-destructive hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOptionen((prev) => [...prev, ''])}
              >
                <Plus className="h-4 w-4" />
                Option hinzufügen
              </Button>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Wird gespeichert...' : 'Änderungen speichern'}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/dashboard">Zurück</Link>
            </Button>
          </div>
        </form>
      )}

      {tab === 'participants' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {aktion.anmeldungen.length} Anmeldung(en) gesamt
            </p>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Als Excel exportieren
            </Button>
          </div>

          {aktion.anmeldungen.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              Noch keine Anmeldungen
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    {aktion.optionen.map((o) => (
                      <TableHead key={o.id} className="text-xs">
                        {o.label}
                      </TableHead>
                    ))}
                    <TableHead>Angemeldet am</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aktion.anmeldungen.map((a) => {
                    const selectedIds = new Set(a.optionen.map((ao) => ao.optionId))
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        {aktion.optionen.map((o) => (
                          <TableCell key={o.id}>
                            {selectedIds.has(o.id) ? (
                              <Badge variant="success">Ja</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">Nein</span>
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDateTime(a.createdAt)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
