'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare, Users, TrendingUp, Search, Plus, Filter, MessageCircle, ThumbsUp, Tag } from 'lucide-react'

type Post = {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  upvotes: number
  user: { name: string; avatarUrl: string | null }
  _count: { replies: number }
}

type LeaderboardUser = {
  id: string
  name: string
  avatarUrl: string | null
  points: number
}

import { useSession } from 'next-auth/react'

export default function ForumLobbyPage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) return

    const headers = {
      'Authorization': `Bearer ${session.user.accessToken}`
    }

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/forum/posts`, { headers }).then(res => res.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/forum/leaderboard`, { headers }).then(res => res.json())
    ])
      .then(([postsData, leaderboardData]) => {
        setPosts(Array.isArray(postsData) ? postsData : [])
        setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Forum fetch error:', err)
        setLoading(false)
      })
  }, [session])

  if (loading) return <div className="p-8">Loading forum...</div>

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight">Student Forum</h1>
          <p className="text-zinc-500">Discuss courses, share notes, and collaborate with peers.</p>
        </div>
        <Link 
          href="/forum/new" 
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create New Post
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Main Feed */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-zinc-50 dark:bg-zinc-950 rounded-xl">
              <Search className="w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search discussions..." 
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-zinc-500"
              />
            </div>
            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-500 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {posts.map(post => (
              <Link 
                key={post.id} 
                href={`/forum/${post.id}`}
                className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl hover:border-blue-500 transition-all group"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-500">
                      {post.user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{post.user.name}</p>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {post.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="text-xl font-black mb-2 group-hover:text-blue-600 transition-colors">{post.title}</h3>
                <p className="text-zinc-500 text-sm line-clamp-2 mb-6">
                  {post.content}
                </p>

                <div className="flex items-center gap-6 pt-6 border-t border-zinc-50 dark:border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-500 text-sm font-bold">
                    <ThumbsUp className="w-4 h-4" />
                    {post.upvotes}
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500 text-sm font-bold">
                    <MessageCircle className="w-4 h-4" />
                    {post._count.replies} Replies
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-10">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 space-y-6">
            <h3 className="text-lg font-black flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Trending Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {['Exams', 'GST101', 'CSC401', 'Handouts', 'Project', 'Seminar'].map(topic => (
                <button key={topic} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all">
                  #{topic}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-3xl p-8 text-white space-y-4 shadow-xl shadow-blue-500/20">
            <Users className="w-10 h-10" />
            <h3 className="text-xl font-black">Top Contributors</h3>
            <div className="space-y-4">
              {leaderboard.map(user => (
                <div key={user.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px]">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{user.name}</p>
                    <p className="text-[10px] opacity-70">{user.points} Karma</p>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <p className="text-sm opacity-70">No contributors yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
