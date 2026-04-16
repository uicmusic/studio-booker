export const dynamic = "force-dynamic"

import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import ApproveButtons from "@/components/ApproveButtons"
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Package, Building, Users } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

export default async function AdminDashboard() {
  await requireRole(["LECTURER", "ADMIN"])

  // Fetch all pending bookings
  const pendingBookings = await prisma.booking.findMany({
    where: { status: "PENDING" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      studio: true,
      equipment: {
        include: {
          equipment: true,
        },
      },
    },
    orderBy: { startDate: "asc" },
  })

  // Fetch recent bookings
  const recentBookings = await prisma.booking.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      studio: true,
      equipment: {
        include: {
          equipment: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  // Fetch stats
  const stats = await prisma.booking.groupBy({
    by: ["status"],
    _count: true,
  })

  const statsMap: Record<string, number> = {}
  stats.forEach((s: { status: string; _count: number }) => {
    statsMap[s.status] = s._count
  })

  // Equipment stats
  const totalEquipment = await prisma.equipment.aggregate({
    _sum: {
      quantity: true,
      available: true,
    },
  })

  const studios = await prisma.studio.findMany({
    where: { isActive: true },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      case "COMPLETED":
        return "bg-blue-100 text-blue-800"
      case "CANCELLED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and manage studio bookings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              <span className="text-3xl font-bold text-gray-900">
                {statsMap["PENDING"] || 0}
              </span>
            </div>
            <p className="text-gray-600">Pending</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="text-3xl font-bold text-gray-900">
                {statsMap["APPROVED"] || 0}
              </span>
            </div>
            <p className="text-gray-600">Approved</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">
                {statsMap["COMPLETED"] || 0}
              </span>
            </div>
            <p className="text-gray-600">Completed</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3 mb-2">
              <Building className="w-6 h-6 text-indigo-600" />
              <span className="text-3xl font-bold text-gray-900">
                {studios.length}
              </span>
            </div>
            <p className="text-gray-600">Studios</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-6 h-6 text-purple-600" />
              <span className="text-3xl font-bold text-gray-900">
                {totalEquipment._sum.quantity || 0}
              </span>
            </div>
            <p className="text-gray-600">Equipment</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link
            href="/admin/users"
            className="flex items-center gap-4 bg-white p-5 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Manage Users</p>
              <p className="text-sm text-gray-500">Add or remove student & lecturer accounts</p>
            </div>
          </Link>
          <Link
            href="/inventory"
            className="flex items-center gap-4 bg-white p-5 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Manage Inventory</p>
              <p className="text-sm text-gray-500">Add, edit, or remove equipment</p>
            </div>
          </Link>
        </div>

        {/* Pending Bookings */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Pending Approvals ({pendingBookings.length})
            </h2>
          </div>

          {pendingBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <p>No pending bookings. All caught up!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{booking.studio.name}</h3>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-600">{booking.user.name}</span>
                        <span className="text-sm text-gray-500">({booking.user.email})</span>
                      </div>

                      <p className="text-gray-600 mb-3">{booking.purpose}</p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(booking.startDate), "MMMM dd, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {format(new Date(booking.startDate), "HH:mm")} - {format(new Date(booking.endDate), "HH:mm")}
                          </span>
                        </div>
                      </div>

                      {booking.equipment.length > 0 && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-700">Equipment Requested:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {booking.equipment.map((be) => (
                              <span
                                key={be.id}
                                className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full"
                              >
                                {be.equipment.name} x{be.quantity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <ApproveButtons
                      bookingId={booking.id}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-sm text-indigo-600 hover:text-indigo-700">
              View All →
            </Link>
          </div>

          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{booking.studio.name}</h3>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{booking.user.name} • {booking.purpose}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(booking.startDate), "MMM dd, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(new Date(booking.startDate), "HH:mm")} - {format(new Date(booking.endDate), "HH:mm")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
