export const dynamic = "force-dynamic"

import Navbar from "@/components/Navbar"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { Package } from "lucide-react"
import InventoryAdmin from "@/components/InventoryAdmin"

export default async function InventoryPage() {
  const session = await getServerSession(authOptions)
  const userRole = (session?.user as any)?.role
  const isAdmin = userRole === "ADMIN"

  // Get today's date range for session-based availability
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  // Fetch all equipment
  const equipments = await prisma.equipment.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  })

  // Get today's APPROVED bookings to calculate real-time availability
  const todayBookings = await prisma.booking.findMany({
    where: {
      status: "APPROVED",
      startDate: { gte: today },
      endDate: { lte: new Date(todayEnd.getTime() + 24 * 60 * 60 * 1000) },
    },
    include: {
      equipment: true,
    },
  })

  // Calculate real-time available count for each equipment
  const equipmentAvailability: Record<string, number> = {}
  equipments.forEach((equip) => {
    equipmentAvailability[equip.id] = equip.available
  })

  todayBookings.forEach((booking) => {
    booking.equipment.forEach((be) => {
      if (equipmentAvailability[be.equipmentId] !== undefined) {
        equipmentAvailability[be.equipmentId] -= be.quantity
      }
    })
  })

  // Group by category
  const equipmentByCategory: Record<string, any[]> = {}
  equipments.forEach((equip) => {
    const category = equip.category || "Other"
    if (!equipmentByCategory[category]) {
      equipmentByCategory[category] = []
    }
    equipmentByCategory[category].push({
      ...equip,
      realTimeAvailable: Math.max(0, equipmentAvailability[equip.id]),
    })
  })

  // Stats
  const totalItems = equipments.reduce((sum, e) => sum + e.quantity, 0)
  const availableItems = Object.values(equipmentAvailability).reduce(
    (sum, a) => sum + Math.max(0, a),
    0
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? "Manage equipment and tools" : "View all available equipment and tools"}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-indigo-600" />
              <div>
                <p className="text-3xl font-bold text-gray-900">{equipments.length}</p>
                <p className="text-gray-600">Equipment Types</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-3xl font-bold text-gray-900">{totalItems}</p>
                <p className="text-gray-600">Total Items</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-3xl font-bold text-gray-900">{availableItems}</p>
                <p className="text-gray-600">Available Items</p>
              </div>
            </div>
          </div>
        </div>

        {/* Equipment table — admin sees Add/Edit/Delete actions */}
        <InventoryAdmin equipmentByCategory={equipmentByCategory} isAdmin={isAdmin} />
      </main>
    </div>
  )
}
