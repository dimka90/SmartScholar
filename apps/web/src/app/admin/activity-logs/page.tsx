'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, History } from 'lucide-react'
import { useSession } from 'next-auth/react'

const actionLabels: Record<string, string> = {
  CREATE_DEPARTMENT: 'Created Department',
  UPDATE_DEPARTMENT: 'Updated Department',
  DELETE_DEPARTMENT: 'Deleted Department',
  CREATE_COURSE: 'Created Course',
  UPDATE_COURSE: 'Updated Course',
  DELETE_COURSE: 'Deleted Course',
  APPROVE_FORUM_POST: 'Approved Forum Post',
  UNFLAG_FORUM_POST: 'Unflagged Forum Post',
  DELETE_FORUM_POST: 'Deleted Forum Post',
  BROADCAST_NOTIFICATION: 'Broadcast Notification'
}

export default function ActivityLogsPage() {
  const { data: session } = useSession()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  function headers() {
    return { 'Authorization': `Bearer ${session?.user?.accessToken}` }
  }

  const fetchLogs = useCallback(async (p: number) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/activity-logs?page=${p}&limit=50`, {
      headers: headers()
    })
    if (!res.ok) return
    const data = await res.json()
    setLogs(data.logs)
    setTotalPages(data.totalPages)
    setLoading(false)
  }, [session])

  useEffect(() => { if (session?.user?.accessToken) fetchLogs(page) }, [session, page, fetchLogs])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Activity Logs</h1>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <History className="w-12 h-12 mb-4 text-zinc-300 dark:text-zinc-600" />
          <p className="font-medium">No activity logged yet</p>
          <p className="text-sm">Admin actions will appear here.</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-3 font-semibold text-sm">Timestamp</th>
                  <th className="px-6 py-3 font-semibold text-sm">Admin</th>
                  <th className="px-6 py-3 font-semibold text-sm">Action</th>
                  <th className="px-6 py-3 font-semibold text-sm">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {logs.map((log: any) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 text-sm text-zinc-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">{log.user?.name || log.user?.email}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {log.metadata ? JSON.stringify(log.metadata) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-zinc-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
