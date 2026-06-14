'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Mail } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function EinstellungenPage() {
  const [kontaktEmail, setKontaktEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/einstellungen')
      .then((r) => r.json())
      .then((data) => setKontaktEmail(data.kontaktEmail || ''))
      .catch(() => toast.error('Fehler beim Laden'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/einstellungen', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kontaktEmail }),
      })
      if (res.ok) {
        toast.success('Einstellungen gespeichert')
      } else {
        toast.error('Fehler beim Speichern')
      }
    } catch {
      toast.error('Verbindungsfehler')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Einstellungen</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Kontakt-E-Mail
          </CardTitle>
          <CardDescription>
            Diese E-Mail-Adresse wird auf allen öffentlichen Anmeldeseiten als
            Kontaktmöglichkeit angezeigt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                placeholder="kontakt@beispiel.de"
                value={kontaktEmail}
                onChange={(e) => setKontaktEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={saving || loading}>
              <Save className="h-4 w-4" />
              {saving ? 'Speichern...' : 'Speichern'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
