'use client'

import { useEffect, useState, use } from 'react'
import { toast } from 'sonner'
import { formatDate, formatDateTime, isRegistrationOpen } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Calendar, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface Option {
  id: string
  label: string
  order: number
}

interface Aktion {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  anmeldeschluss: string
  optionen: Option[]
}

export default function AnmeldungPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [aktion, setAktion] = useState<Aktion | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch(`/api/public/${slug}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true)
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data) setAktion(data)
      })
      .catch(() => toast.error('Fehler beim Laden'))
      .finally(() => setLoading(false))
  }, [slug])

  function toggleOption(optionId: string) {
    setSelectedOptions((prev) => {
      const next = new Set(prev)
      if (next.has(optionId)) {
        next.delete(optionId)
      } else {
        next.add(optionId)
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!aktion) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/anmeldung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aktionId: aktion.id,
          name: name.trim(),
          selectedOptionIds: Array.from(selectedOptions),
        }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Fehler bei der Anmeldung')
      }
    } catch {
      toast.error('Verbindungsfehler – bitte nochmal versuchen')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound || !aktion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12 space-y-3">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold">Aktion nicht gefunden</h2>
            <p className="text-muted-foreground">
              Dieser Anmeldungslink ist nicht mehr gültig oder wurde nicht korrekt kopiert.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOpen = isRegistrationOpen(aktion.anmeldeschluss)

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h2 className="text-2xl font-bold">Anmeldung erfolgreich!</h2>
              <p className="text-muted-foreground mt-2">
                <strong>{name}</strong> ist jetzt für <strong>{aktion.name}</strong> angemeldet.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Du erhältst keine automatische Bestätigung. Bei Fragen wende dich bitte direkt an die
              Organisatoren.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
            Online-Anmeldung
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{aktion.name}</h1>
        </div>

        {/* Info card */}
        <Card>
          <CardContent className="py-4 space-y-3">
            <p className="text-muted-foreground">{aktion.description}</p>
            <Separator />
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>
                  {formatDate(aktion.startDate)} – {formatDate(aktion.endDate)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">Anmeldeschluss: </span>
                <span className={isOpen ? 'text-orange-600 font-medium' : 'text-destructive font-medium'}>
                  {formatDateTime(aktion.anmeldeschluss)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration status */}
        {!isOpen && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Anmeldeschluss überschritten</AlertTitle>
            <AlertDescription>
              Die Anmeldefrist für diese Aktion ist abgelaufen. Eine Anmeldung ist nicht mehr
              möglich.
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        {isOpen && (
          <Card>
            <CardHeader>
              <CardTitle>Jetzt anmelden</CardTitle>
              <CardDescription>Fülle das Formular aus um dich anzumelden.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name des Kindes / Teilnehmers *</Label>
                  <Input
                    id="name"
                    placeholder="Vorname Nachname"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {aktion.optionen.length > 0 && (
                  <div className="space-y-3">
                    <Label>Optionen</Label>
                    <div className="space-y-3 rounded-md border p-4">
                      {aktion.optionen.map((option) => (
                        <div key={option.id} className="flex items-center gap-3">
                          <Checkbox
                            id={option.id}
                            checked={selectedOptions.has(option.id)}
                            onCheckedChange={() => toggleOption(option.id)}
                          />
                          <label
                            htmlFor={option.id}
                            className="text-sm font-medium leading-none cursor-pointer select-none"
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Wird angemeldet...
                    </>
                  ) : (
                    'Jetzt anmelden'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Anmeldeschluss: {formatDateTime(aktion.anmeldeschluss)}
        </p>
      </div>
    </div>
  )
}
