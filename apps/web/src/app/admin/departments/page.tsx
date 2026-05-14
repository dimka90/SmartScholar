'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Modal } from '@/components/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog'

const departmentSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().optional()
})

type DepartmentForm = z.infer<typeof departmentSchema>

export default function DepartmentsPage() {
  const { data: session } = useSession()
  const [depts, setDepts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DepartmentForm>({
    resolver: zodResolver(departmentSchema)
  })

  function headers() {
    return {
      'Authorization': `Bearer ${session?.user?.accessToken}`,
      'Content-Type': 'application/json'
    }
  }

  const fetchDepts = useCallback(async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments`, {
      headers: headers()
    })
    if (!res.ok) return
    const data = await res.json()
    setDepts(data)
    setLoading(false)
  }, [session])

  useEffect(() => { if (session?.user?.accessToken) fetchDepts() }, [session, fetchDepts])

  function openCreate() {
    setEditing(null)
    reset({ name: '', code: '', description: '' })
    setModalOpen(true)
  }

  function openEdit(dept: any) {
    setEditing(dept)
    reset({ name: dept.name, code: dept.code, description: dept.description || '' })
    setModalOpen(true)
  }

  async function onSubmit(data: DepartmentForm) {
    setSaving(true)
    const url = editing
      ? `${process.env.NEXT_PUBLIC_API_URL}/admin/departments/${editing.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/admin/departments`

    await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    })

    setSaving(false)
    setModalOpen(false)
    fetchDepts()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/departments/${deleteTarget.id}`, {
      method: 'DELETE',
      headers: headers()
    })
    setDeleteTarget(null)
    fetchDepts()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Departments</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-3 font-semibold text-sm">Name</th>
              <th className="px-6 py-3 font-semibold text-sm">Code</th>
              <th className="px-6 py-3 font-semibold text-sm">Courses</th>
              <th className="px-6 py-3 font-semibold text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {depts.map((dept: any) => (
              <tr key={dept.id}>
                <td className="px-6 py-4">{dept.name}</td>
                <td className="px-6 py-4 font-mono text-sm">{dept.code}</td>
                <td className="px-6 py-4">{dept._count?.courses || 0}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => openEdit(dept)}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(dept)}
                    className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {depts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                  No departments found. Click "Add Department" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Name</label>
            <input {...register('name')} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" placeholder="e.g. Faculty of Science" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Code</label>
            <input {...register('code')} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" placeholder="e.g. SCI" />
            {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <textarea {...register('description')} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none" rows={3} placeholder="Optional description" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Department"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </div>
  )
}
