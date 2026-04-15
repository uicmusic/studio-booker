import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000))

    // Find all APPROVED bookings that ended more than 24 hours ago
    // and don't have return proofs yet
    const overdueBookings = await prisma.booking.findMany({
      where: {
        status: "APPROVED",
        endDate: {
          lt: twentyFourHoursAgo,
        },
        isOverdue: false,
        returnProofs: {
          none: {},
        },
      },
      include: {
        equipment: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    console.log(`Found ${overdueBookings.length} overdue bookings to auto-return`)

    // Process each overdue booking
    for (const booking of overdueBookings) {
      console.log(`Auto-returning booking ${booking.id} for user ${booking.user.email}`)

      // Return all equipment
      if (booking.equipment && booking.equipment.length > 0) {
        for (const item of booking.equipment) {
          await prisma.equipment.update({
            where: { id: item.equipmentId },
            data: {
              available: {
                increment: item.quantity,
              },
            },
          })
        }
      }

      // Mark booking as overdue and auto-returned
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          isOverdue: true,
          autoReturnedAt: now,
          status: "COMPLETED",
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${overdueBookings.length} overdue bookings`,
      count: overdueBookings.length,
    })
  } catch (error) {
    console.error("Error processing overdue bookings:", error)
    return NextResponse.json(
      { error: "Failed to process overdue bookings" },
      { status: 500 }
    )
  }
}

// Also allow GET for testing
export async function GET() {
  return POST()
}
