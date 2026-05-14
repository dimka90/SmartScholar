'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Plus, Pencil, Trash2, Award, XCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Modal } from '@/components/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function BadgesPage() {
  const { data: session } = useSession()
  const [badges, setBadges] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [awardModal, setAwardModal] = useState<any | null>(null)
  const [badgeUsers, setBadgeUsers] = useState<any[]>([])
  const [loadingBadgeUsers, setLoadingBadgeUsers] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formIcon, setFormIcon] = useState('')
  const [formCriteria, setFormCriteria] = useState('{}')

  function headers() {
    return { 'Authorization': `Bearer ${session?.user?.accessToken}`, 'Content-Type': 'application/json' }
  }

  const fetchBadges = useCallback(async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/badges`, { headers: headers() })
    if (!res.ok) return
    setBadges(await res.json())
    setLoading(false)
  }, [session])

  const fetchUsers = useCallback(async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users?limit=200`, { headers: headers() })
    if (!res.ok) return
    const data = await res.json()
    setUsers(data.users)
  }, [session])

  useEffect(() => { if (session?.user?.accessToken) fetchBadges() }, [fetchBadges])

  function openCreate() {
    setEditing(null)
    setFormName(''); setFormDesc(''); setFormIcon(''); setFormCriteria('{}')
    setModalOpen(true)
  }

  function openEdit(b: any) {
    setEditing(b)
    setFormName(b.name); setFormDesc(b.description); setFormIcon(b.iconUrl)
    setFormCriteria(JSON.stringify(b.criteria, null, 2))
    setModalOpen(true)
  }

  async function save() {
    const url = editing
      ? `${process.env.NEXT_PUBLIC_API_URL}/admin/badges/${editing.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/admin/badges`
    const method = editing ? 'PUT' : 'POST'

    let criteria
    try { criteria = JSON.parse(formCriteria) } catch { criteria = {} }

    await fetch(url, {
      method,
      headers: headers(),
      body: JSON.stringify({ name: formName, description: formDesc, iconUrl: formIcon, criteria })
    })
    setModalOpen(false)
    fetchBadges()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/badges/${deleteTarget.id}`, {
      method: 'DELETE', headers: headers()
    })
    setDeleteTarget(null)
    fetchBadges()
  }

  async function openAward(badge: any) {
    setAwardModal(badge)
    setLoadingBadgeUsers(true)
    fetchUsers()
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/badges/${badge.id}/users`, {
      headers: headers()
    })
    if (res.ok) setBadgeUsers(await res.json())
    setLoadingBadgeUsers(false)
  }

  async function awardBadge(userId: string) {
    if (!awardModal) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/badges/${awardModal.id}/award`, {
      method: 'POST', headers: headers(), body: JSON.stringify({ userId })
    })
    openAward(awardModal)
  }

  async function revokeBadge(userId: string) {
    if (!awardModal) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/badges/${awardModal.id}/users/${userId}`, {
      method: 'DELETE', headers: headers()
    })
    openAward(awardModal)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Badges</h1>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Badge
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((b: any) => (
          <div key={b.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img src={b.iconUrl} alt={b.name} className="w-10 h-10 rounded-lg"
                  onError={(e: any) => { e.target.style.display = 'none' }} />
                <div>
                  <h3 className="font-semibold">{b.name}</h3>
                  <p className="text-xs text-zinc-500">{b.description}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-xs text-zinc-500">{b._count?.users || 0} awarded</span>
              <div className="flex gap-2">
                <button onClick={() => openAward(b)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Award
                </button>
                <button onClick={() => openEdit(b)}
                  className="text-xs text-zinc-600 hover:text-zinc-700 font-medium flex items-center gap-1">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => setDeleteTarget(b)}
                  className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {badges.length === 0 && (
          <div className="col-span-full text-center py-16 text-zinc-500">No badges created yet.</div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Badge' : 'Create Badge'}>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Name</label>
            <input value={formName} onChange={e => setFormName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <input value={formDesc} onChange={e => setFormDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Icon URL</label>
            <input value={formIcon} onChange={e => setFormIcon(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" placeholder="/badges/scholar.png" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Criteria (JSON)</label>
            <textarea value={formCriteria} onChange={e => setFormCriteria(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono resize-none" rows={3} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800">Cancel</button>
            <button onClick={save}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700">{editing ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!awardModal} onClose={() => setAwardModal(null)} title={`Award "${awardModal?.name || ''}"`}>
        {loadingBadgeUsers ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-500">Current holders ({badgeUsers.length})</h3>
              {badgeUsers.length === 0 ? (
                <p className="text-sm text-zinc-400">No users have this badge yet.</p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {badgeUsers.map((bu: any) => (
                    <div key={bu.id} className="flex items-center justify-between py-1">
                      <span className="text-sm">{bu.user?.name} <span className="text-zinc-400">({bu.user?.email})</span></span>
                      <button onClick={() => revokeBadge(bu.user.id)}
                        className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3">
              <h3 className="text-sm font-medium mb-2">Award to user</h3>
              <select
                onChange={e => { if (e.target.value) awardBadge(e.target.value); e.target.value = '' }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                defaultValue=""
              >
                <option value="" disabled>Select a user...</option>
                {users
                  .filter((u: any) => !badgeUsers.find((bu: any) => bu.user?.id === u.id))
                  .map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
              </select>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Badge"
        message={`Delete "${deleteTarget?.name}"? This will remove it from all users.`}
      />
    </div>
  )
}
