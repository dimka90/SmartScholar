import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
        <h2 className="text-xl font-bold">Admin Panel</h2>
        <nav className="space-y-2">
          <Link href="/admin/departments" className="block p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded">Departments</Link>
          <Link href="/admin/courses" className="block p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded">Courses</Link>
          <Link href="/admin/documents" className="block p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded">Documents</Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
