import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clean up
  await prisma.auditLog.deleteMany()
  await prisma.alert.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.studentClass.deleteMany()
  await prisma.student.deleteMany()
  await prisma.class.deleteMany()
  await prisma.user.deleteMany()
  await prisma.settings.deleteMany()

  // Settings
  await prisma.settings.create({
    data: {
      id: 'default',
      companyName: 'Treinamento de Funcional',
      warningAbsences: 2,
      alertAbsences: 3,
      criticalAbsences: 4,
    },
  })

  // Users
  const adminHash = await bcrypt.hash('admin123', 12)
  const instructorHash = await bcrypt.hash('instru123', 12)

  const admin = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@funcional.com',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  })

  await prisma.user.create({
    data: {
      name: 'João Instrutor',
      email: 'instrutor@funcional.com',
      passwordHash: instructorHash,
      role: 'INSTRUCTOR',
    },
  })

  console.log('✅ Users created')

  // Classes — 3 days × 3 times
  const classDefs = [
    { name: 'Treinamento de Funcional', dayOfWeek: 'MONDAY' as const, startTime: '18:30', endTime: '19:30' },
    { name: 'Treinamento de Funcional', dayOfWeek: 'MONDAY' as const, startTime: '19:30', endTime: '20:30' },
    { name: 'Treinamento de Funcional', dayOfWeek: 'MONDAY' as const, startTime: '20:30', endTime: '21:30' },
    { name: 'Treinamento de Funcional', dayOfWeek: 'WEDNESDAY' as const, startTime: '18:30', endTime: '19:30' },
    { name: 'Treinamento de Funcional', dayOfWeek: 'WEDNESDAY' as const, startTime: '19:30', endTime: '20:30' },
    { name: 'Treinamento de Funcional', dayOfWeek: 'WEDNESDAY' as const, startTime: '20:30', endTime: '21:30' },
    { name: 'Treinamento de Funcional', dayOfWeek: 'FRIDAY' as const, startTime: '18:30', endTime: '19:30' },
    { name: 'Treinamento de Funcional', dayOfWeek: 'FRIDAY' as const, startTime: '19:30', endTime: '20:30' },
    { name: 'Treinamento de Funcional', dayOfWeek: 'FRIDAY' as const, startTime: '20:30', endTime: '21:30' },
  ]

  const classes = await Promise.all(classDefs.map((c) => prisma.class.create({ data: c })))

  const getClass = (day: string, time: string) =>
    classes.find((c) => c.dayOfWeek === day && c.startTime === time)!

  console.log('✅ Classes created')

  // Students
  const studentsData = [
    { name: 'Maria Silva', phone: '(21) 99999-0001', email: 'maria@email.com', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], time: '19:30' },
    { name: 'João Santos', phone: '(21) 99999-0002', email: 'joao@email.com', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], time: '18:30' },
    { name: 'Carlos Oliveira', phone: '(21) 99999-0003', email: 'carlos@email.com', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], time: '20:30' },
    { name: 'Ana Paula Souza', phone: '(21) 99999-0004', email: 'ana@email.com', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], time: '18:30' },
    { name: 'Pedro Almeida', phone: '(21) 99999-0005', email: 'pedro@email.com', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], time: '19:30' },
    { name: 'Luciana Costa', phone: '(21) 99999-0006', email: 'luciana@email.com', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], time: '20:30' },
    { name: 'Rafael Ferreira', phone: '(21) 99999-0007', email: 'rafael@email.com', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], time: '18:30' },
    { name: 'Fernanda Lima', phone: '(21) 99999-0008', email: 'fernanda@email.com', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], time: '19:30' },
    { name: 'Rodrigo Martins', phone: '(21) 99999-0009', email: 'rodrigo@email.com', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], time: '20:30' },
    { name: 'Juliana Pereira', phone: '(21) 99999-0010', email: 'juliana@email.com', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], time: '18:30' },
    { name: 'Marcelo Rocha', phone: '(21) 99999-0011', email: 'marcelo@email.com', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], time: '19:30' },
    { name: 'Tatiana Gomes', phone: '(21) 99999-0012', email: 'tatiana@email.com', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], time: '20:30' },
    { name: 'Bruno Nascimento', phone: '(21) 99999-0013', email: 'bruno@email.com', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], time: '18:30' },
    { name: 'Camila Ribeiro', phone: '(21) 99999-0014', email: 'camila@email.com', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], time: '19:30' },
    { name: 'Diego Carvalho', phone: '(21) 99999-0015', email: 'diego@email.com', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], time: '20:30' },
    { name: 'Aline Moreira', phone: '(21) 99999-0016', email: 'aline@email.com', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], time: '18:30' },
    { name: 'Thiago Barbosa', phone: '(21) 99999-0017', email: 'thiago@email.com', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], time: '19:30' },
    { name: 'Patricia Correia', phone: '(21) 99999-0018', email: 'patricia@email.com', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'], time: '20:30', status: 'INACTIVE' as const },
  ]

  const students = await Promise.all(
    studentsData.map((s) =>
      prisma.student.create({
        data: {
          name: s.name,
          phone: s.phone,
          email: s.email,
          status: s.status ?? 'ACTIVE',
          enrollmentDate: new Date('2026-01-15'),
          studentClasses: {
            create: s.days.map((day) => ({
              classId: getClass(day, s.time).id,
            })),
          },
        },
      })
    )
  )

  console.log('✅ Students created')

  // Attendance for September 2026 (Mon/Wed/Fri)
  // Training dates in September 2026: 7,9,11,14,16,18,21
  const septDates = [
    { date: '2026-09-01', day: 'MONDAY' },
    { date: '2026-09-03', day: 'WEDNESDAY' },
    { date: '2026-09-05', day: 'FRIDAY' },
    { date: '2026-09-08', day: 'MONDAY' },
    { date: '2026-09-10', day: 'WEDNESDAY' },
    { date: '2026-09-12', day: 'FRIDAY' },
    { date: '2026-09-15', day: 'MONDAY' },
    { date: '2026-09-17', day: 'WEDNESDAY' },
    { date: '2026-09-19', day: 'FRIDAY' },
    { date: '2026-09-22', day: 'MONDAY' },
  ]

  // Absence patterns by student index: 0=no absences, 1=1 absence, 2-3=2 absences, 4-5=3 absences, 6+=4+ absences
  const absencePatterns: Record<number, number[]> = {
    0: [], // Maria — no absences
    1: [2], // João — 1 absence (3rd date)
    2: [1, 5], // Carlos — 2 absences
    3: [0, 4], // Ana — 2 absences
    4: [1, 3, 6], // Pedro — 3 absences (ALERT)
    5: [0, 2, 5], // Luciana — 3 absences (ALERT)
    6: [0, 1, 3, 6], // Rafael — 4 absences (CRITICAL)
    7: [0, 2, 4, 7], // Fernanda — 4 absences (CRITICAL)
    8: [1], // Rodrigo — 1 absence
    9: [], // Juliana — no absences
    10: [3], // Marcelo — 1 absence
    11: [0, 5], // Tatiana — 2 absences (WARNING)
    12: [2, 4, 7], // Bruno — 3 absences (ALERT)
    13: [], // Camila — no absences
    14: [1, 3], // Diego — 2 absences (WARNING)
    15: [], // Aline — no absences
    16: [0, 2, 5, 8], // Thiago — 4 absences (CRITICAL)
  }

  for (let si = 0; si < 17; si++) {
    const student = students[si]
    const studentData = studentsData[si]
    const absences = absencePatterns[si] ?? []

    for (let di = 0; di < septDates.length; di++) {
      const { date, day } = septDates[di]
      const cls = getClass(day, studentData.time)
      const isAbsent = absences.includes(di)

      await prisma.attendance.create({
        data: {
          studentId: student.id,
          classId: cls.id,
          date: new Date(date + 'T00:00:00.000Z'),
          status: isAbsent ? 'ABSENT' : 'PRESENT',
          markedBy: admin.id,
        },
      })
    }
  }

  console.log('✅ Attendance records created')

  // Generate alerts
  const { generateAlertsForStudent } = await import('../src/utils/alerts')
  for (let si = 0; si < 17; si++) {
    await generateAlertsForStudent(students[si].id, 9, 2026)
  }

  console.log('✅ Alerts generated')
  console.log('')
  console.log('🎉 Seed completed!')
  console.log('')
  console.log('👤 Credentials:')
  console.log('  Admin:     admin@funcional.com    / admin123')
  console.log('  Instrutor: instrutor@funcional.com / instru123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
