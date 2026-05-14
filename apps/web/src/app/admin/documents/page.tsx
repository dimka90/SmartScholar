'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Trash2, FileText, Sparkles, CheckCircle, Plus, Upload, X, RefreshCw } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Modal } from '@/components/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function DocumentsPage() {
  const { data: session } = useSession()
  const [docs, setDocs] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [reprocessingId, setReprocessingId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [docType, setDocType] = useState('HANDOUT')
  const [file, setFile] = useState<File | null>(null)

  function headers() {
    return { 'Authorization': `Bearer ${session?.user?.accessToken}` }
  }

  const fetchDocs = useCallback(async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents`, {
      headers: headers()
    })
    if (!res.ok) return
    setDocs(await res.json())
    setLoading(false)
  }, [session])

  useEffect(() => {
    if (!session?.user?.accessToken) return
    fetchDocs()
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, { headers: headers() })
      .then(r => r.json())
      .then(data => {
        const c = Array.isArray(data) ? data : []
        setCourses(c)
        if (c.length > 0) setSelectedCourseId(c[0].id)
      })
  }, [session, fetchDocs])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !title || !selectedCourseId || uploading) return
    setUploading(true)
    const formData = new FormData()
    formData.append('title', title)
    formData.append('courseId', selectedCourseId)
    formData.append('type', docType)
    formData.append('file', file)

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session?.user?.accessToken}` },
      body: formData
    })

    setUploading(false)
    if (res.ok) {
      setUploadModalOpen(false)
      setTitle(''); setFile(null); setDocType('HANDOUT')
      setSuccessMsg(`Document "${title}" uploaded successfully`)
      setTimeout(() => setSuccessMsg(null), 4000)
      fetchDocs()
    }
  }

  async function generateQuestions(doc: any) {
    setGeneratingId(doc.id)
    setSuccessMsg(null)
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exams/extract-questions`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: doc.id })
    })
    const data = await res.json()
    setGeneratingId(null)
    if (res.ok) {
      setSuccessMsg(`${data.message} from "${doc.title}"`)
      setTimeout(() => setSuccessMsg(null), 4000)
      fetchDocs()
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${deleteTarget.id}`, {
      method: 'DELETE', headers: headers()
    })
    setDeleteTarget(null)
    fetchDocs()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Documents</h1>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 text-sm text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <CheckCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-3 font-semibold text-sm">Title</th>
              <th className="px-6 py-3 font-semibold text-sm">Type</th>
              <th className="px-6 py-3 font-semibold text-sm">Course</th>
              <th className="px-6 py-3 font-semibold text-sm">Uploaded By</th>
              <th className="px-6 py-3 font-semibold text-sm">Status</th>
              <th className="px-6 py-3 font-semibold text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {docs.map((doc: any) => (
              <tr key={doc.id}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-zinc-400" />
                    <span>{doc.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                    {doc.type}
                  </span>
                </td>
                <td className="px-6 py-4">{doc.course?.code}</td>
                <td className="px-6 py-4">{doc.uploadedBy?.name}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    doc.processingStatus === 'ready' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    doc.processingStatus === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  }`}>
                    {doc.processingStatus}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {doc.processingStatus === 'ready' && (
                    <button
                      onClick={() => generateQuestions(doc)}
                      disabled={generatingId === doc.id}
                      className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
                    >
                      {generatingId === doc.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      {generatingId === doc.id ? 'Generating...' : 'Questions'}
                    </button>
                  )}
                  {doc.processingStatus === 'failed' && (
                    <button
                      onClick={async () => {
                        setReprocessingId(doc.id)
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/documents/${doc.id}/reprocess`, {
                          method: 'POST',
                          headers: { ...headers(), 'Content-Type': 'application/json' },
                          body: '{}'
                        })
                        const data = await res.json()
                        setReprocessingId(null)
                        if (res.ok) {
                          setSuccessMsg(data.message)
                          setTimeout(() => setSuccessMsg(null), 4000)
                          fetchDocs()
                        }
                      }}
                      disabled={reprocessingId === doc.id}
                      className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium disabled:opacity-50"
                    >
                      {reprocessingId === doc.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      {reprocessingId === doc.id ? 'Reprocessing...' : 'Reprocess'}
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteTarget(doc)}
                    className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                  No documents uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title="Upload Document">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Course</label>
            <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" required>
              <option value="">Select course...</option>
              {courses.map((c: any) => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm">
              <option value="HANDOUT">Handout</option>
              <option value="PAST_QUESTION">Past Question</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">PDF File</label>
            <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50" required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setUploadModalOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
            <button type="submit" disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
      />
    </div>
  )
}
