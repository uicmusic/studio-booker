import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/next-auth"
import { writeFile } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(
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
    const formData = await request.formData()
    const files = formData.getAll("images") as File[]
    const description = formData.get("description") as string

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        returnProofs: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    // Only the booking owner or admin can upload return proof
    if (
      booking.userId !== (session.user as any).id &&
      (session.user as any).role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Upload directory
    const uploadDir = path.join(process.cwd(), "public", "uploads", "returns")

    // Ensure upload directory exists
    const fs = require("fs")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Save files
    const imageUrls: string[] = []
    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const uniqueName = `${uuidv4()}-${file.name}`
      const filePath = path.join(uploadDir, uniqueName)
      await writeFile(filePath, buffer)
      imageUrls.push(`/uploads/returns/${uniqueName}`)
    }

    // Create return proof
    const returnProof = await prisma.returnProof.create({
      data: {
        bookingId: id,
        images: imageUrls,
        description: description || null,
      },
    })

    // Update booking status to COMPLETED (equipment already returned when approved)
    // No need to return equipment again since it was already reduced on approval
    await prisma.booking.update({
      where: { id },
      data: {
        status: "COMPLETED",
      },
    })

    return NextResponse.json(returnProof, { status: 201 })
  } catch (error) {
    console.error("Error uploading return proof:", error)
    return NextResponse.json(
      { error: "Failed to upload return proof" },
      { status: 500 }
    )
  }
}
