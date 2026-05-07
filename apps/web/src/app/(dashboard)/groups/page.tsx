'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Search, Plus, Filter, MessageSquare, Shield, Globe, Lock, ChevronRight } from 'lucide-react'

type Group = {
  id: string
  name: string
  course: { code: string }
  creator: { name: string }
  _count: { members: number }
}

import { useSession } from 'next-auth/react'

export default function GroupsLobbyPage() {
  const { data: session } = useSession()
  const [groups, setGroups] = useState<Group[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const fetchGroups = async () => {
    if (!session?.user) return
    const headers = {
      'Authorization': `Bearer ${(session.user as any).accessToken}`
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups`, { headers })
      const data = await res.json()
      setGroups(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Groups fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!session?.user) return

    const headers = {
      'Authorization': `Bearer ${(session.user as any).accessToken}`
    }

    fetchGroups()

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, { headers })
      .then(res => res.json())
      .then(data => {
        const coursesData = Array.isArray(data) ? data : []
        setCourses(coursesData)
        if (coursesData.length > 0) setSelectedCourseId(coursesData[0].id)
      })
  }, [session])

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName || !selectedCourseId || isCreating) return

    setIsCreating(true)
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(session?.user as any).accessToken}`
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newGroupName,
          courseId: selectedCourseId
        })
      })

      if (res.ok) {
        setIsModalOpen(false)
        setNewGroupName('')
        fetchGroups()
      }
    } catch (err) {
      console.error('Failed to create group:', err)
    } finally {
      setIsCreating(false)
    }
  }

  if (loading) return <div className="p-8">Loading groups...</div>

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight">Study Groups</h1>
          <p className="text-zinc-500">Form teams, chat in real-time, and study together.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white dark:text-black text-white rounded-2xl font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create Group
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black">Create Study Group</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-2">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Group Name</label>
                <input 
                  type="text" 
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. CSC 401 Study Squad"
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Related Course</label>
                <select 
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                  required
                >
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.code} - {course.name}</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit" 
                disabled={isCreating}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCreating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Launch Group
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Main Feed */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-zinc-50 dark:bg-zinc-950 rounded-xl">
              <Search className="w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search groups by course or name..." 
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-zinc-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map(group => (
              <Link 
                key={group.id} 
                href={`/groups/${group.id}`}
                className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl hover:border-blue-500 transition-all group shadow-sm"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 font-bold">
                    {group.course?.code?.slice(0, 3) || '???'}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <Users className="w-3 h-3" />
                    {group._count?.members || 0} Members
                  </div>
                </div>

                <div className="space-y-1 mb-6">
                  <h3 className="text-xl font-black group-hover:text-blue-600 transition-colors">{group.name}</h3>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{group.course?.code} Discussion</p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-zinc-50 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                      {group.creator?.name?.slice(0, 2).toUpperCase() || '??'}
                    </div>
                    <span className="text-xs text-zinc-500">by {group.creator?.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-blue-600 transition-all group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-10">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 space-y-6">
            <h3 className="text-lg font-black flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              Group Rules
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3 text-xs text-zinc-500 leading-relaxed">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                Academic focus only. No spam.
              </li>
              <li className="flex gap-3 text-xs text-zinc-500 leading-relaxed">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                Respect your peers and moderators.
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white space-y-4 shadow-xl shadow-blue-500/20">
            <Globe className="w-10 h-10" />
            <h3 className="text-xl font-black">Find Your Crew</h3>
            <p className="text-sm opacity-80 leading-relaxed">
              Study groups are 2.5x more effective for exam preparation. Join one today!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
