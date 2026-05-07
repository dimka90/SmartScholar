'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  Send, 
  Users, 
  Hash, 
  Settings, 
  ArrowLeft, 
  Video, 
  Phone, 
  PlusCircle, 
  Smile, 
  Paperclip,
  Loader2
} from 'lucide-react'

type Message = {
  id: string
  content: string
  createdAt: string
  user: { name: string; avatarUrl: string | null }
}

type Group = {
  id: string
  name: string
  course: { code: string }
  members: { name: string }[]
}

import { useSession } from 'next-auth/react'

export default function GroupChatPage() {
  const { data: session } = useSession()
  const { id } = useParams()
  const router = useRouter()
  const [group, setGroup] = useState<Group | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!session?.user || !id) return

    const headers = {
      'Authorization': `Bearer ${(session.user as any).accessToken}`
    }

    // Fetch group details and messages
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${id}`, { headers }).then(res => res.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${id}/messages`, { headers }).then(res => res.json())
    ]).then(([groupData, messagesData]) => {
      if (groupData?.id) setGroup(groupData)
      setMessages(Array.isArray(messagesData) ? messagesData : [])
      setLoading(false)
    }).catch(err => {
      console.error('Group fetch error:', err)
      setLoading(false)
    })
  }, [id, session])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || submitting || !session?.user) return

    setSubmitting(true)
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(session.user as any).accessToken}`
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${id}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: input })
      })

      if (res.ok) {
        const msg = await res.json()
        setMessages([...messages, { ...msg, user: { name: session.user.name || 'You', avatarUrl: null } }])
        setInput('')
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
  if (!group) return <div className="p-8">Group not found</div>

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-black">
        {/* Header */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="md:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
              {group.course.code.slice(0, 3)}
            </div>
            <div>
              <h2 className="text-sm font-black">{group.name}</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1">
                <Hash className="w-2.5 h-2.5" />
                {group.course.code} Discussion
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-400">
              <Phone className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-400">
              <Video className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-400">
              <Users className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
          <div className="py-8 text-center space-y-2 border-b border-zinc-100 dark:border-zinc-900 mb-8">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center text-blue-600 mx-auto mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="font-black text-xl">Welcome to {group.name}!</h3>
            <p className="text-sm text-zinc-500">This is the start of your group discussion for {group.course.code}.</p>
          </div>

          {messages.map((m) => (
            <div key={m.id} className="flex gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs shrink-0">
                {m.user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black">{m.user.name}</span>
                  <span className="text-[10px] text-zinc-400 font-bold">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {m.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-6 pt-2">
          <form onSubmit={sendMessage} className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-2 flex items-center gap-2">
            <button type="button" className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl text-zinc-400">
              <PlusCircle className="w-5 h-5" />
            </button>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${group.name}...`}
              className="flex-1 bg-transparent border-none outline-none text-sm p-2 placeholder:text-zinc-500"
            />
            <div className="flex items-center gap-1 pr-1">
              <button type="button" className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl text-zinc-400">
                <Smile className="w-5 h-5" />
              </button>
              <button 
                type="submit"
                disabled={!input.trim() || submitting}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sidebar - Members */}
      <div className="w-64 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 hidden lg:flex flex-col">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Members — {group.members.length}</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {group.members.map((member, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-[10px]">
                {member.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-bold truncate">{member.name}</span>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-zinc-500 hover:text-red-500 transition-colors">
            <Settings className="w-3 h-3" />
            Group Settings
          </button>
        </div>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
