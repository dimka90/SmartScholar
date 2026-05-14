'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  BookOpen, 
  Calendar, 
  User, 
  Plus, 
  X,
  Loader2,
  ChevronRight,
  Download
} from 'lucide-react'
import { useSession } from 'next-auth/react'

type Document = {
  id: string
  title: string
  type: string
  course: { code: string; name: string }
  uploadedBy: { name: string }
  createdAt: string
  fileSize: number
}

export default function DocumentsPage() {
  const { data: session } = useSession()
  const [documents, setDocuments] = useState<Document[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [docType, setDocType] = useState('HANDOUT')
  const [file, setFile] = useState<File | null>(null)

  const fetchDocuments = async () => {
    if (!session?.user) return
    const headers = {
      'Authorization': `Bearer ${session.user.accessToken}`
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents`, { headers })
      const data = await res.json()
      setDocuments(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch documents:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!session?.user) return

    const headers = {
      'Authorization': `Bearer ${session.user.accessToken}`
    }

    fetchDocuments()

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, { headers })
      .then(res => res.json())
      .then(data => {
        const coursesData = Array.isArray(data) ? data : []
        setCourses(coursesData)
        if (coursesData.length > 0) setSelectedCourseId(coursesData[0].id)
      })
  }, [session])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title || !selectedCourseId || uploading) return

    setUploading(true)
    const formData = new FormData()
    formData.append('title', title)
    formData.append('courseId', selectedCourseId)
    formData.append('type', docType)
    formData.append('file', file)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`
        },
        body: formData
      })

      if (res.ok) {
        setIsUploadModalOpen(false)
        setTitle('')
        setFile(null)
        fetchDocuments()
      }
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div className="p-8">Loading documents...</div>

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight">Resource Library</h1>
          <p className="text-zinc-500">Access and share course handouts, past questions, and study guides.</p>
        </div>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <Upload className="w-5 h-5" />
          Upload Document
        </button>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <Search className="w-5 h-5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search by title, course, or keyword..." 
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-zinc-500"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <Filter className="w-5 h-5 text-zinc-400" />
            <select className="bg-transparent border-none outline-none text-sm font-medium">
              <option>All Types</option>
              <option>Handouts</option>
              <option>Past Questions</option>
              <option>Textbooks</option>
            </select>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map(doc => (
            <div key={doc.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 hover:border-blue-500 transition-all group shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  {doc.type}
                </div>
              </div>

              <div className="space-y-1 mb-6 flex-1">
                <h3 className="text-xl font-black group-hover:text-blue-600 transition-colors line-clamp-2">{doc.title}</h3>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{doc.course.code}</p>
              </div>

              <div className="space-y-4 pt-6 border-t border-zinc-50 dark:border-zinc-800">
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    {doc.uploadedBy.name}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <Link 
                  href={`/documents/${doc.id}`}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 dark:bg-zinc-800 hover:bg-blue-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-zinc-500/10"
                >
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}

          {documents.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-400">
                <BookOpen className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold">No documents found</p>
                <p className="text-zinc-500 text-sm">Be the first to share a resource with your peers!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Upload Document</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-2">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Document Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CSC 401 Week 1 Handout"
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Course</label>
                  <select 
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                    required
                  >
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.code}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Type</label>
                  <select 
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                    required
                  >
                    <option value="HANDOUT">Handout</option>
                    <option value="PAST_QUESTION">Past Question</option>
                    <option value="TEXTBOOK">Textbook</option>
                    <option value="NOTE">Note</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">PDF File</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    required
                  />
                  <div className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 group-hover:border-blue-500 transition-all">
                    <Download className="w-8 h-8 text-zinc-300 group-hover:text-blue-500 transition-all" />
                    <p className="text-xs font-bold text-zinc-500 group-hover:text-blue-600 transition-all">
                      {file ? file.name : 'Select or drop PDF here'}
                    </p>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={uploading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Submit Resource
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
