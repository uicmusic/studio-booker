import { auth } from "@/lib/next-auth"
import { redirect } from "next/navigation"

type Role = "STUDENT" | "LECTURER" | "ADMIN"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin")
  }
  return session
}

export async function requireRole(roles: Role[]) {
  const session = await requireAuth()
  const userRole = (session.user as any).role
  
  if (!roles.includes(userRole)) {
    redirect("/unauthorized")
  }
  
  return session
}

export async function getCurrentUser() {
  const session = await auth()
  return session?.user || null
}
