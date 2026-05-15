'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Clock, ChevronLeft, ChevronRight, Send, AlertCircle, Loader2 } from 'lucide-react'

type Question = {
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

type Session = {
  id: string
  questions: Question[]
  totalQuestions: number
  course: { code: string; name: string }
}

export default function ExamSessionPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: sessionAuth } = useSession()
  const [session, setSession] = useState<Session | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionAuth?.user?.accessToken) return
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/exams/sessions/${id}`, {
      headers: { 'Authorization': `Bearer ${sessionAuth.user.accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setSession(data)
        setTimeLeft(data.totalQuestions * 60)
        setLoading(false)
      })
  }, [id, sessionAuth])

  useEffect(() => {
    if (timeLeft > 0 && !submitting) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
      return () => clearInterval(timer)
    } else if (timeLeft === 0 && session && !submitting) {
      submitExam()
    }
  }, [timeLeft, submitting, session])

  const submitExam = async () => {
    setSubmitting(true)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exams/sessions/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionAuth?.user?.accessToken}` },
      body: JSON.stringify({ answers })
    })
    router.push(`/exams/${id}/results`)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>
  if (!session) return <div className="p-8">Session not found</div>

  const currentQuestion = session.questions[currentIdx]

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col">
      {/* Top Bar */}
      <header className="h-20 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-8 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-lg font-black">{session.course.code} Mock Exam</h1>
            <p className="text-xs text-zinc-500">Question {currentIdx + 1} of {session.totalQuestions}</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-xl font-mono font-bold">
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
          <button 
            onClick={submitExam}
            disabled={submitting}
            className="px-6 py-2 bg-zinc-900 dark:bg-white dark:text-black text-white rounded-xl font-bold hover:scale-105 transition-transform"
          >
            {submitting ? 'Submitting...' : 'Finish Exam'}
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-zinc-200 dark:bg-zinc-800">
        <div 
          className="h-full bg-blue-600 transition-all duration-500" 
          style={{ width: `${((currentIdx + 1) / session.totalQuestions) * 100}%` }}
        />
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full p-8 md:p-12">
        <div className="space-y-12">
          {/* Question Text */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
              Multiple Choice
            </div>
            <h2 className="text-2xl font-bold leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-4">
            {currentQuestion.options.map((option, idx) => {
              const letter = String.fromCharCode(65 + idx)
              const isSelected = answers[currentIdx] === letter
              
              return (
                <button
                  key={idx}
                  onClick={() => setAnswers({ ...answers, [currentIdx]: letter })}
                  className={cn(
                    "flex items-center gap-4 p-6 rounded-3xl border-2 text-left transition-all group",
                    isSelected 
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20" 
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors",
                    isSelected ? "bg-blue-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200"
                  )}>
                    {letter}
                  </div>
                  <span className="font-semibold">{option}</span>
                </button>
              )
            })}
          </div>
        </div>
      </main>

      {/* Navigation Footer */}
      <footer className="h-24 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-8 flex items-center justify-center gap-4 sticky bottom-0">
        <button 
          onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
          disabled={currentIdx === 0}
          className="flex items-center gap-2 px-6 py-3 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        
        <div className="flex gap-2">
          {session.questions.map((_, idx) => (
            <div 
              key={idx}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                idx === currentIdx ? "bg-blue-600 w-6" : answers[idx] ? "bg-zinc-400" : "bg-zinc-200 dark:bg-zinc-800"
              )}
            />
          ))}
        </div>

        <button 
          onClick={() => {
            if (currentIdx === session.totalQuestions - 1) {
              submitExam()
            } else {
              setCurrentIdx(prev => prev + 1)
            }
          }}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white dark:text-black text-white rounded-2xl font-bold hover:scale-105 transition-transform"
        >
          {currentIdx === session.totalQuestions - 1 ? 'Finish' : 'Next Question'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
