'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  BookOpen, 
  Users, 
  FileUp, 
  ArrowUpRight, 
  GraduationCap, 
  Activity,
  ChevronRight,
  Plus
} from 'lucide-react'

type Course = {
  id: string
  name: string
  code: string
  department: { name: string }
  _count: { documents: number; exams: number }
}

export default function LecturerDashboard() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/lecturer/courses`)
      .then(res => res.json())
      .then(data => {
        setCourses(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="p-8">Loading dashboard...</div>

  return (
    <div className="p-4 md:p-8 space-y-12 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight">Lecturer Portal</h1>
          <p className="text-zinc-500">Monitor student progress and manage academic materials.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl font-bold hover:bg-zinc-200 transition-all">
            <FileUp className="w-5 h-5" />
            Upload Materials
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 transition-all">
            <Plus className="w-5 h-5" />
            New Course
          </button>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatItem icon={Users} label="Total Students" value="1,248" change="+12%" />
        <StatItem icon={BarChart3} label="Avg. Exam Score" value="68%" change="+5%" />
        <StatItem icon={BookOpen} label="Course Materials" value="142" change="+3" />
        <StatItem icon={Activity} label="Active Chats" value="482" change="+18%" />
      </div>

      {/* Courses List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-blue-600" />
          My Assigned Courses
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course.id} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 space-y-8 hover:border-blue-500 transition-all group">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-900 rounded-[1.25rem] flex items-center justify-center text-zinc-900 dark:text-white font-black text-lg">
                  {course.code.slice(0, 3)}
                </div>
                <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl text-zinc-400 group-hover:text-blue-600 transition-colors">
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold">{course.name}</h3>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{course.department.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-8 border-t border-zinc-100 dark:border-zinc-900">
                <div className="space-y-1">
                  <p className="text-2xl font-black">{course._count.documents}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Documents</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-black">{course._count.exams}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Simulations</p>
                </div>
              </div>

              <button className="w-full py-3 bg-zinc-50 dark:bg-zinc-900 hover:bg-blue-600 hover:text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                View Performance
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatItem({ icon: Icon, label, value, change }: { icon: any, label: string, value: string, change: string }) {
  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] space-y-4">
      <div className="flex justify-between items-start">
        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-xs font-black text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">
          {change}
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-black">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
      </div>
    </div>
  )
}
