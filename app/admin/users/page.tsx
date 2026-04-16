export const dynamic = "force-dynamic"

import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import UserAdmin from "@/components/UserAdmin"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function AdminUsersPage() {
  const session = await requireRole(["ADMIN"])
  const currentUserId = (session.user as any).id

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  const studentCount = users.filter((u) => u.role === "STUDENT").length
  const lecturerCount = users.filter((u) => u.role === "LECTURER").length
  const adminCount = users.filter((u) => u.role === "ADMIN").length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
            <p className="text-gray-600 mt-1">Create and manage student and lecturer accounts</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
            <p className="text-2xl font-bold text-green-700">{studentCount}</p>
            <p className="text-sm text-gray-600 mt-1">Students</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
            <p className="text-2xl font-bold text-blue-700">{lecturerCount}</p>
            <p className="text-sm text-gray-600 mt-1">Lecturers</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
            <p className="text-2xl font-bold text-red-700">{adminCount}</p>
            <p className="text-sm text-gray-600 mt-1">Admins</p>
          </div>
        </div>

        {/* User list with Add button */}
        <UserAdmin users={users as any} currentUserId={currentUserId} />
      </main>
    </div>
  )
}
