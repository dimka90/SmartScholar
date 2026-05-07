import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const badges = [
    { name: 'First Steps', description: 'Ask your first question', iconUrl: '/badges/first-steps.png', criteria: {} },
    { name: 'Exam Ready', description: 'Complete 5 exam simulations', iconUrl: '/badges/exam-ready.png', criteria: {} },
    { name: 'Top Scorer', description: 'Score 90%+ on any exam', iconUrl: '/badges/top-scorer.png', criteria: {} },
    { name: 'Knowledge Sharer', description: 'Get 10 upvotes on forum posts', iconUrl: '/badges/knowledge-sharer.png', criteria: {} },
    { name: 'Scholar', description: 'Accumulate 500 points', iconUrl: '/badges/scholar.png', criteria: {} },
    { name: 'Power User', description: 'Log in 7 days in a row', iconUrl: '/badges/power-user.png', criteria: {} },
  ]

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    })
  }

  console.log('Seed completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
