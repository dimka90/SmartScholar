import { PrismaClient } from '@smartscholar/db'

const prisma = new PrismaClient()

export async function awardPoints(userId: string, amount: number, action: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      points: { increment: amount },
      activityLogs: {
        create: {
          action,
          metadata: { pointsAwarded: amount }
        }
      }
    }
  })
  
  await checkAndAwardBadges(userId)
}

async function checkAndAwardBadges(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { _count: { select: { chatSessions: true, examSessions: true, badges: true } } }
  })

  if (!user) return

  const earnedBadgeIds = user.badges.map(b => b.badgeId)

  // Scholar Badge (500 points)
  if (user.points >= 500) {
    await awardBadgeIfNotEarned(userId, 'Scholar', earnedBadgeIds)
  }

  // First Steps (First chat session)
  if (user._count.chatSessions >= 1) {
    await awardBadgeIfNotEarned(userId, 'First Steps', earnedBadgeIds)
  }
}

async function awardBadgeIfNotEarned(userId: string, badgeName: string, earnedBadgeIds: string[]) {
  const badge = await prisma.badge.findUnique({ where: { name: badgeName } })
  if (badge && !earnedBadgeIds.includes(badge.id)) {
    await prisma.userBadge.create({
      data: { userId, badgeId: badge.id }
    })
    
    await prisma.notification.create({
      data: {
        userId,
        type: 'BADGE_AWARDED',
        title: 'New Badge Earned!',
        body: `Congratulations! You've earned the ${badgeName} badge.`
      }
    })
  }
}
