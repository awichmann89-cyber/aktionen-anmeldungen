'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Plus, Trash2, CheckSquare, Type } from 'lucide-react'
import { ImageUpload } from '@/components/image-upload'

type OptionType = 'CHECKBOX' | 'TEXT'

interface OptionEntry {
  id: string
  label: string
  type: OptionType
}

function createOption(): OptionEntry {
  return { id: crypto.randomUUID(), label: '', type: 'CHECKBOX' }
}

export default function NewAktionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    anmeldeschluss: '',
  })
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [optionen, setOptionen] = useState<OptionEntry[]>([createOption()])

  function updateOption(id: string, changes: Partial<OptionEntry>) {
    setOptionen((prev) => prev.map((o) => (o.id === id ? { ...o, ...changes } : o)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validOptionen = optionen.filter((o) => o.label.trim() !== '')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/aktionen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          imageUrl,
          optionen: validOptionen.map((o) => ({ label: o.label, type: o.type })),
        }),
      })

      if (res.ok) {
        toast.success('Aktion erfolgreich erstellt!')
        router.push('/admin/dashboard')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Fehler beim Erstellen')
      }
    } catch {
      toast.error('Verbindungsfehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Neue Aktion erstellen</h1>
          <p className="text-muted-foreground text-sm">Fülle alle Felder aus</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Grunddaten</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name der Aktion *</Label>
              <Input
                id="name"
                placeholder="z.B. Sommerlager 2025"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung *</Label>
              <Textarea
                id="description"
                placeholder="Beschreibe die Aktion..."
                className="min-h-[100px]"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Zeiträume</CardTitle></CardHeader>
          <CardContent className="space-y-4 overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 min-w-0">
                <Label>Startdatum & -zeit *</Label>
                <Input
                  type="datetime-local"
                  className="w-full min-w-0"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label>Enddatum & -zeit *</Label>
                <Input
                  type="datetime-local"
                  className="w-full min-w-0"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2 min-w-0">
              <Label>Anmeldeschluss *</Label>
              <Input
                type="datetime-local"
                className="w-full min-w-0"
                value={form.anmeldeschluss}
                onChange={(e) => setForm((f) => ({ ...f, anmeldeschluss: e.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground">
                Nach diesem Datum sind keine Anmeldungen mehr möglich.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Titelbild</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload value={imageUrl} onChange={setImageUrl} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anmeldeoptionen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Optionen, die Teilnehmer bei der Anmeldung ausfüllen können.
            </p>
            <Separator />
            {optionen.map((option, i) => (
              <div key={option.id} className="flex items-center gap-2">
                {/* Typ-Toggle */}
                <button
                  type="button"
                  title={option.type === 'CHECKBOX' ? 'Checkbox → zu Texteingabe wechseln' : 'Texteingabe → zu Checkbox wechseln'}
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
                  placeholder={
                    option.type === 'CHECKBOX'
                      ? `z.B. Bus benötigt`
                      : `z.B. Besondere Hinweise`
                  }
                  value={option.label}
                  onChange={(e) => updateOption(option.id, { label: e.target.value })}
                />
                {optionen.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setOptionen((prev) => prev.filter((o) => o.id !== option.id))}
                    className="text-destructive hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOptionen((prev) => [...prev, createOption()])}
            >
              <Plus className="h-4 w-4" />
              Option hinzufügen
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Wird erstellt...' : 'Aktion erstellen'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/dashboard">Abbrechen</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
