import { UserRole, StudentStatus, DayOfWeek, AttendanceStatus, AlertType } from '@prisma/client'

export { UserRole, StudentStatus, DayOfWeek, AttendanceStatus, AlertType }

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  name: string
}

export interface AuthenticatedRequest {
  user: JWTPayload
}
