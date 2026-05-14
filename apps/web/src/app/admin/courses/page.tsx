'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Modal } from '@/components/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog'

const courseSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  level: z.number().min(100).max(900),
  semester: z.number().min(1).max(2),
  departmentId: z.string()
})

type CourseForm = z.infer<typeof courseSchema>

export default function CoursesPage() {
  const { data: session } = useSession()
  const [courses, setCourses] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CourseForm>({
    resolver: zodResolver(courseSchema)
  })

  function headers() {
    return {
      'Authorization': `Bearer ${session?.user?.accessToken}`,
      'Content-Type': 'application/json'
    }
  }

  const fetchData = useCallback(async () => {
    const [coursesRes, deptsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, { headers: headers() }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments`, { headers: headers() })
    ])
    if (!coursesRes.ok || !deptsRes.ok) return
    setCourses(await coursesRes.json())
    setDepartments(await deptsRes.json())
    setLoading(false)
  }, [session])

  useEffect(() => { if (session?.user?.accessToken) fetchData() }, [session, fetchData])

  function openCreate() {
    setEditing(null)
    reset({ name: '', code: '', level: 100, semester: 1, departmentId: '' })
    setModalOpen(true)
  }

  function openEdit(course: any) {
    setEditing(course)
    reset({
      name: course.name,
      code: course.code,
      level: course.level,
      semester: course.semester,
      departmentId: course.departmentId
    })
    setModalOpen(true)
  }

  async function onSubmit(data: CourseForm) {
    setSaving(true)
    const url = editing
      ? `${process.env.NEXT_PUBLIC_API_URL}/admin/courses/${editing.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/admin/courses`

    await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    })

    setSaving(false)
    setModalOpen(false)
    fetchData()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/courses/${deleteTarget.id}`, {
      method: 'DELETE',
      headers: headers()
    })
    setDeleteTarget(null)
    fetchData()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Courses</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Course
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-3 font-semibold text-sm">Name</th>
              <th className="px-6 py-3 font-semibold text-sm">Code</th>
              <th className="px-6 py-3 font-semibold text-sm">Level</th>
              <th className="px-6 py-3 font-semibold text-sm">Department</th>
              <th className="px-6 py-3 font-semibold text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {courses.map((course: any) => (
              <tr key={course.id}>
                <td className="px-6 py-4">{course.name}</td>
                <td className="px-6 py-4 font-mono text-sm">{course.code}</td>
                <td className="px-6 py-4">{course.level}L</td>
                <td className="px-6 py-4">{course.department?.name}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => openEdit(course)}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(course)}
                    className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                  No courses found. Click "Add Course" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Course' : 'Add Course'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Name</label>
            <input {...register('name')} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" placeholder="e.g. Artificial Intelligence" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Code</label>
            <input {...register('code')} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" placeholder="e.g. CSC401" />
            {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Level</label>
              <input type="number" {...register('level', { valueAsNumber: true })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" placeholder="e.g. 400" />
              {errors.level && <p className="text-xs text-red-500">{errors.level.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Semester</label>
              <select {...register('semester', { valueAsNumber: true })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm">
                <option value={1}>First Semester</option>
                <option value={2}>Second Semester</option>
              </select>
              {errors.semester && <p className="text-xs text-red-500">{errors.semester.message}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Department</label>
            <select {...register('departmentId')} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm">
              <option value="">Select a department</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
            {errors.departmentId && <p className="text-xs text-red-500">{errors.departmentId.message}</p>}
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
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </div>
  )
}
