'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, CheckCircle, XCircle, Trash2, Flag } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function ForumModerationPage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)

  function headers() {
    return {
      'Authorization': `Bearer ${session?.user?.accessToken}`,
      'Content-Type': 'application/json'
    }
  }

  const fetchFlagged = useCallback(async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/forum/flagged`, {
      headers: headers()
    })
    if (!res.ok) return
    setPosts(await res.json())
    setLoading(false)
  }, [session])

  useEffect(() => { if (session?.user?.accessToken) fetchFlagged() }, [session, fetchFlagged])

  async function approvePost(id: string) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/forum/posts/${id}/approve`, {
      method: 'PUT',
      headers: headers()
    })
    fetchFlagged()
  }

  async function unflagPost(id: string) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/forum/posts/${id}/unflag`, {
      method: 'PUT',
      headers: headers()
    })
    fetchFlagged()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/forum/posts/${deleteTarget.id}`, {
      method: 'DELETE',
      headers: headers()
    })
    setDeleteTarget(null)
    fetchFlagged()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Forum Moderation</h1>
        <span className="text-sm text-zinc-500">{posts.length} flagged {posts.length === 1 ? 'post' : 'posts'}</span>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <Flag className="w-12 h-12 mb-4 text-zinc-300 dark:text-zinc-600" />
          <p className="font-medium">No flagged posts</p>
          <p className="text-sm">All forum content has passed AI moderation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post: any) => (
            <div key={post.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{post.title}</h3>
                  <p className="text-sm text-zinc-500">
                    by {post.user?.name} &middot; {post.course?.code} &middot; {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-3">{post.content}</p>
                  <p className="text-xs text-zinc-400 mt-1">{post._count?.replies} replies</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => approvePost(post.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => unflagPost(post.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Unflag
                  </button>
                  <button
                    onClick={() => setDeleteTarget(post)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Post"
        message={`Permanently delete "${deleteTarget?.title}"? This cannot be undone.`}
      />
    </div>
  )
}
