import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/next-auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const equipment = await prisma.equipment.findUnique({
      where: { id },
    })
    
    if (!equipment) {
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(equipment)
  } catch (error) {
    console.error("Error fetching equipment:", error)
    return NextResponse.json(
      { error: "Failed to fetch equipment" },
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
    if (!session?.user || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "LECTURER")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    
    const equipment = await prisma.equipment.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        quantity: body.quantity,
        available: body.available,
        category: body.category,
        isActive: body.isActive,
      },
    })
    
    return NextResponse.json(equipment)
  } catch (error) {
    console.error("Error updating equipment:", error)
    return NextResponse.json(
      { error: "Failed to update equipment" },
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
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    
    await prisma.equipment.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting equipment:", error)
    return NextResponse.json(
      { error: "Failed to delete equipment" },
      { status: 500 }
    )
  }
}
