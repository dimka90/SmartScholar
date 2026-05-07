import Link from 'next/link'
import { BookOpen, Zap, Users, GraduationCap, ChevronRight, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <span className="font-black text-xl tracking-tight">SmartScholar</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold hover:text-blue-600 transition-colors">
              Login
            </Link>
            <Link 
              href="/register" 
              className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full text-sm font-bold hover:opacity-90 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-full text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            AI-Powered Academic Intelligence
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1]">
            Master Your Studies with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Smart Intelligence.
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
            The ultimate companion for PLASU students. AI chat, smart handouts, automated mock exams, and collaborative study groups—all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/register" 
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              Start Learning Now
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              System Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 space-y-4 group hover:border-blue-500/50 transition-all">
            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-all">
              <Zap className="text-blue-600 group-hover:text-white w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">RAG AI Chat</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
              Upload your course handouts and chat with them. Our AI extracts context from your specific materials to provide 100% accurate answers.
            </p>
          </div>

          <div className="p-8 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 space-y-4 group hover:border-indigo-500/50 transition-all">
            <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 transition-all">
              <BookOpen className="text-indigo-600 group-hover:text-white w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Mock Exams</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
              Generate instant multiple-choice questions from your notes. Practice anytime and track your academic progress over time.
            </p>
          </div>

          <div className="p-8 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 space-y-4 group hover:border-violet-500/50 transition-all">
            <div className="w-12 h-12 bg-violet-600/10 rounded-2xl flex items-center justify-center group-hover:bg-violet-600 transition-all">
              <Users className="text-violet-600 group-hover:text-white w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Study Groups</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
              Connect with your classmates. Join course-specific groups to share resources, discuss topics, and excel together.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-200 dark:border-zinc-800 px-4 text-center">
        <p className="text-zinc-500 text-sm font-medium">
          © 2026 SmartScholar. Designed for PLASU Academic Intelligence.
        </p>
      </footer>
    </div>
  )
}
