import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/next-auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const booking = await prisma.booking.findUnique({
      where: { id },
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
        returnProofs: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error("Error fetching booking:", error)
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const userRole = (session.user as any).role

    // Get current booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        equipment: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    // Students can only cancel their own bookings
    if (userRole === "STUDENT") {
      if (booking.userId !== (session.user as any).id) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
      }
      if (body.status && body.status !== "CANCELLED") {
        return NextResponse.json(
          { error: "Students can only cancel bookings" },
          { status: 400 }
        )
      }
    }

    // Lecturers/Admin can approve/reject
    if (userRole === "LECTURER" || userRole === "ADMIN") {
      if (body.status === "APPROVED" || body.status === "REJECTED") {
        // If APPROVED - reduce equipment availability
        if (body.status === "APPROVED" && booking.equipment) {
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
        // If REJECTED - do nothing (equipment was never reduced)

        const updatedBooking = await prisma.booking.update({
          where: { id },
          data: {
            status: body.status,
            approvedById: (session.user as any).id,
          },
          include: {
            equipment: {
              include: {
                equipment: true,
              },
            },
          },
        })

        return NextResponse.json(updatedBooking)
      }
    }

    // Update booking (only if not completed/cancelled)
    if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot update completed or cancelled booking" },
        { status: 400 }
      )
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        purpose: body.purpose,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      },
    })

    return NextResponse.json(updatedBooking)
  } catch (error) {
    console.error("Error updating booking:", error)
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const userRole = (session.user as any).role

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        equipment: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    // Only admin or booking owner can delete
    if (
      userRole !== "ADMIN" &&
      booking.userId !== (session.user as any).id
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Return equipment if booking was APPROVED (equipment was already reduced)
    if (booking.status === "APPROVED" && booking.equipment) {
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

    await prisma.booking.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting booking:", error)
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    )
  }
}
