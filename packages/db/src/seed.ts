import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Create Departments
  const science = await prisma.department.upsert({
    where: { code: 'SCI' },
    update: {},
    create: { 
      name: 'Faculty of Science',
      code: 'SCI'
    }
  })

  const gst = await prisma.department.upsert({
    where: { code: 'GST' },
    update: {},
    create: { 
      name: 'General Studies',
      code: 'GST'
    }
  })

  // 2. Create Courses
  const courses = [
    { code: 'CSC101', name: 'Introduction to Computer Science', deptId: science.id, level: 100, semester: 1 },
    { code: 'CSC401', name: 'Artificial Intelligence', deptId: science.id, level: 400, semester: 1 },
    { code: 'GST101', name: 'Use of English', deptId: gst.id, level: 100, semester: 1 },
    { code: 'GST102', name: 'Philosophy and Logic', deptId: gst.id, level: 100, semester: 2 },
  ]

  for (const c of courses) {
    await prisma.course.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        name: c.name,
        departmentId: c.deptId,
        level: c.level,
        semester: c.semester
      }
    })
  }

  // 3. Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@smartscholar.com' },
    update: {},
    create: {
      email: 'admin@smartscholar.com',
      name: 'System Admin',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      points: 1000
    }
  })

  // 4. Create Student User
  const studentPassword = await bcrypt.hash('student123', 10)
  await prisma.user.upsert({
    where: { email: 'student@smartscholar.com' },
    update: {},
    create: {
      email: 'student@smartscholar.com',
      name: 'John Student',
      passwordHash: studentPassword,
      role: Role.STUDENT,
      points: 50
    }
  })

  // 5. Create Badges
  const badges = [
    { name: 'Scholar', description: 'Earned 500 points', iconUrl: '/badges/scholar.png', criteria: { points: 500 } },
    { name: 'Fast Learner', description: 'Passed 5 mock exams', iconUrl: '/badges/fast.png', criteria: { exams: 5 } },
    { name: 'Helper', description: 'Answered 10 forum posts', iconUrl: '/badges/helper.png', criteria: { replies: 10 } },
  ]

  for (const b of badges) {
    await prisma.badge.upsert({
      where: { name: b.name },
      update: {},
      create: b
    })
  }

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
