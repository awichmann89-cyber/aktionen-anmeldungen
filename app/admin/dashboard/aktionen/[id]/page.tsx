'use client'

export const dynamic = 'force-dynamic'

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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft, Plus, Trash2, Download, Copy, Check,
  Users, ExternalLink, CheckSquare, Type,
} from 'lucide-react'
import { ImageUpload } from '@/components/image-upload'
import { DateTimeInput } from '@/components/datetime-input'
import Image from 'next/image'

type OptionType = 'CHECKBOX' | 'TEXT'

interface Option {
  id: string
  label: string
  type: OptionType
  order: number
}

interface OptionEntry {
  id: string
  label: string
  type: OptionType
}

interface AnmeldungOption {
  optionId: string
  value: string | null
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
  imageUrl: string | null
  maxTeilnehmer: number | null
  minAlter: number
  maxAlter: number
  optionen: Option[]
  anmeldungen: Anmeldung[]
}

function createOptionEntry(): OptionEntry {
  return { id: crypto.randomUUID(), label: '', type: 'CHECKBOX' }
}

export default function AktionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [aktion, setAktion] = useState<Aktion | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'edit' | 'participants'>('edit')

  const [form, setForm] = useState({
    name: '', description: '', startDate: '', endDate: '', anmeldeschluss: '',
    maxTeilnehmer: '', minAlter: '9', maxAlter: '16',
  })
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [optionen, setOptionen] = useState<OptionEntry[]>([])

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
        maxTeilnehmer: data.maxTeilnehmer != null ? String(data.maxTeilnehmer) : '',
        minAlter: String(data.minAlter ?? 9),
        maxAlter: String(data.maxAlter ?? 16),
      })
      setImageUrl(data.imageUrl ?? null)
      setOptionen(
        data.optionen.map((o) => ({ id: o.id, label: o.label, type: o.type }))
      )
    } catch {
      toast.error('Fehler beim Laden der Aktion')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAktion() }, [id])

  function updateOption(optId: string, changes: Partial<OptionEntry>) {
    setOptionen((prev) => prev.map((o) => (o.id === optId ? { ...o, ...changes } : o)))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const validOptionen = optionen.filter((o) => o.label.trim() !== '')
      const res = await fetch(`/api/admin/aktionen/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          imageUrl,
          maxTeilnehmer: form.maxTeilnehmer ? Number(form.maxTeilnehmer) : null,
          minAlter: Number(form.minAlter),
          maxAlter: Number(form.maxAlter),
          optionen: validOptionen.map((o) => ({ label: o.label, type: o.type })),
        }),
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
    navigator.clipboard.writeText(`${window.location.origin}/anmeldung/${aktion.slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Link kopiert!')
  }

  async function handleExport() {
    const res = await fetch(`/api/admin/aktionen/${id}/export`)
    if (!res.ok) { toast.error('Fehler beim Export'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${aktion?.name || 'Teilnehmer'}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="text-muted-foreground py-12 text-center">Lade...</div>
  if (!aktion) return <div className="py-12 text-center text-destructive">Aktion nicht gefunden</div>

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/anmeldung/${aktion.slug}`
  const isOpen = isRegistrationOpen(aktion.anmeldeschluss)

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
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
        {(['edit', 'participants'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'participants' && <Users className="h-3.5 w-3.5" />}
            {t === 'edit' ? 'Aktion bearbeiten' : `Teilnehmer (${aktion.anmeldungen.length})`}
          </button>
        ))}
      </div>

      {tab === 'edit' && (
        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Grunddaten</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name der Aktion *</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Beschreibung *</Label>
                <Textarea className="min-h-[100px]" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Max. Teilnehmer</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Unbegrenzt"
                    value={form.maxTeilnehmer}
                    onChange={(e) => setForm((f) => ({ ...f, maxTeilnehmer: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mindestalter</Label>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={form.minAlter}
                    onChange={(e) => setForm((f) => ({ ...f, minAlter: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Höchstalter</Label>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={form.maxAlter}
                    onChange={(e) => setForm((f) => ({ ...f, maxAlter: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Titelbild</CardTitle></CardHeader>
            <CardContent>
              <ImageUpload value={imageUrl} onChange={setImageUrl} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Zeiträume</CardTitle></CardHeader>
            <CardContent className="space-y-4 overflow-hidden">
              <div className="space-y-2">
                <Label>Startdatum & -zeit *</Label>
                <DateTimeInput value={form.startDate} onChange={(v) => setForm((f) => ({ ...f, startDate: v }))} required />
              </div>
              <div className="space-y-2">
                <Label>Enddatum & -zeit *</Label>
                <DateTimeInput value={form.endDate} onChange={(v) => setForm((f) => ({ ...f, endDate: v }))} required />
              </div>
              <div className="space-y-2">
                <Label>Anmeldeschluss *</Label>
                <DateTimeInput value={form.anmeldeschluss} onChange={(v) => setForm((f) => ({ ...f, anmeldeschluss: v }))} required />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Anmeldeoptionen</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Klicke auf den Typ-Button um zwischen Checkbox und Texteingabe zu wechseln.
              </p>
              <Separator />
              {optionen.length === 0 && (
                <p className="text-sm text-muted-foreground italic">Keine Optionen definiert</p>
              )}
              {optionen.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    title={option.type === 'CHECKBOX' ? 'Zu Texteingabe wechseln' : 'Zu Checkbox wechseln'}
                    onClick={() =>
                      updateOption(option.id, {
                        type: option.type === 'CHECKBOX' ? 'TEXT' : 'CHECKBOX',
                      })
                    }
                    className={`shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                      option.type === 'CHECKBOX'
                        ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                        : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    {option.type === 'CHECKBOX' ? (
                      <><CheckSquare className="h-3 w-3" /> Checkbox</>
                    ) : (
                      <><Type className="h-3 w-3" /> Text</>
                    )}
                  </button>
                  <Input
                    placeholder={option.type === 'CHECKBOX' ? 'z.B. Bus benötigt' : 'z.B. Besondere Hinweise'}
                    value={option.label}
                    onChange={(e) => updateOption(option.id, { label: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setOptionen((prev) => prev.filter((o) => o.id !== option.id))}
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
                onClick={() => setOptionen((prev) => [...prev, createOptionEntry()])}
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
                        <div className="flex items-center gap-1">
                          {o.type === 'CHECKBOX'
                            ? <CheckSquare className="h-3 w-3 text-blue-500" />
                            : <Type className="h-3 w-3 text-purple-500" />
                          }
                          {o.label}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead>Angemeldet am</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aktion.anmeldungen.map((a) => {
                    const responseMap = new Map(a.optionen.map((ao) => [ao.optionId, ao.value]))
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        {aktion.optionen.map((o) => (
                          <TableCell key={o.id}>
                            {o.type === 'CHECKBOX' ? (
                              responseMap.has(o.id)
                                ? <Badge variant="success">Ja</Badge>
                                : <span className="text-muted-foreground text-sm">Nein</span>
                            ) : (
                              responseMap.has(o.id) && responseMap.get(o.id)
                                ? <span className="text-sm">{responseMap.get(o.id)}</span>
                                : <span className="text-muted-foreground text-sm">–</span>
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
