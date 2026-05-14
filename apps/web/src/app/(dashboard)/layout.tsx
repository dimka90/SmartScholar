import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { DashboardHeader } from '@/components/DashboardHeader'
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

      <main className="flex-1 flex flex-col min-w-0">
        <DashboardHeader userName={user?.name} initials={initials} />

        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
