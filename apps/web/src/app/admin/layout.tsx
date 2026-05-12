import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AdminSidebar } from '@/components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
