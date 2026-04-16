export const dynamic = "force-dynamic"

import Navbar from "@/components/Navbar"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { MapPin, Users, Plus } from "lucide-react"
import Image from "next/image"

export default async function StudiosPage() {
  const studios = await prisma.studio.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Studios</h1>
            <p className="text-gray-600 mt-1">Browse and book available studios</p>
          </div>
          <Link
            href="/bookings/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Booking
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studios.map((studio) => (
            <div
              key={studio.id}
              className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full"
            >
              <div className="h-48 bg-gradient-to-br from-[#D94633] to-[#00889E] flex items-center justify-center">
                <Image
                  src="/uic-logo.png"
                  alt="UIC College"
                  width={200}
                  height={60}
                  className="h-16 w-auto"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{studio.name}</h3>
                <p className="text-gray-600 mb-4 flex-1">{studio.description || "No description available"}</p>

                <div className="space-y-2 mb-4">
                  {studio.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>{studio.location}</span>
                    </div>
                  )}
                  {studio.capacity && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>Capacity: {studio.capacity} people</span>
                    </div>
                  )}
                </div>

                <Link
                  href={`/bookings/new?studio=${studio.id}`}
                  className="block w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Book This Studio
                </Link>
              </div>
            </div>
          ))}
        </div>

        {studios.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border">
            <p className="text-gray-500 text-lg">No studios available yet. Check back later!</p>
          </div>
        )}
      </main>
    </div>
  )
}
