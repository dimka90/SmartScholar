import { Settings, BookOpen, GraduationCap, Users } from 'lucide-react'

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight">Admin Dashboard</h1>
        <p className="text-zinc-500 max-w-2xl">
          Welcome to the SmartScholar Administration Panel. Manage the platform's core curriculum data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg">Departments</h3>
          <p className="text-sm text-zinc-500 mt-1">Manage academic faculties and departments.</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg">Courses</h3>
          <p className="text-sm text-zinc-500 mt-1">Configure courses and assign them to departments.</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg">System Metrics</h3>
          <p className="text-sm text-zinc-500 mt-1">Platform health and user statistics (Coming Soon).</p>
        </div>
      </div>
    </div>
  )
}
