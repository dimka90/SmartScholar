'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Send, Loader2, CheckCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'

const broadcastSchema = z.object({
  type: z.string(),
  title: z.string().min(2),
  body: z.string().min(10)
})

type BroadcastForm = z.infer<typeof broadcastSchema>

export default function NotificationsPage() {
  const { data: session } = useSession()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BroadcastForm>({
    resolver: zodResolver(broadcastSchema)
  })

  function headers() {
    return {
      'Authorization': `Bearer ${session?.user?.accessToken}`,
      'Content-Type': 'application/json'
    }
  }

  async function onSubmit(data: BroadcastForm) {
    setSaving(true)
    setError(null)
    setSuccess(null)

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/notifications/broadcast`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    })

    const result = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(result.message || 'Failed to send notification')
      return
    }

    setSuccess(result.message)
    reset({ type: 'announcement', title: '', body: '' })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Broadcast Notification</h1>
        <p className="text-sm text-zinc-500">Send a notification to all students on the platform.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
        {success && (
          <div className="flex items-center gap-2 p-3 text-sm text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            {success}
          </div>
        )}
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium">Type</label>
          <select {...register('type')} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm">
            <option value="announcement">Announcement</option>
            <option value="reminder">Reminder</option>
            <option value="alert">Alert</option>
            <option value="update">Update</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Title</label>
          <input {...register('title')} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" placeholder="e.g. Exam Schedule Update" />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Message</label>
          <textarea {...register('body')} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none" rows={5} placeholder="Write your notification message here..." />
          {errors.body && <p className="text-xs text-red-500">{errors.body.message}</p>}
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={!session?.user?.accessToken || saving} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {saving ? 'Sending...' : 'Broadcast'}
          </button>
        </div>
      </form>
    </div>
  )
}
