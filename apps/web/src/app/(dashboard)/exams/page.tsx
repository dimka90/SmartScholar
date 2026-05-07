'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GraduationCap, Trophy, History, Play, CheckCircle, Clock, ChevronRight } from 'lucide-react'

type Course = {
  id: string
  name: string
  code: string
  _count: { extractedQuestions: number }
}

type ExamSession = {
  id: string
  score: number
  totalQuestions: number
  createdAt: string
  completedAt: string | null
  course: { code: string }
}

export default function ExamsLobbyPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [pastExams, setPastExams] = useState<ExamSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`).then(res => res.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/exams/sessions`).then(res => res.json())
    ]).then(([coursesData, examsData]) => {
      setCourses(coursesData)
      setPastExams(examsData)
      setLoading(false)
    })
  }, [])

  const startExam = async (courseId: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exams/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId })
    })
    const session = await res.json()
    window.location.href = `/exams/${session.id}`
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight">Exam Simulation</h1>
        <p className="text-zinc-500 max-w-2xl">
          Test your knowledge with AI-generated mock exams based on your actual course materials and past questions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Course Selection */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            Available Mock Exams
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map(course => (
              <div key={course.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl hover:border-blue-500 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 font-bold">
                    {course.code.slice(0, 3)}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    {course._count.extractedQuestions} Questions
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{course.code}</h3>
                <p className="text-sm text-zinc-500 mb-6">{course.name}</p>
                
                <button 
                  onClick={() => startExam(course.id)}
                  disabled={course._count.extractedQuestions === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 dark:bg-zinc-800 hover:bg-blue-600 text-white rounded-2xl font-bold transition-all disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Start Mock Exam
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Stats & History */}
        <div className="space-y-10">
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Recent Attempts
            </h2>
            
            <div className="space-y-3">
              {pastExams.length > 0 ? pastExams.map(exam => (
                <div key={exam.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs",
                    (exam.score / exam.totalQuestions) >= 0.7 ? "bg-green-50 dark:bg-green-900/20 text-green-600" : "bg-orange-50 dark:bg-orange-900/20 text-orange-600"
                  )}>
                    {Math.round((exam.score / exam.totalQuestions) * 100)}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{exam.course.code}</p>
                    <p className="text-[10px] text-zinc-500">{new Date(exam.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Link href={`/exams/${exam.id}/results`} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </Link>
                </div>
              )) : (
                <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800">
                  <Clock className="w-8 h-8 mx-auto opacity-20 mb-2" />
                  <p className="text-xs text-zinc-500">No past attempts yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-3xl p-8 text-white space-y-4 shadow-xl shadow-blue-500/20">
            <Trophy className="w-10 h-10" />
            <div className="space-y-1">
              <h3 className="text-xl font-black">Exam Legend</h3>
              <p className="text-sm text-blue-100">Maintain a score of 70% or higher to earn "Exam Ready" badge!</p>
            </div>
            <div className="pt-4 flex items-center gap-4 border-t border-white/20">
              <div className="text-center">
                <p className="text-2xl font-black">{pastExams.filter(e => e.score / e.totalQuestions >= 0.7).length}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">Passes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black">{pastExams.length}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">Attempts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
