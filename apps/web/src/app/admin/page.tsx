'use client'

import { useState, useEffect } from 'react'
import {
  BookOpen, GraduationCap, Users, FileText, MessageSquare, ClipboardList,
  Loader2, Activity, Download, AlertTriangle, CheckCircle, Clock
} from 'lucide-react'
import { useSession } from 'next-auth/react'

export default function AdminDashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<any>(null)
  const [health, setHealth] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.accessToken) return
    const headers = { 'Authorization': `Bearer ${session.user.accessToken}` }

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/analytics/overview`, { headers }).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/analytics/courses`, { headers }).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/system/health`, { headers }).then(r => r.json())
    ]).then(([statsData, coursesData, healthData]) => {
      setStats(statsData)
      setCourses(Array.isArray(coursesData) ? coursesData : [])
      setHealth(healthData)
      setLoading(false)
    })
  }, [session])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
    </div>
  )

  const cards = [
    { label: 'Students', value: stats?.totalStudents ?? '-', icon: Users, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' },
    { label: 'Admins', value: stats?.totalAdmins ?? '-', icon: Users, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' },
    { label: 'Courses', value: stats?.totalCourses ?? '-', icon: BookOpen, color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' },
    { label: 'Documents', value: stats?.totalDocuments ?? '-', icon: FileText, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' },
    { label: 'Forum Posts', value: stats?.totalForumPosts ?? '-', icon: MessageSquare, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' },
    { label: 'Exam Sessions', value: stats?.totalExamSessions ?? '-', icon: ClipboardList, color: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' },
  ]

  async function downloadExport(entity: string) {
    const token = session?.user?.accessToken
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/export/${entity}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${entity}-export.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-zinc-500">Platform overview and management.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-zinc-500" />
            <h2 className="text-lg font-semibold">System Health</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-2xl font-bold">{health?.documents?.pending ?? '-'}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Pending Docs</p>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-600">
                <Clock className="w-4 h-4" />
                <span className="text-2xl font-bold">{health?.documents?.processing ?? '-'}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Processing</p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-2xl font-bold">{health?.documents?.failed ?? '-'}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Failed Docs</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600">
                <ClipboardList className="w-4 h-4" />
                <span className="text-2xl font-bold">{health?.totalQuestions ?? '-'}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Questions</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-5 h-5 text-zinc-500" />
            <h2 className="text-lg font-semibold">Data Export</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Users', entity: 'users' },
              { label: 'Courses', entity: 'courses' },
              { label: 'Departments', entity: 'departments' },
              { label: 'Documents', entity: 'documents' },
            ].map(item => (
              <button
                key={item.entity}
                onClick={() => downloadExport(item.entity)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Download className="w-4 h-4 text-zinc-400" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {courses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Course Performance</h2>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-3 font-semibold text-sm">Course</th>
                  <th className="px-6 py-3 font-semibold text-sm">Dept</th>
                  <th className="px-6 py-3 font-semibold text-sm">Documents</th>
                  <th className="px-6 py-3 font-semibold text-sm">Exams</th>
                  <th className="px-6 py-3 font-semibold text-sm">Forum Posts</th>
                  <th className="px-6 py-3 font-semibold text-sm">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {courses.map((course: any) => (
                  <tr key={course.id}>
                    <td className="px-6 py-4">
                      <span className="font-medium">{course.name}</span>
                      <span className="text-xs text-zinc-400 ml-2">{course.code}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{course.department}</td>
                    <td className="px-6 py-4">{course.documents}</td>
                    <td className="px-6 py-4">{course.examSessions}</td>
                    <td className="px-6 py-4">{course.forumPosts}</td>
                    <td className="px-6 py-4">
                      {course.averageScore !== null ? (
                        <span className={`text-sm font-medium ${course.averageScore >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                          {course.averageScore}%
                        </span>
                      ) : <span className="text-sm text-zinc-400">N/A</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
