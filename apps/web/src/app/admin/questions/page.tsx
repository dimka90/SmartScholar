'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Modal } from '@/components/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function QuestionsPage() {
  const { data: session } = useSession()
  const [questions, setQuestions] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [courseFilter, setCourseFilter] = useState('')
  const [editing, setEditing] = useState<any | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editQuestion, setEditQuestion] = useState('')
  const [editCorrect, setEditCorrect] = useState('')
  const [editOptions, setEditOptions] = useState('')
  const [editDifficulty, setEditDifficulty] = useState('MEDIUM')

  function headers() {
    return { 'Authorization': `Bearer ${session?.user?.accessToken}`, 'Content-Type': 'application/json' }
  }

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '50' })
    if (courseFilter) params.set('courseId', courseFilter)

    const [qRes, cRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/questions?${params}`, { headers: headers() }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, { headers: headers() })
    ])
    if (!qRes.ok || !cRes.ok) return
    const qData = await qRes.json()
    setQuestions(qData.questions)
    setTotalPages(qData.totalPages)
    setCourses(await cRes.json())
    setLoading(false)
  }, [session, page, courseFilter])

  useEffect(() => { if (session?.user?.accessToken) fetchData() }, [fetchData])

  function openEdit(q: any) {
    setEditing(q)
    setEditQuestion(q.question)
    setEditCorrect(q.correctAnswer)
    setEditOptions(q.options?.join('\n') || '')
    setEditDifficulty(q.difficulty)
    setModalOpen(true)
  }

  async function saveEdit() {
    if (!editing) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/questions/${editing.id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        question: editQuestion,
        correctAnswer: editCorrect,
        options: editOptions.split('\n').filter(Boolean),
        difficulty: editDifficulty
      })
    })
    setModalOpen(false)
    setEditing(null)
    fetchData()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/questions/${deleteTarget.id}`, {
      method: 'DELETE', headers: headers()
    })
    setDeleteTarget(null)
    fetchData()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Exam Questions</h1>

      <div className="flex gap-3">
        <select value={courseFilter} onChange={e => { setCourseFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <option value="">All Courses</option>
          {courses.map((c: any) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-3 font-semibold text-sm">Question</th>
              <th className="px-6 py-3 font-semibold text-sm">Course</th>
              <th className="px-6 py-3 font-semibold text-sm">Document</th>
              <th className="px-6 py-3 font-semibold text-sm">Difficulty</th>
              <th className="px-6 py-3 font-semibold text-sm">Answer</th>
              <th className="px-6 py-3 font-semibold text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {questions.map((q: any) => (
              <tr key={q.id}>
                <td className="px-6 py-4 max-w-md truncate">{q.question}</td>
                <td className="px-6 py-4 text-sm">{q.course?.code}</td>
                <td className="px-6 py-4 text-sm text-zinc-500">{q.document?.title}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    q.difficulty === 'HARD' ? 'bg-red-100 dark:bg-red-900/30 text-red-700' :
                    q.difficulty === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700' :
                    'bg-green-100 dark:bg-green-900/30 text-green-700'
                  }`}>{q.difficulty}</span>
                </td>
                <td className="px-6 py-4 font-mono text-xs">{q.correctAnswer}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openEdit(q)}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setDeleteTarget(q)}
                    className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </td>
              </tr>
            ))}
            {questions.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500">No questions found.</td></tr>
            )}
          </tbody>
        </table>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Edit Question">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Question</label>
            <textarea value={editQuestion} onChange={e => setEditQuestion(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none" rows={3} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Options (one per line)</label>
            <textarea value={editOptions} onChange={e => setEditOptions(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none" rows={4} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Correct Answer</label>
            <input value={editCorrect} onChange={e => setEditCorrect(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Difficulty</label>
            <select value={editDifficulty} onChange={e => setEditDifficulty(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm">
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800">Cancel</button>
            <button onClick={saveEdit}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700">Save</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Question"
        message="Are you sure you want to delete this question? This cannot be undone."
      />
    </div>
  )
}
