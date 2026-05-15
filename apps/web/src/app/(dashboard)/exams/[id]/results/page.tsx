'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Trophy, CheckCircle2, XCircle, AlertCircle, ArrowLeft, RefreshCw, MessageSquare } from 'lucide-react'

type Question = {
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

type Session = {
  id: string
  score: number
  totalQuestions: number
  questions: Question[]
  answers: Record<string, string>
  course: { code: string }
}

export default function ExamResultsPage() {
  const { id } = useParams()
  const { data: sessionAuth } = useSession()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionAuth?.user?.accessToken) return
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/exams/sessions/${id}`, {
      headers: { 'Authorization': `Bearer ${sessionAuth.user.accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setSession(data)
        setLoading(false)
      })
  }, [id, sessionAuth])

  if (loading) return <div className="p-8">Loading...</div>
  if (!session) return <div className="p-8">Results not found</div>

  const percentage = Math.round((session.score / session.totalQuestions) * 100)
  const isPass = percentage >= 70

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12 pb-24">
      {/* Result Card */}
      <div className={cn(
        "rounded-[3rem] p-12 text-center space-y-8 shadow-2xl relative overflow-hidden border-4",
        isPass ? "bg-green-600 border-green-500 text-white" : "bg-orange-600 border-orange-500 text-white"
      )}>
        <div className="absolute top-0 left-0 w-full h-full bg-white/10 -skew-y-12 origin-top-left" />
        
        <div className="relative space-y-4">
          <div className="w-24 h-24 bg-white/20 rounded-[2rem] flex items-center justify-center mx-auto backdrop-blur-md">
            <Trophy className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black">
            {isPass ? 'Excellent Work!' : 'Keep Practicing!'}
          </h1>
          <p className="text-white/80 font-medium">You scored {session.score} out of {session.totalQuestions}</p>
        </div>

        <div className="relative">
          <span className="text-8xl font-black tabular-nums">{percentage}%</span>
        </div>

        <div className="relative flex justify-center gap-4">
          <Link 
            href="/exams"
            className="px-8 py-3 bg-white text-zinc-900 rounded-2xl font-bold hover:scale-105 transition-transform flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Exams
          </Link>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-black/20 hover:bg-black/30 backdrop-blur-md rounded-2xl font-bold hover:scale-105 transition-transform flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retake Exam
          </button>
        </div>
      </div>

      {/* Detailed Review */}
      <div className="space-y-8">
        <h2 className="text-2xl font-black">Detailed Review</h2>
        
        <div className="space-y-6">
          {session.questions.map((q, idx) => {
            const studentAns = session.answers[idx]
            const isCorrect = studentAns === q.correctAnswer

            return (
              <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 space-y-6 shadow-sm">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-lg font-bold leading-relaxed">{idx + 1}. {q.question}</h3>
                  {isCorrect ? (
                    <div className="shrink-0 bg-green-50 dark:bg-green-900/20 text-green-600 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Correct
                    </div>
                  ) : (
                    <div className="shrink-0 bg-red-50 dark:bg-red-900/20 text-red-600 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Incorrect
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.map((opt, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx)
                    const isCorrectOpt = letter === q.correctAnswer
                    const isSelectedOpt = letter === studentAns

                    return (
                      <div 
                        key={oIdx}
                        className={cn(
                          "p-4 rounded-xl border-2 text-sm font-medium flex items-center gap-3",
                          isCorrectOpt ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" :
                          isSelectedOpt && !isCorrect ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400" :
                          "border-zinc-100 dark:border-zinc-800 text-zinc-500"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold",
                          isCorrectOpt ? "bg-green-500 text-white" :
                          isSelectedOpt ? "bg-red-500 text-white" : "bg-zinc-100 dark:bg-zinc-800"
                        )}>
                          {letter}
                        </div>
                        {opt}
                      </div>
                    )
                  })}
                </div>

                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600">
                    <AlertCircle className="w-3 h-3" />
                    Explanation
                  </div>
                  <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-300">
                    {q.explanation}
                  </p>
                </div>

                <div className="flex justify-end">
                  <Link 
                    href={`/chat?question=${encodeURIComponent(q.question)}`}
                    className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-blue-600 transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Ask AI for more details
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
