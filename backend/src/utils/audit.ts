import { prisma } from '../lib/prisma'
import { Prisma } from '@prisma/client'

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  oldValue,
  newValue,
}: {
  userId: string
  action: string
  entity: string
  entityId: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
}) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      oldValue: oldValue ? (oldValue as Prisma.InputJsonValue) : undefined,
      newValue: newValue ? (newValue as Prisma.InputJsonValue) : undefined,
    },
  })
}
