'use client'

import { Input } from '@/components/ui/input'

interface DateTimeInputProps {
  value: string // Format: "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void
  required?: boolean
}

function splitDateTime(value: string): { date: string; time: string } {
  if (!value) return { date: '', time: '' }
  const [date, time] = value.split('T')
  return { date: date || '', time: time || '' }
}

export function DateTimeInput({ value, onChange, required }: DateTimeInputProps) {
  const { date, time } = splitDateTime(value)

  function handleDate(newDate: string) {
    onChange(`${newDate}T${time || '00:00'}`)
  }

  function handleTime(newTime: string) {
    onChange(`${date || ''}T${newTime}`)
  }

  return (
    <div className="flex gap-2">
      <Input
        type="date"
        className="flex-1 min-w-0"
        value={date}
        onChange={(e) => handleDate(e.target.value)}
        required={required}
      />
      <Input
        type="time"
        className="w-28 shrink-0"
        value={time}
        onChange={(e) => handleTime(e.target.value)}
        required={required && !!date}
      />
    </div>
  )
}
