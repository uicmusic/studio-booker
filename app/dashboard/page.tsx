import Navbar from "@/components/Navbar"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus } from "lucide-react"
import { format } from "date-fns"

export default async function Dashboard() {
  const session = await requireAuth()
  const userId = (session.user as any).id
  const userRole = (session.user as any).role

  // Fetch user's recent bookings
  const bookings = await prisma.booking.findMany({
    where: { userId },
    include: {
      studio: true,
      equipment: {
        include: {
          equipment: true,
        },
      },
    },
    orderBy: { startDate: "desc" },
    take: 5,
  })

  // Fetch available studios
  const studios = await prisma.studio.findMany({
    where: { isActive: true },
  })

  // Fetch stats
  const stats = await prisma.booking.groupBy({
    by: ["status"],
    where: { userId },
    _count: true,
  })

  const statsMap: Record<string, number> = {}
  stats.forEach((s: { status: string; _count: number }) => {
    statsMap[s.status] = s._count
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "REJECTED":
        return <XCircle className="w-5 h-5 text-red-600" />
      case "COMPLETED":
        return <CheckCircle className="w-5 h-5 text-blue-600" />
      case "CANCELLED":
        return <XCircle className="w-5 h-5 text-gray-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Welcome back, {session.user?.name}!</p>
          </div>
          <Link
            href="/bookings/new"
            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white text-sm sm:text-lg font-medium rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="sm:inline">New Booking</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
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
              <XCircle className="w-6 h-6 text-red-600" />
              <span className="text-3xl font-bold text-gray-900">
                {(statsMap["REJECTED"] || 0) + (statsMap["CANCELLED"] || 0)}
              </span>
            </div>
            <p className="text-gray-600">Rejected/Cancelled</p>
          </div>
        </div>

        {/* Available Studios */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Available Studios</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {studios.map((studio) => (
              <div key={studio.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col h-full">
                <h3 className="font-semibold text-gray-900 mb-2">{studio.name}</h3>
                <p className="text-sm text-gray-600 mb-2 flex-1">{studio.description || "No description"}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {studio.location && (
                    <span>📍 {studio.location}</span>
                  )}
                  {studio.capacity && (
                    <span>👥 {studio.capacity} people</span>
                  )}
                </div>
                <Link
                  href={`/bookings/new?studio=${studio.id}`}
                  className="mt-4 block text-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                >
                  Book Now
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
            <Link href="/bookings" className="text-sm text-indigo-600 hover:text-indigo-700">
              View All →
            </Link>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No bookings yet. Create your first booking to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{booking.studio.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{booking.purpose}</p>
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
                      {booking.equipment.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Equipment:</span>{" "}
                          {booking.equipment.map((be) => be.equipment.name).join(", ")}
                        </div>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {getStatusIcon(booking.status)}
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
