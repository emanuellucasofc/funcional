import { prisma } from '../lib/prisma'
import { AlertType } from '../types'

export async function generateAlertsForStudent(
  studentId: string,
  month: number,
  year: number
) {
  const settings = await prisma.settings.findUnique({ where: { id: 'default' } })
  const warningLimit = settings?.warningAbsences ?? 2
  const alertLimit = settings?.alertAbsences ?? 3
  const criticalLimit = settings?.criticalAbsences ?? 4

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  const absencesCount = await prisma.attendance.count({
    where: {
      studentId,
      status: 'ABSENT',
      date: { gte: startDate, lte: endDate },
    },
  })

  if (absencesCount < warningLimit) return

  let type: AlertType
  let message: string
  const student = await prisma.student.findUnique({ where: { id: studentId } })
  const monthName = new Date(year, month - 1, 1).toLocaleString('pt-BR', { month: 'long' })

  if (absencesCount >= criticalLimit) {
    type = 'CRITICAL'
    message = `${student?.name} possui ${absencesCount} faltas no mês de ${monthName} — frequência crítica.`
  } else if (absencesCount >= alertLimit) {
    type = 'ALERT'
    message = `${student?.name} atingiu ${absencesCount} faltas no mês de ${monthName}.`
  } else {
    type = 'WARNING'
    message = `${student?.name} possui ${absencesCount} faltas no mês de ${monthName} — atenção.`
  }

  // Upsert: only one alert per student per month
  const existing = await prisma.alert.findFirst({
    where: { studentId, month, year },
    orderBy: { createdAt: 'desc' },
  })

  if (existing) {
    await prisma.alert.update({
      where: { id: existing.id },
      data: { type, message, absences: absencesCount, isRead: false },
    })
  } else {
    await prisma.alert.create({
      data: { studentId, type, message, month, year, absences: absencesCount },
    })
  }
}
