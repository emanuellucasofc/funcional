export type UserRole = 'ADMIN' | 'INSTRUCTOR'
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED'
export type AttendanceStatus = 'PRESENT' | 'ABSENT'
export type AlertType = 'WARNING' | 'ALERT' | 'CRITICAL'
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
}

export interface Class {
  id: string
  name: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  isActive: boolean
  createdAt: string
  _count?: { studentClasses: number }
}

export interface StudentClass {
  id: string
  studentId: string
  classId: string
  class: Class
}

export interface Student {
  id: string
  name: string
  birthDate?: string
  phone?: string
  email?: string
  enrollmentDate: string
  status: StudentStatus
  notes?: string
  createdAt: string
  studentClasses: StudentClass[]
}

export interface AttendanceRecord {
  id: string
  studentId: string
  classId: string
  date: string
  status: AttendanceStatus
  markedBy: string
  markedAt: string
  class?: Class
}

export interface Alert {
  id: string
  studentId: string
  type: AlertType
  message: string
  month: number
  year: number
  absences: number
  isRead: boolean
  createdAt: string
  student: {
    id: string
    name: string
  }
}

export interface AttendanceStudent {
  id: string
  name: string
  phone?: string
  attendance: AttendanceRecord | null
}

export interface AttendanceClass extends Class {
  students: AttendanceStudent[]
}

export interface FrequencyData {
  month: number
  year: number
  presences: number
  absences: number
  total: number
  percentage: number
  history: AttendanceRecord[]
}
