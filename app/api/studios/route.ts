import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/next-auth"

export async function GET() {
  try {
    const studios = await prisma.studio.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(studios)
  } catch (error) {
    console.error("Error fetching studios:", error)
    return NextResponse.json(
      { error: "Failed to fetch studios" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const studio = await prisma.studio.create({
      data: {
        name: body.name,
        description: body.description,
        location: body.location,
        capacity: body.capacity,
        images: body.images || [],
      },
    })
    return NextResponse.json(studio, { status: 201 })
  } catch (error) {
    console.error("Error creating studio:", error)
    return NextResponse.json(
      { error: "Failed to create studio" },
      { status: 500 }
    )
  }
}
