'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ThumbsUp, MessageSquare, Send, CheckCircle, Clock, MoreHorizontal, User } from 'lucide-react'

type Reply = {
  id: string
  content: string
  createdAt: string
  upvotes: number
  user: { name: string; avatarUrl: string | null }
}

type Post = {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  upvotes: number
  user: { name: string; avatarUrl: string | null }
  replies: Reply[]
}

import { useSession } from 'next-auth/react'
import DOMPurify from 'dompurify'
import { RichTextEditor } from '@/components/RichTextEditor'

export default function ForumPostPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [post, setPost] = useState<Post | null>(null)
  const [newReply, setNewReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!session?.user) return
    const headers = {
      'Authorization': `Bearer ${(session.user as any).accessToken}`
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/forum/posts/${id}`, { headers })
      .then(res => res.json())
      .then(data => {
        if (data && data.id) {
          setPost(data)
        } else {
          setPost(null)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching post:', err)
        setLoading(false)
      })
  }, [id, session])

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    const isContentEmpty = !newReply || newReply === '<p></p>' || newReply === '<p><br></p>'
    if (isContentEmpty || submitting || !session?.user) return

    setSubmitting(true)
    const headers = {
      'Authorization': `Bearer ${(session.user as any).accessToken}`,
      'Content-Type': 'application/json'
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/forum/posts/${id}/replies`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content: newReply })
    })

    if (res.ok) {
      window.location.reload()
    }
    setSubmitting(false)
  }

  if (loading) return <div className="p-8">Loading post...</div>
  if (!post) return <div className="p-8">Post not found</div>

  const sanitizeConfig = { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'h2', 'ul', 'ol', 'li', 's', 'strike', 'blockquote'] }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-24">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-bold text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back to Discussions
      </button>

      {/* Main Post */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-lg">{post.user.name}</p>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                {new Date(post.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
            <MoreHorizontal className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-black leading-tight">{post.title}</h1>
          <div className="flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div 
          className="prose prose-zinc dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-lg prose-p:text-zinc-600 dark:prose-p:text-zinc-400"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content, sanitizeConfig) }}
        />

        <div className="flex items-center gap-8 pt-8 border-t border-zinc-50 dark:border-zinc-800">
          <button className="flex items-center gap-2 text-zinc-500 hover:text-blue-600 transition-colors font-bold">
            <ThumbsUp className="w-5 h-5" />
            {post.upvotes} Upvotes
          </button>
          <div className="flex items-center gap-2 text-zinc-500 font-bold">
            <MessageSquare className="w-5 h-5" />
            {post.replies.length} Replies
          </div>
        </div>
      </div>

      {/* Replies Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black px-4">Replies</h2>
        
        {/* New Reply Form */}
        <form onSubmit={submitReply} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm space-y-4">
          <RichTextEditor 
            content={newReply} 
            onChange={setNewReply} 
            placeholder="Share your thoughts or answer the question..." 
          />
          <div className="flex justify-end pt-2">
            <button 
              disabled={submitting || !newReply || newReply === '<p></p>' || newReply === '<p><br></p>'}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
            >
              {submitting ? 'Posting...' : 'Post Reply'}
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {post.replies.map(reply => (
            <div key={reply.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-[10px]">
                  {reply.user.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold">{reply.user.name}</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    {new Date(reply.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div 
                className="prose prose-zinc dark:prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-p:text-zinc-600 dark:prose-p:text-zinc-400"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.content, sanitizeConfig) }}
              />
              <div className="flex items-center gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/50 mt-4">
                <button className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-blue-600 transition-colors">
                  <ThumbsUp className="w-4 h-4" />
                  {reply.upvotes}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
