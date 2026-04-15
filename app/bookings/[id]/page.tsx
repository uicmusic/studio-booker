"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { Calendar, Clock, Package, ArrowLeft, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { Booking, Equipment } from "@/lib/types"

interface BookingWithDetails extends Booking {
  studio: Studio
  equipment?: (BookingEquipment & {
    equipment: Equipment
  })[]
}

interface Studio {
  id: string
  name: string
  description: string | null
  location: string | null
  capacity: number | null
  isActive: boolean
  images: string[] | null
  createdAt: string
  updatedAt: string
}

interface BookingEquipment {
  id: string
  equipmentId: string
  quantity: number
  equipment: Equipment
}

export default function BookingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<BookingWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchBooking() {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`)
        if (response.ok) {
          const data = await response.json()
          setBooking(data)
        }
      } catch (error) {
        console.error("Error fetching booking:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchBooking()
  }, [bookingId])

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/bookings")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to cancel booking")
      }
    } catch (error) {
      console.error("Error deleting booking:", error)
      alert("An error occurred while cancelling the booking")
    } finally {
      setDeleting(false)
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking not found</h1>
            <button
              onClick={() => router.push("/bookings")}
              className="mt-4 text-indigo-600 hover:text-indigo-700"
            >
              ← Back to Bookings
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/bookings")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Bookings
          </button>
          {booking.status === "PENDING" && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Cancel Booking
            </button>
          )}
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {booking.studio.name}
              </h1>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  booking.status
                )}`}
              >
                {booking.status}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Date & Time</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-900">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{format(new Date(booking.startDate), "EEEE, MMMM dd, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-900">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>
                    {format(new Date(booking.startDate), "HH:mm")} - {format(new Date(booking.endDate), "HH:mm")}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Purpose</h3>
              <p className="text-gray-900">{booking.purpose}</p>
            </div>
          </div>

          {/* Equipment */}
          {booking.equipment && booking.equipment.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Equipment
              </h3>
              <div className="flex flex-wrap gap-2">
                {booking.equipment.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm"
                  >
                    <span className="font-medium text-gray-900">{item.equipment.name}</span>
                    <span className="text-gray-500">x{item.quantity}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Info Footer */}
          <div className="border-t mt-6 pt-6">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                Booked on {format(new Date(booking.createdAt), "MMM dd, yyyy")}
              </span>
              {booking.status === "APPROVED" && (
                <span className="text-green-600">
                  Approved by lecturer
                </span>
              )}
              {booking.status === "PENDING" && (
                <span className="text-yellow-600">
                  Waiting for approval
                </span>
              )}
              {booking.status === "REJECTED" && (
                <span className="text-red-600">
                  Rejected by lecturer
                </span>
              )}
              {booking.status === "COMPLETED" && (
                <span className="text-blue-600">
                  Session completed
                </span>
              )}
              {booking.status === "CANCELLED" && (
                <span className="text-gray-600">
                  Booking cancelled
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          {booking.status === "APPROVED" && (
            <button
              onClick={() => router.push(`/bookings/${bookingId}/return`)}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Upload Return Proof
            </button>
          )}
          {booking.status === "PENDING" && (
            <div className="text-sm text-gray-500 italic">
              Your booking is pending approval. You will be notified once it's approved.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
