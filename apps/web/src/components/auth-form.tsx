'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'

const authSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().optional()
})

type AuthFormProps = {
  type: 'login' | 'register'
}

export function AuthForm({ type }: AuthFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema)
  })

  async function onSubmit(values: z.infer<typeof authSchema>) {
    setLoading(true)
    setError(null)

    if (type === 'register') {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        body: JSON.stringify(values),
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.message || 'Registration failed')
        setLoading(false)
        return
      }
    }

    const res = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false
    })

    if (res?.error) {
      setError('Invalid credentials')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {type === 'login' ? 'Welcome back' : 'Create an account'}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          {type === 'login'
            ? 'Enter your credentials to access your account'
            : 'Enter your details to get started'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 rounded-lg">
            {error}
          </div>
        )}

        {type === 'register' && (
          <div className="space-y-1">
            <label className="text-sm font-medium">Full Name</label>
            <input
              {...register('name')}
              className="w-full px-4 py-2 rounded-lg border dark:bg-zinc-800 dark:border-zinc-700"
              placeholder="John Doe"
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input
            {...register('email')}
            type="email"
            className="w-full px-4 py-2 rounded-lg border dark:bg-zinc-800 dark:border-zinc-700"
            placeholder="m@example.com"
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Password</label>
          <input
            {...register('password')}
            type="password"
            className="w-full px-4 py-2 rounded-lg border dark:bg-zinc-800 dark:border-zinc-700"
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        {type === 'register' && (
          <div className="space-y-1">
            <label className="text-sm font-medium">Role</label>
            <select
              {...register('role')}
              className="w-full px-4 py-2 rounded-lg border dark:bg-zinc-800 dark:border-zinc-700"
            >
              <option value="STUDENT">Student</option>
              <option value="LECTURER">Lecturer</option>
            </select>
          </div>
        )}

        <button
          disabled={loading}
          type="submit"
          className="w-full py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {type === 'login' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      <div className="text-center text-sm text-zinc-500">
        {type === 'login' ? (
          <p>
            Don't have an account?{' '}
            <a href="/register" className="text-blue-600 hover:underline">
              Sign up
            </a>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:underline">
              Log in
            </a>
          </p>
        )}
      </div>
    </div>
  )
}
