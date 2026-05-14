'use client'

import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

type DashboardHeaderProps = {
  userName: string | undefined
  initials: string
}

export function DashboardHeader({ userName, initials }: DashboardHeaderProps) {
  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold">Welcome Back, {userName?.split(' ')[0]}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
      </div>
    </header>
  )
}
