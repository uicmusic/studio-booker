import Navbar from "@/components/Navbar"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus, Camera } from "lucide-react"
import { format } from "date-fns"

export default async function BookingsPage() {
  const session = await requireAuth()
  const userId = (session.user as any).id
  const userRole = (session.user as any).role

  const where: any = {}
  if (userRole === "STUDENT") {
    where.userId = userId
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      studio: true,
      equipment: {
        include: {
          equipment: true,
        },
      },
      returnProofs: true,
    },
    orderBy: { startDate: "desc" },
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
        return <CheckCircle className="w-4 h-4" />
      case "REJECTED":
        return <XCircle className="w-4 h-4" />
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4" />
      case "CANCELLED":
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-600 mt-1">View and manage your studio bookings</p>
          </div>
          <Link
            href="/bookings/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Booking
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-600 mb-6">Create your first studio booking to get started</p>
            <Link
              href="/bookings/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Booking
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{booking.studio.name}</h3>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {getStatusIcon(booking.status)}
                        {booking.status}
                      </span>
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
                        <span className="text-sm font-medium text-gray-700">Equipment:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {booking.equipment.map((be) => (
                            <span
                              key={be.id}
                              className="text-sm bg-gray-100 px-3 py-1 rounded-full"
                            >
                              {be.equipment.name} x{be.quantity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {booking.returnProofs.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Camera className="w-4 h-4" />
                        <span>Return proof uploaded</span>
                      </div>
                    )}
                    {booking.status === "APPROVED" && new Date(booking.endDate) < new Date() && booking.returnProofs.length === 0 && (
                      <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                        <AlertCircle className="w-4 h-4" />
                        <span>
                          {new Date(booking.endDate).getTime() < (Date.now() - 24 * 60 * 60 * 1000)
                            ? "OVERDUE - Equipment will be auto-returned"
                            : "Please upload return proof as soon as possible"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {booking.status === "APPROVED" && booking.returnProofs.length === 0 && (
                      <Link
                        href={`/bookings/${booking.id}/return`}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Upload Return Proof
                      </Link>
                    )}
                    {booking.status === "PENDING" && (
                      <Link
                        href={`/bookings/${booking.id}`}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        View Details
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
