'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Plus, Pencil, Trash2, CheckCircle, XCircle, Zap, Play, Database } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Modal } from '@/components/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog'

const PROVIDER_TYPES = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google / Gemini' },
  { value: 'groq', label: 'Groq' },
  { value: 'togetherai', label: 'Together AI' },
] as const

interface AiProvider {
  id: string
  name: string
  provider: string
  apiKey: string
  baseUrl: string | null
  chatModel: string
  embedModel: string | null
  isActive: boolean
  isEmbedProvider: boolean
}

export default function ProvidersPage() {
  const { data: session } = useSession()
  const [providers, setProviders] = useState<AiProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AiProvider | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AiProvider | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null)

  const [formName, setFormName] = useState('')
  const [formProvider, setFormProvider] = useState('openai')
  const [formApiKey, setFormApiKey] = useState('')
  const [formBaseUrl, setFormBaseUrl] = useState('')
  const [formChatModel, setFormChatModel] = useState('')
  const [formEmbedModel, setFormEmbedModel] = useState('')

  function headers() {
    return { 'Authorization': `Bearer ${session?.user?.accessToken}`, 'Content-Type': 'application/json' }
  }

  const fetchProviders = useCallback(async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/providers`, { headers: headers() })
    if (!res.ok) return
    setProviders(await res.json())
    setLoading(false)
  }, [session])

  useEffect(() => { if (session?.user?.accessToken) fetchProviders() }, [fetchProviders])

  function openCreate() {
    setEditing(null)
    setFormName(''); setFormProvider('togetherai'); setFormApiKey(''); setFormBaseUrl('')
    setFormChatModel('meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo')
    setFormEmbedModel('BAAI/bge-large-en-v1.5')
    setModalOpen(true)
  }

  function openEdit(p: AiProvider) {
    setEditing(p)
    setFormName(p.name); setFormProvider(p.provider); setFormApiKey(p.apiKey)
    setFormBaseUrl(p.baseUrl || ''); setFormChatModel(p.chatModel); setFormEmbedModel(p.embedModel || '')
    setModalOpen(true)
  }

  async function save() {
    const url = editing
      ? `${process.env.NEXT_PUBLIC_API_URL}/admin/providers/${editing.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/admin/providers`
    const method = editing ? 'PUT' : 'POST'

    const body: any = { name: formName, provider: formProvider, apiKey: formApiKey, chatModel: formChatModel }
    if (formBaseUrl) body.baseUrl = formBaseUrl
    if (formEmbedModel) body.embedModel = formEmbedModel

    await fetch(url, { method, headers: headers(), body: JSON.stringify(body) })
    setModalOpen(false)
    fetchProviders()
  }

  async function setActive(id: string) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/providers/${id}/set-active`, {
      method: 'GET', headers: headers()
    })
    fetchProviders()
  }

  async function setEmbed(id: string) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/providers/${id}/set-embed`, {
      method: 'GET', headers: headers()
    })
    fetchProviders()
  }

  async function testConnection(id: string) {
    setTestingId(id)
    setTestResult(null)
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/providers/${id}/test`, {
      headers: { 'Authorization': `Bearer ${session?.user?.accessToken}` }
    })
    const data = await res.json()
    setTestingId(null)
    setTestResult({ id, success: data.success, message: data.success ? data.response : data.error })
    setTimeout(() => setTestResult(null), 6000)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/providers/${deleteTarget.id}`, {
      method: 'DELETE', headers: headers()
    })
    setDeleteTarget(null)
    fetchProviders()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">AI Providers</h1>
          <p className="text-sm text-zinc-500 mt-1">Set one provider as chat provider (Active) and another as Embedding Provider.</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Provider
        </button>
      </div>

      {testResult && (
        <div className={`flex items-center gap-2 p-3 text-sm rounded-lg ${
          testResult.success
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        }`}>
          {testResult.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {testResult.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {providers.map((p) => (
          <div key={p.id} className={`bg-white dark:bg-zinc-900 border rounded-xl p-5 ${
            p.isActive ? 'border-purple-400 dark:border-purple-600' :
            p.isEmbedProvider ? 'border-emerald-400 dark:border-emerald-600' :
            'border-zinc-200 dark:border-zinc-800'
          }`}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{p.name}</h3>
                  {p.isActive && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                      Chat Active
                    </span>
                  )}
                  {p.isEmbedProvider && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                      Embed Provider
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500">
                  {PROVIDER_TYPES.find(t => t.value === p.provider)?.label || p.provider}
                  {' · Chat: '}{p.chatModel}{p.embedModel ? ` · Embed: ${p.embedModel}` : ''}
                </p>
                <p className="text-xs text-zinc-400 font-mono">
                  {p.baseUrl ? p.baseUrl : 'Default API'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => testConnection(p.id)} disabled={testingId === p.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors">
                  {testingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                  Test
                </button>
                {!p.isActive && (
                  <button onClick={() => setActive(p.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                    <Zap className="w-3 h-3" /> Activate Chat
                  </button>
                )}
                {p.embedModel && !p.isEmbedProvider && (
                  <button onClick={() => setEmbed(p.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors">
                    <Database className="w-3 h-3" /> Use Embeddings
                  </button>
                )}
                <button onClick={() => openEdit(p)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => setDeleteTarget(p)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {providers.length === 0 && (
          <div className="text-center py-16 text-zinc-500">
            <Zap className="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
            <p className="font-medium">No AI providers configured</p>
            <p className="text-sm">Add a Together AI provider for embeddings, or any other provider for chat.</p>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Provider' : 'Add Provider'}>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Name</label>
            <input value={formName} onChange={e => setFormName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" placeholder="e.g. Together AI Embed" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Provider Type</label>
            <select value={formProvider} onChange={e => setFormProvider(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm">
              {PROVIDER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">API Key</label>
            <input value={formApiKey} onChange={e => setFormApiKey(e.target.value)} type="password"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" placeholder="tgp_v1_..." />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Base URL (optional)</label>
            <input value={formBaseUrl} onChange={e => setFormBaseUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" placeholder="https://api.together.xyz/v1" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Chat Model</label>
            <input value={formChatModel} onChange={e => setFormChatModel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" placeholder="meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Embedding Model</label>
            <input value={formEmbedModel} onChange={e => setFormEmbedModel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" placeholder="BAAI/bge-large-en-v1.5" />
            <p className="text-xs text-zinc-400">Set this to use this provider for embeddings. Leave empty for chat-only providers.</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800">Cancel</button>
            <button onClick={save}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700">{editing ? 'Update' : 'Add'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Provider"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  )
}
