import Navbar from "@/components/Navbar"
import { prisma } from "@/lib/prisma"
import { Package } from "lucide-react"

export default async function InventoryPage() {
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
      endDate: { lte: new Date(todayEnd.getTime() + (24 * 60 * 60 * 1000)) }, // Include tomorrow for overnight sessions
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

  // Subtract equipment that's currently in use (today's approved bookings)
  todayBookings.forEach((booking) => {
    booking.equipment.forEach((be) => {
      if (equipmentAvailability[be.equipmentId]) {
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
  const availableItems = Object.values(equipmentAvailability).reduce((sum, a) => sum + a, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600 mt-1">View all available equipment and tools</p>
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

        {/* Equipment by Category */}
        <div className="space-y-6">
          {Object.entries(equipmentByCategory).map(([category, items]) => (
            <div key={category} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h2 className="text-xl font-semibold text-gray-900">{category}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Equipment Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Available Today
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((equip: any) => (
                      <tr key={equip.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-900">{equip.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-500">{equip.description || "-"}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <p className="text-sm font-medium text-green-600">{equip.realTimeAvailable}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <p className="text-sm text-gray-600">{equip.quantity}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {equip.realTimeAvailable === 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              In Use Today
                            </span>
                          ) : equip.realTimeAvailable < equip.quantity ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Partially Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Available
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {equipments.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No equipment yet</h3>
            <p className="text-gray-600">Equipment inventory is empty</p>
          </div>
        )}
      </main>
    </div>
  )
}
