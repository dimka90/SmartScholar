'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Send } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { RichTextEditor } from '@/components/RichTextEditor'

export default function NewForumPostPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [tagsInput, setTagsInput] = useState('')

  useEffect(() => {
    if (!session?.user) return

    const headers = {
      'Authorization': `Bearer ${session.user.accessToken}`
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, { headers })
      .then(res => res.json())
      .then(data => {
        const coursesData = Array.isArray(data) ? data : []
        setCourses(coursesData)
        if (coursesData.length > 0) setSelectedCourseId(coursesData[0].id)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch courses:', err)
        setLoading(false)
      })
  }, [session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // For rich text, empty might be '<p></p>'
    const isContentEmpty = !content || content === '<p></p>' || content === '<p><br></p>'
    if (!title.trim() || isContentEmpty || !selectedCourseId || submitting) return

    setSubmitting(true)
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)

    const headers = {
      'Authorization': `Bearer ${session?.user?.accessToken}`,
      'Content-Type': 'application/json'
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/forum/posts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title,
          content,
          courseId: selectedCourseId,
          tags: tags.length > 0 ? tags : undefined
        })
      })

      if (res.ok) {
        const post = await res.json()
        router.push(`/forum/${post.id}`)
      } else {
        const err = await res.json()
        alert(`Error: ${err.message || 'Failed to create post'}`)
      }
    } catch (err) {
      console.error('Failed to create post:', err)
      alert('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-24">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-bold text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back to Discussions
      </button>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black">Create New Post</h1>
          <p className="text-zinc-500">Ask a question, share a resource, or start a discussion.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you want to discuss?"
              className="w-full bg-zinc-100 dark:bg-zinc-950 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Course</label>
              <select 
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-950 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none font-medium text-sm"
                required
              >
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.code} - {course.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tags (comma-separated)</label>
              <input 
                type="text" 
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. Exams, Help, Question"
                className="w-full bg-zinc-100 dark:bg-zinc-950 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Content</label>
            <RichTextEditor 
              content={content} 
              onChange={setContent} 
              placeholder="Provide more details..." 
            />
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50 shadow-xl shadow-blue-500/20"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Publish Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
