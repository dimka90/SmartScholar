import Link from 'next/link'
import { LayoutDashboard, MessageSquare, BookOpen, GraduationCap, Users, Trophy, Settings } from 'lucide-react'

import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { auth } from '@/lib/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user

  if (user && (user as any).role === 'ADMIN') {
    redirect('/admin')
  }

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??'

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-semibold">Welcome Back, {user?.name?.split(' ')[0]}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
