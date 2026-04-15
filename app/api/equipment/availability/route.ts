import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const sessionId = searchParams.get("sessionId")
    const studioId = searchParams.get("studioId")

    if (!date || !sessionId || !studioId) {
      return NextResponse.json(
        { error: "Date, sessionId, and studioId are required" },
        { status: 400 }
      )
    }

    // Parse date and session
    const selectedDate = new Date(date)
    selectedDate.setHours(0, 0, 0, 0)

    const sessionTimes: Record<string, { start: string; end: string }> = {
      "1": { start: "09:00", end: "12:00" },
      "2": { start: "12:00", end: "15:00" },
      "3": { start: "15:00", end: "18:00" },
    }

    const session = sessionTimes[sessionId]
    if (!session) {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 400 }
      )
    }

    // Calculate session start and end times
    const [startHour, startMin] = session.start.split(":").map(Number)
    const [endHour, endMin] = session.end.split(":").map(Number)

    const sessionStart = new Date(selectedDate)
    sessionStart.setHours(startHour, startMin, 0, 0)

    const sessionEnd = new Date(selectedDate)
    sessionEnd.setHours(endHour, endMin, 0, 0)

    // Find all APPROVED bookings that conflict with this session
    // Conflict: same studio, same date, overlapping time
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        studioId: studioId,
        status: "APPROVED",
        OR: [
          {
            startDate: { lte: sessionStart },
            endDate: { gt: sessionStart },
          },
          {
            startDate: { lt: sessionEnd },
            endDate: { gte: sessionEnd },
          },
          {
            startDate: { gte: sessionStart },
            endDate: { lte: sessionEnd },
          },
        ],
      },
      include: {
        equipment: true,
      },
    })

    // Calculate total equipment booked in conflicting sessions
    const equipmentBooked: Record<string, number> = {}
    conflictingBookings.forEach((booking) => {
      booking.equipment.forEach((be) => {
        if (!equipmentBooked[be.equipmentId]) {
          equipmentBooked[be.equipmentId] = 0
        }
        equipmentBooked[be.equipmentId] += be.quantity
      })
    })

    // Get all equipment with availability info
    const allEquipment = await prisma.equipment.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    })

    // Merge with booked count
    const equipmentWithAvailability = allEquipment.map((equip) => ({
      ...equip,
      bookedInSession: equipmentBooked[equip.id] || 0,
      availableForSession: Math.max(0, equip.available - (equipmentBooked[equip.id] || 0)),
    }))

    return NextResponse.json({
      success: true,
      equipment: equipmentWithAvailability,
      conflictingBookingsCount: conflictingBookings.length,
      sessionInfo: {
        date: selectedDate.toISOString(),
        sessionId,
        studioId,
        startTime: session.start,
        endTime: session.end,
      },
    })
  } catch (error) {
    console.error("Error fetching equipment availability:", error)
    return NextResponse.json(
      { error: "Failed to fetch equipment availability" },
      { status: 500 }
    )
  }
}
