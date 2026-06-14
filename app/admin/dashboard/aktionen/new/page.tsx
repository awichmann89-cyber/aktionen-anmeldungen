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
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

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
  const [optionen, setOptionen] = useState<string[]>([''])

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function addOption() {
    setOptionen((prev) => [...prev, ''])
  }

  function updateOption(i: number, value: string) {
    setOptionen((prev) => prev.map((o, idx) => (idx === i ? value : o)))
  }

  function removeOption(i: number) {
    setOptionen((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validOptionen = optionen.filter((o) => o.trim() !== '')

    setLoading(true)
    try {
      const res = await fetch('/api/admin/aktionen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, optionen: validOptionen }),
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
          <Link href="/admin/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Neue Aktion erstellen</h1>
          <p className="text-muted-foreground text-sm">Fülle alle Felder aus</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Grunddaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name der Aktion *</Label>
              <Input
                id="name"
                placeholder="z.B. Sommerlager 2025"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
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
                onChange={(e) => updateForm('description', e.target.value)}
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
                <Label htmlFor="startDate">Startdatum & -zeit *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => updateForm('startDate', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Enddatum & -zeit *</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => updateForm('endDate', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="anmeldeschluss">Anmeldeschluss *</Label>
              <Input
                id="anmeldeschluss"
                type="datetime-local"
                value={form.anmeldeschluss}
                onChange={(e) => updateForm('anmeldeschluss', e.target.value)}
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
            <CardTitle className="text-base">Anmeldeoptionen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Optionen, die Teilnehmer bei der Anmeldung anhaken können (z.B. „Bus benötigt",
              „Vegetarisches Essen").
            </p>
            <Separator />
            {optionen.map((option, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder={`Option ${i + 1}`}
                  value={option}
                  onChange={(e) => updateOption(i, e.target.value)}
                />
                {optionen.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(i)}
                    className="text-destructive hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
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
