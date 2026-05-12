'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, GraduationCap, Settings, LogOut, ShieldAlert } from 'lucide-react'
import { signOut } from 'next-auth/react'

const navItems = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Departments', href: '/admin/departments', icon: BookOpen },
  { name: 'Courses', href: '/admin/courses', icon: GraduationCap },
  { name: 'Documents', href: '/admin/documents', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-900 dark:bg-black text-white hidden md:flex flex-col">
      <div className="p-6">
        <Link href="/admin" className="flex items-center gap-2 text-2xl font-black bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
          <ShieldAlert className="w-6 h-6 text-purple-400" />
          Admin
        </Link>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive 
                  ? 'bg-purple-500/20 text-purple-300' 
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800 space-y-1">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
