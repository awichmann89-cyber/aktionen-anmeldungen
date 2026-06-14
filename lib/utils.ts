import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatInTimeZone } from 'date-fns-tz'
import { de } from 'date-fns/locale'

export const TZ = 'Europe/Berlin'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return formatInTimeZone(new Date(date), TZ, 'dd.MM.yyyy', { locale: de })
}

export function formatDateTime(date: Date | string): string {
  return formatInTimeZone(new Date(date), TZ, 'dd.MM.yyyy HH:mm', { locale: de })
}

// Liefert einen lokalen Datetime-String (ohne TZ-Suffix) in Berliner Zeit,
// damit <DateTimeInput> die gespeicherten Werte korrekt vorausfüllt.
export function formatDateTimeInput(date: Date | string): string {
  return formatInTimeZone(new Date(date), TZ, "yyyy-MM-dd'T'HH:mm")
}

export function isRegistrationOpen(anmeldeschluss: Date | string): boolean {
  return new Date() <= new Date(anmeldeschluss)
}

export function getPublicUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  return `${base}/anmeldung/${slug}`
}
