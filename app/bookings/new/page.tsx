"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Navbar from "@/components/Navbar"
import { Calendar, Clock, Package, Plus, Minus, Loader2, ChevronDown, ChevronUp, Search } from "lucide-react"

interface Studio {
  id: string
  name: string
  description: string | null
}

interface Equipment {
  id: string
  name: string
  quantity: number
  available: number
  category: string | null
}

const SESSIONS = [
  { 
    id: "1", 
    label: "Session 1 (09:00 - 12:00)", 
    startTime: "09:00", 
    endTime: "12:00" 
  },
  { 
    id: "2", 
    label: "Session 2 (12:00 - 15:00)", 
    startTime: "12:00", 
    endTime: "15:00" 
  },
  { 
    id: "3", 
    label: "Session 3 (15:00 - 18:00)", 
    startTime: "15:00", 
    endTime: "18:00" 
  },
]

export default function NewBookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedStudio = searchParams.get("studio")

  const [studios, setStudios] = useState<Studio[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedStudio, setSelectedStudio] = useState(preselectedStudio || "")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedSession, setSelectedSession] = useState("")
  const [purpose, setPurpose] = useState("")
  const [selectedEquipment, setSelectedEquipment] = useState<Record<string, number>>({})
  
  // Search and collapse state
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  
  // Dynamic equipment availability
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([])
  const [loadingAvailability, setLoadingAvailability] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [studiosRes, equipmentRes] = await Promise.all([
          fetch("/api/studios"),
          fetch("/api/equipment"),
        ])
        const studiosData = await studiosRes.json()
        const equipmentData = await equipmentRes.json()
        setStudios(studiosData)
        setEquipments(equipmentData)
        setAvailableEquipment(equipmentData) // Initially show all equipment
        
        // Initialize all categories as COLLAPSED (closed) by default
        const categories = [...new Set(equipmentData.map((e: Equipment) => e.category || "Other"))] as string[]
        const initialExpanded: Record<string, boolean> = {}
        categories.forEach((cat: string) => {
          initialExpanded[cat] = false  // COLLAPSED by default
        })
        setExpandedCategories(initialExpanded)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Fetch dynamic equipment availability when date/session/studio changes
  useEffect(() => {
    if (selectedDate && selectedSession && selectedStudio) {
      fetchAvailability()
    }
  }, [selectedDate, selectedSession, selectedStudio])

  const fetchAvailability = async () => {
    setLoadingAvailability(true)
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        sessionId: selectedSession,
        studioId: selectedStudio,
      })
      
      const response = await fetch(`/api/equipment/availability?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableEquipment(data.equipment)
      }
    } catch (error) {
      console.error("Error fetching availability:", error)
    } finally {
      setLoadingAvailability(false)
    }
  }

  // Group equipment by category - use availableEquipment for dynamic availability
  const equipmentByCategory = useMemo(() => {
    const filtered = availableEquipment.filter(e => 
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    const grouped: Record<string, any[]> = {}
    filtered.forEach((equip: any) => {
      const category = equip.category || "Other"
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(equip)
    })
    return grouped
  }, [availableEquipment, searchQuery])

  const updateEquipment = (id: string, quantity: number) => {
    setSelectedEquipment((prev) => {
      // Find equipment from availableEquipment (which has real-time availability)
      const equipment = availableEquipment.find((e: any) => e.id === id)
      if (!equipment) return prev

      const newQuantity = Math.max(0, Math.min(quantity, equipment.availableForSession || equipment.available))
      if (newQuantity === 0) {
        const copy = { ...prev }
        delete copy[id]
        return copy
      }
      return { ...prev, [id]: newQuantity }
    })
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const session = SESSIONS.find(s => s.id === selectedSession)
      if (!session) {
        alert("Please select a session")
        setSubmitting(false)
        return
      }

      const [startHour, startMin] = session.startTime.split(":").map(Number)
      const [endHour, endMin] = session.endTime.split(":").map(Number)
      
      const startDate = new Date(selectedDate)
      startDate.setHours(startHour, startMin, 0, 0)
      
      const endDate = new Date(selectedDate)
      endDate.setHours(endHour, endMin, 0, 0)

      const equipmentList = Object.entries(selectedEquipment).map(([equipmentId, quantity]) => ({
        equipmentId,
        quantity,
      }))

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studioId: selectedStudio,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          purpose,
          equipment: equipmentList.length > 0 ? equipmentList : undefined,
        }),
      })

      if (response.ok) {
        router.push("/bookings")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create booking")
      }
    } catch (error) {
      console.error("Error creating booking:", error)
      alert("An error occurred while creating the booking")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">New Booking</h1>
          <p className="text-gray-600 mt-1">Book a studio and equipment for your session</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
          {/* Studio Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Select Studio *
            </label>
            <select
              value={selectedStudio}
              onChange={(e) => setSelectedStudio(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Choose a studio...</option>
              {studios.map((studio) => (
                <option key={studio.id} value={studio.id}>
                  {studio.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Session */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Date *
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Session *
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a session...</option>
                {SESSIONS.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purpose *
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              rows={4}
              placeholder="Describe the purpose of your session..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Equipment Selection with Search and Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Package className="w-4 h-4 inline mr-2" />
              Equipment (Optional)
            </label>
            
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search equipment..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Categories */}
            <div className="space-y-2">
              {Object.entries(equipmentByCategory).map(([category, items]) => (
                <div key={category} className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{category}</span>
                      <span className="text-sm text-gray-500">({items.length} items)</span>
                    </div>
                    {expandedCategories[category] ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  
                  {expandedCategories[category] && (
                    <div className="divide-y">
                      {items.map((equip) => (
                        <div
                          key={equip.id}
                          className="flex items-center justify-between p-4"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{(equip as any).name}</p>
                            <p className="text-sm text-gray-500">
                              Available: {(equip as any).availableForSession || (equip as any).available} / {(equip as any).quantity}
                              {loadingAvailability && (
                                <span className="ml-2 text-xs text-indigo-600">Updating...</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateEquipment(equip.id, (selectedEquipment[equip.id] || 0) - 1)
                              }
                              className="p-2 rounded-lg border hover:bg-gray-50"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center font-medium">
                              {selectedEquipment[equip.id] || 0}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateEquipment((equip as any).id, (selectedEquipment[(equip as any).id] || 0) + 1)
                              }
                              disabled={
                                (selectedEquipment[(equip as any).id] || 0) >= ((equip as any).availableForSession || (equip as any).available)
                              }
                              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Booking...
              </>
            ) : (
              "Create Booking"
            )}
          </button>
        </form>
      </main>
    </div>
  )
}
