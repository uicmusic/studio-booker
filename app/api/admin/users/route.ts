import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"
import { auth } from "@/lib/next-auth"

function requireAdmin() {
  return auth().then((session) => {
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return null
  })
}

export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })
  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { name, email, password, role } = body

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  const safeRole = role === "LECTURER" ? "LECTURER" : "STUDENT"

  // Create in Supabase Auth
  const { data, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { name: name.trim(), role: safeRole },
  })

  if (createErr) {
    return NextResponse.json({ error: createErr.message }, { status: 400 })
  }

  // Wait for trigger to populate public.users (up to ~1.8s)
  let dbUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
  for (let i = 0; i < 12 && !dbUser; i++) {
    await new Promise((r) => setTimeout(r, 150))
    dbUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
  }

  // Fallback: create manually if trigger missed
  if (!dbUser) {
    try {
      dbUser = await prisma.user.create({
        data: {
          id: data.user.id,
          email: email.trim().toLowerCase(),
          name: name.trim(),
          role: safeRole,
        },
      })
    } catch (e: any) {
      if (e?.code === "P2002") {
        dbUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
      }
      if (!dbUser) {
        console.error("[admin/users] failed to sync public.users", e)
        return NextResponse.json({ error: "User created in Auth but DB sync failed" }, { status: 500 })
      }
    }
  }

  return NextResponse.json(dbUser, { status: 201 })
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 })

  // Prevent deleting yourself
  if ((session.user as any).id === id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
  }

  // Delete from Supabase Auth
  const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (authErr) {
    console.error("[admin/users] deleteUser auth error", authErr.message)
    // Continue to delete from DB even if auth delete fails (user may not exist in auth)
  }

  // Delete from public.users (cascade will handle related bookings? No — just delete user row)
  await prisma.user.delete({ where: { id } }).catch(() => null)

  return NextResponse.json({ ok: true })
}
