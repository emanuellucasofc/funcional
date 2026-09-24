import { JWTPayload } from '../types'

export function createJWTPayload(
  userId: string,
  email: string,
  role: string,
  name: string
): JWTPayload {
  return {
    userId,
    email,
    role: role as any,
    name,
  }
}
