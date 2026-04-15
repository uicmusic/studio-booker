import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/next-auth"

export async function GET(request: Request) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const studioId = searchParams.get("studioId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = {}

    // Filter by user role
    if ((session?.user as any)?.role === "STUDENT") {
      where.userId = (session.user as any).id
    }

    // Additional filters
    if (status) {
      where.status = status
    }
    if (studioId) {
      where.studioId = studioId
    }
    if (startDate && endDate) {
      where.startDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const bookings = await prisma.booking.findMany({
      where,
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
      orderBy: { startDate: "desc" },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.studioId || !body.startDate || !body.endDate || !body.purpose) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if studio exists
    const studio = await prisma.studio.findUnique({
      where: { id: body.studioId },
    })

    if (!studio || !studio.isActive) {
      return NextResponse.json(
        { error: "Studio not available" },
        { status: 400 }
      )
    }

    // Check for overlapping bookings
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        studioId: body.studioId,
        status: { in: ["PENDING", "APPROVED"] },
        OR: [
          {
            startDate: { lte: new Date(body.endDate) },
            endDate: { gte: new Date(body.startDate) },
          },
        ],
      },
    })

    if (overlappingBooking) {
      return NextResponse.json(
        { error: "Studio is already booked for this time slot" },
        { status: 400 }
      )
    }

    // Create booking with equipment
    const booking = await prisma.booking.create({
      data: {
        userId: (session.user as any).id,
        studioId: body.studioId,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        purpose: body.purpose,
        equipment: body.equipment
          ? {
              create: body.equipment.map((item: any) => ({
                equipmentId: item.equipmentId,
                quantity: item.quantity,
              })),
            }
          : undefined,
      },
      include: {
        equipment: {
          include: {
            equipment: true,
          },
        },
      },
    })

    // NOTE: Equipment availability is NOT reduced here
    // It will be reduced only when booking is APPROVED by lecturer
    // This ensures first-come-first-serve basis and prevents inventory issues

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    )
  }
}
