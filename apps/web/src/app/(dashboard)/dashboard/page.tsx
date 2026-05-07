'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Trophy, 
  Target, 
  Zap, 
  Clock, 
  ArrowRight, 
  BookOpen, 
  MessageSquare, 
  GraduationCap,
  Sparkles,
  TrendingUp
} from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    points: 0,
    rank: 0,
    docsProcessed: 0,
    examPasses: 0
  })
  const [recentExams, setRecentExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch stats and recent activity
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/leaderboard/me`).then(res => res.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/exams/sessions`).then(res => res.json())
    ]).then(([userData, examsData]) => {
      setStats({
        points: userData.points,
        rank: userData.rank,
        docsProcessed: 42, // Mock for now
        examPasses: examsData.filter((e: any) => e.score / e.totalQuestions >= 0.7).length
      })
      setRecentExams(examsData.slice(0, 3))
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-4 md:p-8 space-y-12 max-w-7xl mx-auto pb-20">
      {/* Hero Section */}
      <section className="relative rounded-[3rem] bg-zinc-900 dark:bg-zinc-900 text-white p-8 md:p-12 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/20 blur-[120px] -z-0" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              AI-Powered Learning
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight">
              Master your courses with <span className="text-blue-500">Academic Intelligence.</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-md">
              Your personalized study companion for Plateau State University. Chat with documents, take mock exams, and level up.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/chat" className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2">
                Launch AI Chat
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/exams" className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-bold transition-all border border-zinc-700 flex items-center gap-2">
                Practice Exams
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={Trophy} label="Global Rank" value={`#${stats.rank}`} color="text-yellow-500" />
            <StatCard icon={Zap} label="Learning Points" value={stats.points.toString()} color="text-blue-500" />
            <StatCard icon={BookOpen} label="Docs Mastered" value={stats.docsProcessed.toString()} color="text-indigo-500" />
            <StatCard icon={Target} label="Exam Passes" value={stats.examPasses.toString()} color="text-green-500" />
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recommended Actions */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Recommended for You
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionCard 
              icon={MessageSquare} 
              title="Continue Chatting" 
              desc="Pick up where you left off in your CSC 401 session."
              link="/chat"
              badge="Active Session"
            />
            <ActionCard 
              icon={GraduationCap} 
              title="New Mock Exam" 
              desc="AI has generated 15 new questions for GST 101."
              link="/exams"
              badge="New Content"
            />
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Recent Exam Performance</h3>
              <Link href="/exams" className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-widest">View All</Link>
            </div>
            <div className="space-y-4">
              {recentExams.map((exam, i) => (
                <div key={i} className="flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-2xl transition-colors group">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center font-bold text-xs">
                    {exam.course.code}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">Attempted {new Date(exam.createdAt).toLocaleDateString()}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1.5 flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full", exam.score / exam.totalQuestions >= 0.7 ? "bg-green-500" : "bg-orange-500")}
                          style={{ width: `${(exam.score / exam.totalQuestions) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-zinc-500">{Math.round((exam.score / exam.totalQuestions) * 100)}%</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Daily Streak
            </h3>
            <div className="flex justify-between items-center">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-black",
                    i === 3 ? "bg-blue-600 border-blue-600 text-white" : "border-zinc-200 dark:border-zinc-800 text-zinc-400"
                  )}>
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-center text-zinc-500 font-medium italic">
              Keep learning every day to boost your rank!
            </p>
          </div>

          <div className="bg-blue-600/5 dark:bg-blue-600/10 border border-blue-600/20 rounded-[2.5rem] p-8 space-y-6">
            <h3 className="text-xl font-bold">Upcoming Seminars</h3>
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-blue-600/10 shadow-sm">
                <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Today @ 2:00 PM</p>
                <p className="font-bold text-sm">AI in Computer Science</p>
                <p className="text-xs text-zinc-500 mt-1">Main Hall, PLASU</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700 p-6 rounded-3xl space-y-2">
      <Icon className={cn("w-6 h-6", color)} />
      <div className="space-y-0.5">
        <p className="text-2xl font-black">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
      </div>
    </div>
  )
}

function ActionCard({ icon: Icon, title, desc, link, badge }: { icon: any, title: string, desc: string, link: string, badge: string }) {
  return (
    <Link href={link} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] space-y-4 hover:border-blue-500 transition-all group shadow-sm">
      <div className="flex justify-between items-start">
        <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-900 dark:text-white group-hover:bg-blue-600 group-hover:text-white transition-colors">
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg uppercase tracking-widest">{badge}</span>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
      </div>
    </Link>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}

function ChevronRight(props: any) {
  return <svg {...props} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
