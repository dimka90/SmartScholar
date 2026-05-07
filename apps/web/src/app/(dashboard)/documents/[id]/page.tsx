'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { BookOpen, FileText, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

type Summary = {
  overview: string
  keyConcepts: string[]
  examTopics: string[]
}

type Document = {
  id: string
  title: string
  type: string
  course: { name: string; code: string }
  summaryCache?: Summary
}

export default function DocumentDetailPage() {
  const { id } = useParams()
  const [doc, setDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [summarizing, setSummarizing] = useState(false)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${id}`)
      .then(res => res.json())
      .then(data => {
        setDoc(data)
        setLoading(false)
      })
  }, [id])

  const generateSummary = async () => {
    setSummarizing(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${id}/summarize`, {
        method: 'POST'
      })
      const summary = await res.json()
      setDoc(prev => prev ? { ...prev, summaryCache: summary } : null)
    } finally {
      setSummarizing(false)
    }
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
  if (!doc) return <div className="p-8">Document not found</div>

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 w-fit px-3 py-1 rounded-full">
            <BookOpen className="w-4 h-4" />
            {doc.course.code}
          </div>
          <h1 className="text-3xl font-black">{doc.title}</h1>
          <p className="text-zinc-500">{doc.course.name}</p>
        </div>
        
        <button 
          onClick={generateSummary}
          disabled={summarizing || !!doc.summaryCache}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-xl shadow-blue-500/20 hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
        >
          {summarizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {doc.summaryCache ? 'Summary Ready' : 'Generate AI Summary'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Document Viewer Placeholder */}
        <div className="lg:col-span-2 aspect-[3/4] bg-white dark:bg-zinc-900 rounded-3xl border-4 border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col items-center justify-center p-12 text-center space-y-4">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
            <FileText className="w-10 h-10 opacity-20" />
          </div>
          <p className="text-zinc-500 max-w-xs">PDF Viewer would be embedded here for real document interaction.</p>
        </div>

        {/* AI Sidebar */}
        <div className="space-y-6">
          {doc.summaryCache ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-4">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  AI Summary
                </h3>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {doc.summaryCache.overview}
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Key Concepts</h3>
                <ul className="space-y-3">
                  {doc.summaryCache.keyConcepts.map((concept, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {concept}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Likely Exam Topics</h3>
                <ul className="space-y-3">
                  {doc.summaryCache.examTopics.map((topic, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-100 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center space-y-4">
              <Sparkles className="w-10 h-10 mx-auto opacity-20" />
              <p className="text-sm text-zinc-500">Generate a summary to see key concepts and exam topics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
