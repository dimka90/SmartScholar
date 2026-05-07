'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, FileText, MessageSquare, BookOpen, ChevronRight, Loader2 } from 'lucide-react'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q')
  const [results, setResults] = useState<{ documents: any[], posts: any[] } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query) {
      setLoading(true)
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/search?q=${query}`)
        .then(res => res.json())
        .then(data => {
          setResults(data)
          setLoading(false)
        })
    }
  }, [query])

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12">
      <div className="space-y-4">
        <h1 className="text-3xl font-black">Search Results</h1>
        <p className="text-zinc-500">Showing results for "{query}"</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
        </div>
      ) : results ? (
        <div className="space-y-12">
          {/* Documents Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Documents ({results.documents.length})
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {results.documents.map(doc => (
                <Link 
                  key={doc.id} 
                  href={`/documents/${doc.id}`}
                  className="flex items-center justify-between p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-blue-500 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-zinc-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{doc.title}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{doc.course.code}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-blue-600 transition-all" />
                </Link>
              ))}
              {results.documents.length === 0 && (
                <p className="text-sm text-zinc-500 italic p-4">No documents found.</p>
              )}
            </div>
          </div>

          {/* Forum Posts Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              Forum Discussions ({results.posts.length})
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {results.posts.map(post => (
                <Link 
                  key={post.id} 
                  href={`/forum/${post.id}`}
                  className="flex items-center justify-between p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-blue-500 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-zinc-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{post.title}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">by {post.user.name}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-blue-600 transition-all" />
                </Link>
              ))}
              {results.posts.length === 0 && (
                <p className="text-sm text-zinc-500 italic p-4">No discussions found.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center p-12 space-y-4">
          <Search className="w-12 h-12 text-zinc-300 mx-auto" />
          <p className="text-zinc-500">Search for handouts, past questions, or forum discussions.</p>
        </div>
      )}
    </div>
  )
}
