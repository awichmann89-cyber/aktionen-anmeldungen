'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { LogOut, Settings } from 'lucide-react'
import Image from 'next/image'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin')
    toast.success('Abgemeldet')
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src="/logo.svg" alt="Logo" width={32} height={32} className="rounded-lg" />
            <span className="font-semibold text-lg">Bin Dabei! – Verwaltung</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/dashboard/einstellungen">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Einstellungen</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Abmelden</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
