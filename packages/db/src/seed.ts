import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ──────────────────────────────────────────────
  // 1. Departments
  // ──────────────────────────────────────────────
  const deptData = [
    { name: 'Faculty of Science', code: 'SCI' },
    { name: 'General Studies', code: 'GST' },
    { name: 'Faculty of Engineering', code: 'ENG' },
    { name: 'Faculty of Arts', code: 'ART' },
    { name: 'Faculty of Management Sciences', code: 'MGT' },
  ]

  const depts: Record<string, string> = {}
  for (const d of deptData) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: {},
      create: d,
    })
    depts[d.code] = dept.id
  }

  // ──────────────────────────────────────────────
  // 2. Courses
  // ──────────────────────────────────────────────
  const courseData = [
    { code: 'CSC101', name: 'Introduction to Computer Science', dept: 'SCI', level: 100, semester: 1 },
    { code: 'CSC201', name: 'Data Structures & Algorithms', dept: 'SCI', level: 200, semester: 1 },
    { code: 'CSC301', name: 'Database Management Systems', dept: 'SCI', level: 300, semester: 2 },
    { code: 'CSC401', name: 'Artificial Intelligence', dept: 'SCI', level: 400, semester: 1 },
    { code: 'MAT101', name: 'General Mathematics I', dept: 'SCI', level: 100, semester: 1 },
    { code: 'GST101', name: 'Use of English', dept: 'GST', level: 100, semester: 1 },
    { code: 'GST102', name: 'Philosophy and Logic', dept: 'GST', level: 100, semester: 2 },
    { code: 'ENG101', name: 'Introduction to Engineering', dept: 'ENG', level: 100, semester: 1 },
    { code: 'ENG401', name: 'Engineering Project Management', dept: 'ENG', level: 400, semester: 2 },
    { code: 'ART101', name: 'Introduction to African Literature', dept: 'ART', level: 100, semester: 1 },
    { code: 'MGT101', name: 'Principles of Management', dept: 'MGT', level: 100, semester: 1 },
    { code: 'MGT301', name: 'Entrepreneurship', dept: 'MGT', level: 300, semester: 2 },
  ]

  const courseIds: Record<string, string> = {}
  for (const c of courseData) {
    const course = await prisma.course.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        name: c.name,
        departmentId: depts[c.dept],
        level: c.level,
        semester: c.semester,
      },
    })
    courseIds[c.code] = course.id
  }

  // ──────────────────────────────────────────────
  // 3. Users
  // ──────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10)
  const studentPassword = await bcrypt.hash('student123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartscholar.com' },
    update: {},
    create: {
      email: 'admin@smartscholar.com',
      name: 'System Admin',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      points: 1000,
    },
  })

  const student = await prisma.user.upsert({
    where: { email: 'student@smartscholar.com' },
    update: {},
    create: {
      email: 'student@smartscholar.com',
      name: 'John Student',
      passwordHash: studentPassword,
      role: Role.STUDENT,
      points: 50,
    },
  })

  const student2 = await prisma.user.upsert({
    where: { email: 'jane@smartscholar.com' },
    update: {},
    create: {
      email: 'jane@smartscholar.com',
      name: 'Jane Doe',
      passwordHash: studentPassword,
      role: Role.STUDENT,
      points: 120,
    },
  })

  // ──────────────────────────────────────────────
  // 4. Badges
  // ──────────────────────────────────────────────
  const badgeData = [
    { name: 'Scholar', description: 'Earned 500 points', iconUrl: '/badges/scholar.png', criteria: { points: 500 } },
    { name: 'Fast Learner', description: 'Passed 5 mock exams', iconUrl: '/badges/fast.png', criteria: { exams: 5 } },
    { name: 'Helper', description: 'Answered 10 forum posts', iconUrl: '/badges/helper.png', criteria: { replies: 10 } },
    { name: 'Top Contributor', description: 'Contributed 50 forum posts', iconUrl: '/badges/contributor.png', criteria: { posts: 50 } },
    { name: 'Document Guru', description: 'Uploaded 10 documents', iconUrl: '/badges/document.png', criteria: { documents: 10 } },
  ]

  for (const b of badgeData) {
    await prisma.badge.upsert({
      where: { name: b.name },
      update: {},
      create: b,
    })
  }

  // ──────────────────────────────────────────────
  // 5. AI Providers
  // ──────────────────────────────────────────────
  const groqKey = process.env.GROQ_API_KEY || ''
  const geminiKey = process.env.GEMINI_API_KEY || ''
  const openaiKey = process.env.OPENAI_API_KEY || ''

  const aiProviderData = [
    {
      name: 'Groq',
      provider: 'groq',
      apiKey: groqKey,
      baseUrl: 'https://api.groq.com/openai/v1',
      chatModel: 'llama-3.1-8b-instant',
      embedModel: null,
      isActive: !!groqKey,
      isEmbedProvider: false,
    },
    {
      name: 'Gemini',
      provider: 'google',
      apiKey: geminiKey,
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      chatModel: 'gemini-2.0-flash',
      embedModel: 'gemini-embedding-2',
      isActive: false,
      isEmbedProvider: !!geminiKey,
    },
    {
      name: 'OpenAI',
      provider: 'openai',
      apiKey: openaiKey,
      baseUrl: 'https://api.openai.com/v1',
      chatModel: 'gpt-4o-mini',
      embedModel: 'text-embedding-3-small',
      isActive: false,
      isEmbedProvider: false,
    },
  ]

  for (const p of aiProviderData) {
    await prisma.aiProvider.upsert({
      where: { name: p.name },
      update: {
        apiKey: p.apiKey,
        baseUrl: p.baseUrl,
        chatModel: p.chatModel,
        embedModel: p.embedModel,
        isActive: p.isActive,
        isEmbedProvider: p.isEmbedProvider,
      },
      create: p,
    })
  }

  // ──────────────────────────────────────────────
  // 6. Forum Posts & Replies
  // ──────────────────────────────────────────────
  const posts = [
    {
      title: 'Understanding Recursion in CSC101',
      content: 'Can someone explain how recursion works with a simple example? I am struggling with the concept of a function calling itself.',
      courseCode: 'CSC101',
      userId: student.id,
      tags: ['recursion', 'help', 'csc101'],
    },
    {
      title: 'Tips for GST101 Use of English Exam',
      content: 'What are the key areas to focus on for the upcoming GST101 exam? Any past question patterns?',
      courseCode: 'GST101',
      userId: student2.id,
      tags: ['exam', 'gst101', 'tips'],
    },
    {
      title: 'Best resources for Data Structures',
      content: 'I would recommend the CLRS book and LeetCode for practicing data structures. Anyone have other suggestions?',
      courseCode: 'CSC201',
      userId: student.id,
      tags: ['resources', 'datastructures'],
    },
  ]

  for (const p of posts) {
    const existing = await prisma.forumPost.findFirst({
      where: { title: p.title, courseId: courseIds[p.courseCode] },
    })
    if (existing) continue

    const post = await prisma.forumPost.create({
      data: {
        title: p.title,
        content: p.content,
        courseId: courseIds[p.courseCode],
        userId: p.userId,
        tags: p.tags,
      },
    })

    if (p === posts[0]) {
      await prisma.forumReply.createMany({
        data: [
          {
            postId: post.id,
            userId: student2.id,
            content: 'Think of recursion like a set of Russian dolls. Each doll contains a smaller version of itself until you reach the smallest one (base case).',
          },
          {
            postId: post.id,
            userId: student.id,
            content: 'A classic example is factorial: factorial(5) = 5 * factorial(4). Each call reduces n until n=1 (base case).',
          },
        ],
        skipDuplicates: true,
      })
    }

    if (p === posts[1]) {
      await prisma.forumReply.createMany({
        data: [
          {
            postId: post.id,
            userId: student.id,
            content: 'Focus on comprehension, summary writing, and grammar. Past questions often repeat, so practice with them!',
          },
        ],
        skipDuplicates: true,
      })
    }
  }

  // ──────────────────────────────────────────────
  // 7. Notifications
  // ──────────────────────────────────────────────
  const notificationData = [
    {
      userId: student.id,
      type: 'welcome',
      title: 'Welcome to SmartScholar!',
      body: 'Start exploring courses, documents, and study groups to boost your learning.',
    },
    {
      userId: student.id,
      type: 'badge',
      title: 'Badge Earned!',
      body: 'Congratulations! You earned the "Helper" badge for your forum contributions.',
      metadata: { badge: 'Helper' },
    },
    {
      userId: student.id,
      type: 'exam',
      title: 'Exam Ready',
      body: 'Your mock exam for CSC101 is ready. You scored 70% — keep it up!',
      metadata: { course: 'CSC101', score: 70 },
    },
    {
      userId: student2.id,
      type: 'welcome',
      title: 'Welcome to SmartScholar!',
      body: 'Start exploring courses, documents, and study groups to boost your learning.',
    },
  ]

  for (const n of notificationData) {
    const existing = await prisma.notification.findFirst({
      where: { userId: n.userId, title: n.title },
    })
    if (!existing) {
      await prisma.notification.create({ data: n })
    }
  }

  // ──────────────────────────────────────────────
  // 8. Activity Logs
  // ──────────────────────────────────────────────
  await prisma.activityLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'LOGIN',
        metadata: { ip: '127.0.0.1' },
      },
      {
        userId: student.id,
        action: 'LOGIN',
        metadata: { ip: '127.0.0.1' },
      },
      {
        userId: student.id,
        action: 'CREATE_FORUM_POST',
        metadata: { title: 'Understanding Recursion in CSC101' },
      },
      {
        userId: student2.id,
        action: 'CREATE_FORUM_REPLY',
        metadata: { postTitle: 'Understanding Recursion in CSC101' },
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
