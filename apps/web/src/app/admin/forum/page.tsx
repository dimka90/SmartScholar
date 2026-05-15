'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Search, Flag, CheckCircle, XCircle, Trash2, Pencil, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Modal } from '@/components/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function ForumModerationPage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [courseFilter, setCourseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  // Edit state
  const [editTarget, setEditTarget] = useState<any | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTags, setEditTags] = useState('')

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [deleteReplyTarget, setDeleteReplyTarget] = useState<any | null>(null)

  // Replies
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [replies, setReplies] = useState<any[]>([])

  function headers() {
    return {
      'Authorization': `Bearer ${session?.user?.accessToken}`,
      'Content-Type': 'application/json'
    }
  }

  const fetchPosts = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '50' })
    if (courseFilter) params.set('courseId', courseFilter)
    if (statusFilter) params.set('status', statusFilter)
    if (search) params.set('search', search)

    const [pRes, cRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/forum?${params}`, { headers: headers() }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, { headers: headers() })
    ])
    if (!pRes.ok || !cRes.ok) return
    const pData = await pRes.json()
    setPosts(pData.posts)
    setTotalPages(pData.totalPages)
    setCourses(await cRes.json())
    setLoading(false)
  }, [session, page, courseFilter, statusFilter, search])

  useEffect(() => { if (session?.user?.accessToken) fetchPosts() }, [fetchPosts])

  async function approvePost(id: string) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/forum/posts/${id}/approve`, {
      method: 'PUT', headers: headers()
    })
    fetchPosts()
  }

  async function unflagPost(id: string) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/forum/posts/${id}/unflag`, {
      method: 'PUT', headers: headers()
    })
    fetchPosts()
  }

  function openEdit(post: any) {
    setEditTarget(post)
    setEditTitle(post.title)
    setEditContent(post.content)
    setEditTags(post.tags?.join(', ') || '')
  }

  async function saveEdit() {
    if (!editTarget) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/forum/posts/${editTarget.id}`, {
      method: 'PUT', headers: headers(),
      body: JSON.stringify({
        title: editTitle,
        content: editContent,
        tags: editTags.split(',').map((t: string) => t.trim()).filter(Boolean)
      })
    })
    setEditTarget(null)
    fetchPosts()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/forum/posts/${deleteTarget.id}`, {
      method: 'DELETE', headers: headers()
    })
    setDeleteTarget(null)
    fetchPosts()
  }

  async function toggleReplies(postId: string) {
    if (expandedPost === postId) {
      setExpandedPost(null)
      setReplies([])
      return
    }
    setExpandedPost(postId)
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/forum/posts/${postId}/replies`, {
      headers: headers()
    })
    if (res.ok) setReplies(await res.json())
  }

  async function confirmDeleteReply() {
    if (!deleteReplyTarget || !expandedPost) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/forum/posts/${expandedPost}/replies/${deleteReplyTarget.id}`, {
      method: 'DELETE', headers: headers()
    })
    setDeleteReplyTarget(null)
    toggleReplies(expandedPost)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
    </div>
  )

  const flaggedCount = posts.filter((p: any) => p.isFlagged).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Forum Management</h1>
          <p className="text-sm text-zinc-500 mt-1">{posts.length} posts ({flaggedCount} flagged)</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search posts..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800" />
        </div>
        <select value={courseFilter} onChange={e => { setCourseFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <option value="">All Courses</option>
          {courses.map((c: any) => <option key={c.id} value={c.id}>{c.code}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <option value="">All Status</option>
          <option value="flagged">Flagged</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending Review</option>
        </select>
      </div>

      <div className="space-y-3">
        {posts.map((post: any) => (
          <div key={post.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{post.title}</h3>
                    {post.isFlagged && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 flex items-center gap-1">
                        <Flag className="w-3 h-3" /> Flagged
                      </span>
                    )}
                    {post.isApproved ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Approved</span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">Pending</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    by {post.user?.name} &middot; {post.course?.code} &middot; {new Date(post.createdAt).toLocaleDateString()} &middot; {post._count?.replies} replies
                  </p>
                  {post.tags?.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {post.tags.map((t: string) => (
                        <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {post.isFlagged && (
                    <>
                      <button onClick={() => approvePost(post.id)}
                        className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Approve">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => unflagPost(post.id)}
                        className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors" title="Unflag">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button onClick={() => openEdit(post)}
                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(post)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleReplies(post.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" title="Replies">
                    {expandedPost === post.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {expandedPost === post.id && (
                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                  {replies.length === 0 ? (
                    <p className="text-sm text-zinc-400 text-center py-4">No replies yet.</p>
                  ) : (
                    replies.map((reply: any) => (
                      <div key={reply.id} className="flex items-start justify-between gap-3 pl-4 border-l-2 border-zinc-200 dark:border-zinc-700">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-500">{reply.user?.name} &middot; {new Date(reply.createdAt).toLocaleString()}</p>
                          <p className="text-sm mt-0.5 line-clamp-2">{reply.content}</p>
                        </div>
                        <button onClick={() => setDeleteReplyTarget(reply)}
                          className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <div className="text-center py-16 text-zinc-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
            <p className="font-medium">No forum posts found</p>
            <p className="text-sm">Try adjusting your filters.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-50">Previous</button>
          <span className="px-3 py-1.5 text-sm text-zinc-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-50">Next</button>
        </div>
      )}

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Post">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Content</label>
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none" rows={5} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Tags (comma-separated)</label>
            <input value={editTags} onChange={e => setEditTags(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setEditTarget(null)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800">Cancel</button>
            <button onClick={saveEdit}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700">Save</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)}
        title="Delete Post" message={`Delete "${deleteTarget?.title}"? This cannot be undone.`} />

      <ConfirmDialog open={!!deleteReplyTarget} onConfirm={confirmDeleteReply} onCancel={() => setDeleteReplyTarget(null)}
        title="Delete Reply" message="Delete this reply? This cannot be undone." />
    </div>
  )
}
