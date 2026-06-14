import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { de } from 'date-fns/locale'

const TZ = 'Europe/Berlin'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return formatInTimeZone(new Date(date), TZ, 'dd.MM.yyyy', { locale: de })
}

export function formatDateTime(date: Date | string): string {
  return formatInTimeZone(new Date(date), TZ, 'dd.MM.yyyy HH:mm', { locale: de })
}

export function formatDateTimeInput(date: Date | string): string {
  return format(new Date(date), "yyyy-MM-dd'T'HH:mm")
}

export function isRegistrationOpen(anmeldeschluss: Date | string): boolean {
  return new Date() <= new Date(anmeldeschluss)
}

export function getPublicUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  return `${base}/anmeldung/${slug}`
}
