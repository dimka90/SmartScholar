'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, Plus, MessageSquare, BookOpen, ChevronRight, Hash } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  sourcesUsed?: { documentId: string; chunkIndex: number }[]
}

type Session = {
  id: string
  title: string
  courseId: string
  createdAt: string
}

type Course = {
  id: string
  name: string
  code: string
}

import { useSession } from 'next-auth/react'

export default function ChatPage() {
  const { data: session } = useSession()
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [streamingText, setStreamingText] = useState('')
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('Session data:', session)
    if (!session?.user) return

    const headers = {
      'Authorization': `Bearer ${(session.user as any).accessToken}`
    }

    // Fetch courses
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, { headers })
      .then(res => res.json())
      .then(data => {
        const coursesData = Array.isArray(data) ? data : []
        setCourses(coursesData)
        if (coursesData.length > 0) setSelectedCourse(coursesData[0].id)
      })

    // Fetch sessions
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/sessions`, { headers })
      .then(res => res.json())
      .then(data => setSessions(Array.isArray(data) ? data : []))
  }, [session])

  useEffect(() => {
    if (activeSession && session?.user) {
      const headers = {
        'Authorization': `Bearer ${(session.user as any).accessToken}`
      }
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/sessions/${activeSession.id}/messages`, { headers })
        .then(res => res.json())
        .then(data => setMessages(Array.isArray(data) ? data : []))
    } else {
      setMessages([])
    }
  }, [activeSession, session])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingText])

  const createSession = async () => {
    if (!session?.user) return

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(session.user as any).accessToken}`
    }

    const course = courses.find(c => c.id === selectedCourse)
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        courseId: selectedCourse,
        title: `Chat about ${course?.code}`
      })
    })
    const newSession = await res.json()
    setSessions([newSession, ...sessions])
    setActiveSession(newSession)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !activeSession || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setStreamingText('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/sessions/${activeSession.id}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session?.user as any).accessToken}`
        },
        body: JSON.stringify({ content: input })
      })

      if (!response.body) return

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              fullText += data.text
              setStreamingText(fullText)
            } catch (e) {
              console.error('Error parsing stream chunk', e)
            }
          }
        }
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-ai',
        role: 'assistant',
        content: fullText
      }])
      setStreamingText('')
    } catch (error) {
      console.error('Failed to send message', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sessions Sidebar */}
      <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col">
        <div className="p-4 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Select Course</label>
            <select 
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={createSession}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            New Chat Session
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 py-2">
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSession(s)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all group",
                activeSession?.id === s.id 
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800" 
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-transparent"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                activeSession?.id === s.id ? "bg-blue-100 dark:bg-blue-900/40" : "bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700"
              )}>
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{s.title}</p>
                <p className="text-[10px] opacity-60 uppercase">{new Date(s.createdAt).toLocaleDateString()}</p>
              </div>
              <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity", activeSession?.id === s.id && "opacity-100")} />
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-black">
        {activeSession ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6" ref={scrollRef}>
              {messages.map((m) => (
                <div key={m.id} className={cn(
                  "flex gap-4 max-w-4xl mx-auto",
                  m.role === 'user' ? "flex-row-reverse" : ""
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-[10px]",
                    m.role === 'user' ? "bg-indigo-600" : "bg-blue-600"
                  )}>
                    {m.role === 'user' ? 'ME' : 'AI'}
                  </div>
                  <div className={cn(
                    "space-y-2 p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                    m.role === 'user' 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-tl-none"
                  )}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {m.sourcesUsed && m.sourcesUsed.length > 0 && (
                      <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2">Sources Referenced</p>
                        <div className="flex flex-wrap gap-2">
                          {m.sourcesUsed.map((s, i) => (
                            <span key={i} className="flex items-center gap-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-medium">
                              <BookOpen className="w-3 h-3" />
                              Document {s.documentId.slice(-4)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {streamingText && (
                <div className="flex gap-4 max-w-4xl mx-auto">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 text-white font-bold text-[10px]">
                    AI
                  </div>
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed shadow-sm">
                    <p className="whitespace-pre-wrap">{streamingText}</p>
                    <span className="inline-block w-2 h-4 bg-blue-600 animate-pulse ml-1 align-middle" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 md:p-8 bg-zinc-50 dark:bg-black">
              <form onSubmit={sendMessage} className="max-w-4xl mx-auto relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything about your course materials..."
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 pr-16 shadow-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-zinc-500"
                />
                <button 
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:bg-zinc-400 transition-all shadow-lg shadow-blue-500/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
              <p className="text-center text-[10px] text-zinc-500 mt-4 uppercase tracking-widest font-bold">
                SmartScholar AI can make mistakes. Verify important facts.
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center text-blue-600">
              <MessageSquare className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Welcome to PLASU AI Chat</h2>
              <p className="text-zinc-500 max-w-sm">
                Select a course on the left and start a new session to begin chatting with your course materials.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-left space-y-2">
                <Hash className="w-5 h-5 text-indigo-600" />
                <p className="text-sm font-bold">Course Specific</p>
                <p className="text-xs text-zinc-500">Only answers using your course's handouts and past questions.</p>
              </div>
              <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-left space-y-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-bold">Verified Sources</p>
                <p className="text-xs text-zinc-500">Every response lists the specific documents used as references.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
