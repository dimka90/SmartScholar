'use client'

import { useState, useEffect } from 'react'
import { Trophy, Medal, Star, Target, Zap, Users, ChevronUp, Award, MessageSquare } from 'lucide-react'

type Badge = {
  id: string
  name: string
  iconUrl: string
}

type User = {
  id: string
  name: string
  points: number
  rank?: number
  badges: { badge: Badge }[]
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/leaderboard`).then(res => res.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/leaderboard/me`).then(res => res.json())
    ]).then(([lbData, meData]) => {
      setLeaderboard(lbData)
      setCurrentUser(meData)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="p-8">Loading leaderboard...</div>

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-12 pb-24">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
          The Hall of Scholars
        </h1>
        <p className="text-zinc-500 font-medium">
          Compete with your peers at PLASU. Earn points by asking questions, sharing notes, and passing mock exams.
        </p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-4xl mx-auto py-8">
        {leaderboard.slice(0, 3).map((user, i) => {
          const rank = i + 1
          const isFirst = rank === 1
          const isSecond = rank === 2
          const isThird = rank === 3

          return (
            <div 
              key={user.id} 
              className={cn(
                "relative flex flex-col items-center gap-4 transition-all hover:-translate-y-2",
                isFirst ? "order-2 md:mb-8" : isSecond ? "order-1" : "order-3"
              )}
            >
              <div className="relative">
                <div className={cn(
                  "w-24 h-24 rounded-full border-4 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800",
                  isFirst ? "border-yellow-400 w-32 h-32" : isSecond ? "border-zinc-300" : "border-orange-400"
                )}>
                  <span className="text-2xl font-black opacity-20">{user.name.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className={cn(
                  "absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg",
                  isFirst ? "bg-yellow-400" : isSecond ? "bg-zinc-400" : "bg-orange-500"
                )}>
                  <Trophy className="w-5 h-5" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className={cn("font-black", isFirst ? "text-xl" : "text-lg")}>{user.name}</p>
                <div className="flex items-center justify-center gap-1 text-blue-600 font-black uppercase tracking-widest text-[10px]">
                  <Zap className="w-3 h-3 fill-current" />
                  {user.points} Points
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Full Leaderboard Table */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Active Scholars
          </h2>
          
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Rank</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Scholar</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {leaderboard.map((user, i) => (
                  <tr key={user.id} className={cn(
                    "hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group",
                    user.id === currentUser?.id ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                  )}>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "font-black text-sm",
                        (i + 1) <= 3 ? "text-blue-600" : "text-zinc-400"
                      )}>#{i + 1}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{user.name}</p>
                          <div className="flex gap-1 mt-1">
                            {user.badges.slice(0, 3).map((b, bi) => (
                              <div key={bi} title={b.badge.name} className="w-4 h-4 bg-yellow-400/20 rounded-full flex items-center justify-center">
                                <Award className="w-2.5 h-2.5 text-yellow-600" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="font-black text-sm text-blue-600">{user.points}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="space-y-8">
          <div className="bg-zinc-900 dark:bg-zinc-900 rounded-[2.5rem] p-8 text-white space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl -z-0" />
            
            <div className="relative z-10 space-y-4">
              <h2 className="text-xl font-black">Your Progress</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20">
                  #{currentUser?.rank}
                </div>
                <div>
                  <p className="text-lg font-bold">Currently {currentUser?.rank === 1 ? 'King' : 'Scholar'}</p>
                  <p className="text-xs text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <ChevronUp className="w-3 h-3" />
                    Top 5% this week
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1 text-center">
                <p className="text-2xl font-black">{currentUser?.points}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Total Points</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1 text-center">
                <p className="text-2xl font-black">{currentUser?.badges.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Badges</p>
              </div>
            </div>

            <div className="relative z-10 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest opacity-50">Recently Earned Badges</h3>
              <div className="flex flex-wrap gap-3">
                {currentUser?.badges.map((b, i) => (
                  <div key={i} className="group relative">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-yellow-400/20 transition-colors border border-white/5">
                      <Award className="w-6 h-6 text-yellow-400" />
                    </div>
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {b.badge.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              How to earn points?
            </h3>
            <ul className="space-y-4">
              <PointMethod icon={MessageSquare} label="Answer Forum Post" points="+20" />
              <PointMethod icon={Target} label="Pass Mock Exam" points="+50" />
              <PointMethod icon={Zap} label="Daily Login" points="+10" />
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function PointMethod({ icon: Icon, label, points }: { icon: any, label: string, points: string }) {
  return (
    <li className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-zinc-500" />
        </div>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      </div>
      <span className="text-xs font-black text-blue-600">{points}</span>
    </li>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
