'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Search, Shield, Ban, CheckCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'

export default function UsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  function headers() {
    return { 'Authorization': `Bearer ${session?.user?.accessToken}`, 'Content-Type': 'application/json' }
  }

  const fetchUsers = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '50' })
    if (search) params.set('search', search)
    if (roleFilter) params.set('role', roleFilter)

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users?${params}`, {
      headers: headers()
    })
    if (!res.ok) return
    const data = await res.json()
    setUsers(data.users)
    setTotalPages(data.totalPages)
    setLoading(false)
  }, [session, page, search, roleFilter])

  useEffect(() => { if (session?.user?.accessToken) fetchUsers() }, [fetchUsers])

  async function changeRole(userId: string, role: string) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/role`, {
      method: 'PUT', headers: headers(), body: JSON.stringify({ role })
    })
    fetchUsers()
  }

  async function toggleSuspend(userId: string) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/suspend`, {
      method: 'PUT', headers: headers()
    })
    fetchUsers()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search users..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
        >
          <option value="">All Roles</option>
          <option value="STUDENT">Student</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-3 font-semibold text-sm">Name</th>
              <th className="px-6 py-3 font-semibold text-sm">Email</th>
              <th className="px-6 py-3 font-semibold text-sm">Role</th>
              <th className="px-6 py-3 font-semibold text-sm">Points</th>
              <th className="px-6 py-3 font-semibold text-sm">Status</th>
              <th className="px-6 py-3 font-semibold text-sm">Posts</th>
              <th className="px-6 py-3 font-semibold text-sm">Docs</th>
              <th className="px-6 py-3 font-semibold text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {users.map((u: any) => (
              <tr key={u.id} className={!u.isActive ? 'opacity-50' : ''}>
                <td className="px-6 py-4 font-medium">{u.name}</td>
                <td className="px-6 py-4 text-sm text-zinc-500">{u.email}</td>
                <td className="px-6 py-4">
                  <select
                    value={u.role}
                    onChange={e => changeRole(u.id, e.target.value)}
                    className="text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4">{u.points}</td>
                <td className="px-6 py-4">
                  {u.isActive ? (
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">Active</span>
                  ) : (
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">Suspended</span>
                  )}
                </td>
                <td className="px-6 py-4">{u._count?.forumPosts || 0}</td>
                <td className="px-6 py-4">{u._count?.uploadedDocuments || 0}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => toggleSuspend(u.id)}
                    className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    {u.isActive ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    {u.isActive ? 'Suspend' : 'Restore'}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-zinc-500">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Previous</button>
          <span className="px-3 py-1.5 text-sm text-zinc-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Next</button>
        </div>
      )}
    </div>
  )
}
