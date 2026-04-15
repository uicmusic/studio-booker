import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/next-auth"

export async function GET() {
  try {
    const equipments = await prisma.equipment.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(equipments)
  } catch (error) {
    console.error("Error fetching equipment:", error)
    return NextResponse.json(
      { error: "Failed to fetch equipment" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "LECTURER")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    if (!body.name || !body.quantity) {
      return NextResponse.json(
        { error: "Name and quantity are required" },
        { status: 400 }
      )
    }

    const equipment = await prisma.equipment.create({
      data: {
        name: body.name,
        description: body.description,
        quantity: body.quantity,
        available: body.available ?? body.quantity,
        category: body.category,
      },
    })
    
    return NextResponse.json(equipment, { status: 201 })
  } catch (error) {
    console.error("Error creating equipment:", error)
    return NextResponse.json(
      { error: "Failed to create equipment" },
      { status: 500 }
    )
  }
}
