import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const studio = await prisma.studio.findUnique({
      where: { id },
    })
    
    if (!studio) {
      return NextResponse.json(
        { error: "Studio not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(studio)
  } catch (error) {
    console.error("Error fetching studio:", error)
    return NextResponse.json(
      { error: "Failed to fetch studio" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const studio = await prisma.studio.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        location: body.location,
        capacity: body.capacity,
        isActive: body.isActive,
        images: body.images,
      },
    })
    
    return NextResponse.json(studio)
  } catch (error) {
    console.error("Error updating studio:", error)
    return NextResponse.json(
      { error: "Failed to update studio" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.studio.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting studio:", error)
    return NextResponse.json(
      { error: "Failed to delete studio" },
      { status: 500 }
    )
  }
}
