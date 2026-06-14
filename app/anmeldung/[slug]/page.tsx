'use client'

import { useEffect, useState, use } from 'react'
import { toast } from 'sonner'
import { formatDate, formatDateTime, isRegistrationOpen } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Calendar, Clock, CheckCircle2, AlertCircle, Loader2, Plus, Trash2, User,
} from 'lucide-react'

type OptionType = 'CHECKBOX' | 'TEXT'

interface Option {
  id: string
  label: string
  type: OptionType
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

interface KindEntry {
  id: string
  name: string
  // CHECKBOX: optionId in Set = ausgewählt
  selectedCheckboxes: Set<string>
  // TEXT: optionId → Texteingabe
  textValues: Record<string, string>
}

function createKind(): KindEntry {
  return {
    id: crypto.randomUUID(),
    name: '',
    selectedCheckboxes: new Set(),
    textValues: {},
  }
}

export default function AnmeldungPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [aktion, setAktion] = useState<Aktion | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [registeredNames, setRegisteredNames] = useState<string[]>([])
  const [kinder, setKinder] = useState<KindEntry[]>([createKind()])

  useEffect(() => {
    fetch(`/api/public/${slug}`)
      .then((res) => { if (res.status === 404) { setNotFound(true); return null } return res.json() })
      .then((data) => { if (data) setAktion(data) })
      .catch(() => toast.error('Fehler beim Laden'))
      .finally(() => setLoading(false))
  }, [slug])

  function updateName(id: string, name: string) {
    setKinder((prev) => prev.map((k) => (k.id === id ? { ...k, name } : k)))
  }

  function toggleCheckbox(kindId: string, optionId: string) {
    setKinder((prev) =>
      prev.map((k) => {
        if (k.id !== kindId) return k
        const next = new Set(k.selectedCheckboxes)
        next.has(optionId) ? next.delete(optionId) : next.add(optionId)
        return { ...k, selectedCheckboxes: next }
      })
    )
  }

  function updateText(kindId: string, optionId: string, value: string) {
    setKinder((prev) =>
      prev.map((k) =>
        k.id !== kindId ? k : { ...k, textValues: { ...k.textValues, [optionId]: value } }
      )
    )
  }

  function addKind() { setKinder((prev) => [...prev, createKind()]) }
  function removeKind(id: string) { setKinder((prev) => prev.filter((k) => k.id !== id)) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!aktion) return

    const validKinder = kinder.filter((k) => k.name.trim() !== '')
    if (validKinder.length === 0) {
      toast.error('Bitte mindestens einen Namen eingeben')
      return
    }

    setSubmitting(true)
    try {
      const results = await Promise.all(
        validKinder.map((kind) => {
          // Checkbox-Antworten (nur angehakte)
          const checkboxResponses = Array.from(kind.selectedCheckboxes).map((optionId) => ({
            optionId,
          }))
          // Text-Antworten (nur nicht-leere)
          const textResponses = Object.entries(kind.textValues)
            .filter(([, val]) => val.trim() !== '')
            .map(([optionId, value]) => ({ optionId, value }))

          return fetch('/api/anmeldung', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              aktionId: aktion.id,
              name: kind.name.trim(),
              optionResponses: [...checkboxResponses, ...textResponses],
            }),
          })
        })
      )

      const failed = results.filter((r) => !r.ok)
      if (failed.length > 0) {
        const data = await failed[0].json()
        toast.error(data.error || 'Fehler bei der Anmeldung')
        return
      }

      setRegisteredNames(validKinder.map((k) => k.name.trim()))
      setSubmitted(true)
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
  const checkboxOptionen = aktion.optionen.filter((o) => o.type === 'CHECKBOX')
  const textOptionen = aktion.optionen.filter((o) => o.type === 'TEXT')

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h2 className="text-2xl font-bold">Anmeldung erfolgreich!</h2>
              <p className="text-muted-foreground mt-2">
                {registeredNames.length === 1 ? (
                  <><strong>{registeredNames[0]}</strong> ist jetzt für <strong>{aktion.name}</strong> angemeldet.</>
                ) : (
                  <>{registeredNames.length} Kinder sind jetzt für <strong>{aktion.name}</strong> angemeldet:</>
                )}
              </p>
              {registeredNames.length > 1 && (
                <ul className="mt-3 space-y-1">
                  {registeredNames.map((name) => (
                    <li key={name} className="text-sm font-medium">✓ {name}</li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Bei Fragen wende dich bitte direkt an die Organisatoren.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Online-Anmeldung</p>
          <h1 className="text-3xl font-bold tracking-tight">{aktion.name}</h1>
        </div>

        <Card>
          <CardContent className="py-4 space-y-3">
            <p className="text-muted-foreground">{aktion.description}</p>
            <Separator />
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>{formatDate(aktion.startDate)} – {formatDate(aktion.endDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">Anmeldeschluss:</span>
                <span className={isOpen ? 'text-orange-600 font-medium' : 'text-destructive font-medium'}>
                  {formatDateTime(aktion.anmeldeschluss)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {!isOpen && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Anmeldeschluss überschritten</AlertTitle>
            <AlertDescription>Die Anmeldefrist für diese Aktion ist abgelaufen.</AlertDescription>
          </Alert>
        )}

        {isOpen && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Kinder anmelden</CardTitle>
                <CardDescription>Du kannst mehrere Kinder auf einmal anmelden.</CardDescription>
              </CardHeader>
            </Card>

            {kinder.map((kind, index) => (
              <Card key={kind.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="h-4 w-4" />
                      Kind {index + 1}
                    </div>
                    {kinder.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeKind(kind.id)}
                        className="text-destructive hover:text-destructive h-7 px-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Entfernen
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor={`name-${kind.id}`}>Name *</Label>
                    <Input
                      id={`name-${kind.id}`}
                      placeholder="Vorname Nachname"
                      value={kind.name}
                      onChange={(e) => updateName(kind.id, e.target.value)}
                      autoFocus={index === 0}
                    />
                  </div>

                  {/* Checkbox-Optionen */}
                  {checkboxOptionen.length > 0 && (
                    <div className="space-y-2">
                      <Label>Optionen</Label>
                      <div className="space-y-3 rounded-md border p-3">
                        {checkboxOptionen.map((option) => (
                          <div key={option.id} className="flex items-center gap-3">
                            <Checkbox
                              id={`${kind.id}-${option.id}`}
                              checked={kind.selectedCheckboxes.has(option.id)}
                              onCheckedChange={() => toggleCheckbox(kind.id, option.id)}
                            />
                            <label
                              htmlFor={`${kind.id}-${option.id}`}
                              className="text-sm font-medium leading-none cursor-pointer select-none"
                            >
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Text-Optionen */}
                  {textOptionen.map((option) => (
                    <div key={option.id} className="space-y-2">
                      <Label htmlFor={`${kind.id}-text-${option.id}`}>{option.label}</Label>
                      <Input
                        id={`${kind.id}-text-${option.id}`}
                        placeholder="Deine Eingabe..."
                        value={kind.textValues[option.id] || ''}
                        onChange={(e) => updateText(kind.id, option.id, e.target.value)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            <Button type="button" variant="outline" className="w-full" onClick={addKind}>
              <Plus className="h-4 w-4" />
              Weiteres Kind hinzufügen
            </Button>

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Wird angemeldet...</>
              ) : kinder.length === 1 ? (
                'Jetzt anmelden'
              ) : (
                `${kinder.filter((k) => k.name.trim()).length} Kinder anmelden`
              )}
            </Button>
          </form>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Anmeldeschluss: {formatDateTime(aktion.anmeldeschluss)}
        </p>
      </div>
    </div>
  )
}
