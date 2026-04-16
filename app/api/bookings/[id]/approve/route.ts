import { NextResponse } from "next/server"
import { auth } from "@/lib/next-auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Helper function to determine session from time
function getSessionLabel(startDate: Date, endDate: Date): string {
  const startHour = startDate.getHours()
  const endHour = endDate.getHours()
  
  if (startHour === 9 && endHour === 12) return "Session 1 (09:00 - 12:00)"
  if (startHour === 12 && endHour === 15) return "Session 2 (12:00 - 15:00)"
  if (startHour === 15 && endHour === 18) return "Session 3 (15:00 - 18:00)"
  
  return `${startHour.toString().padStart(2, '0')}:00 - ${endHour.toString().padStart(2, '0')}:00`
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || ((session.user as any).role !== "LECTURER" && (session.user as any).role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized - Only lecturers can approve bookings" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (!action || !["APPROVED", "REJECTED"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be APPROVED or REJECTED" },
        { status: 400 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        equipment: true,
        studio: { select: { name: true } },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending bookings can be approved/rejected" },
        { status: 400 }
      )
    }

    // If APPROVED - check for conflicting bookings
    if (action === "APPROVED") {
      // Find conflicting APPROVED bookings (same studio, overlapping time)
      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          studioId: booking.studioId,
          status: "APPROVED",
          id: { not: booking.id }, // Exclude current booking
          OR: [
            {
              startDate: { lte: booking.startDate },
              endDate: { gt: booking.startDate },
            },
            {
              startDate: { lt: booking.endDate },
              endDate: { gte: booking.endDate },
            },
            {
              startDate: { gte: booking.startDate },
              endDate: { lte: booking.endDate },
            },
          ],
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })

      if (conflictingBooking) {
        return NextResponse.json(
          {
            error: "Studio already booked for this time slot",
            conflict: {
              bookedBy: conflictingBooking.user.name || conflictingBooking.user.email,
              date: conflictingBooking.startDate.toISOString(),
              session: getSessionLabel(conflictingBooking.startDate, conflictingBooking.endDate),
              studio: booking.studio.name,
            },
          },
          { status: 400 }
        )
      }

      // Reduce equipment availability
      if (booking.equipment) {
        for (const item of booking.equipment) {
          await prisma.equipment.update({
            where: { id: item.equipmentId },
            data: {
              available: {
                decrement: item.quantity,
              },
            },
          })
        }
      }
    }

    // If REJECTED - do nothing (equipment was never reduced)

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: action as "APPROVED" | "REJECTED",
        approvedById: (session.user as any).id,
      },
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
    })

    // Revalidate admin page
    revalidatePath("/admin")

    return NextResponse.json(updatedBooking)
  } catch (error) {
    console.error("Error processing booking:", error)
    return NextResponse.json(
      { error: "Failed to process booking" },
      { status: 500 }
    )
  }
}
