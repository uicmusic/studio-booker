export type Role = "STUDENT" | "LECTURER" | "ADMIN"

export type BookingStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED"

export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  role: Role
  createdAt: Date
  updatedAt: Date
}

export interface Studio {
  id: string
  name: string
  description: string | null
  location: string | null
  capacity: number | null
  isActive: boolean
  images: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Equipment {
  id: string
  name: string
  description: string | null
  quantity: number
  available: number
  category: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Booking {
  id: string
  userId: string
  studioId: string
  startDate: Date
  endDate: Date
  purpose: string
  status: BookingStatus
  approvedById: string | null
  createdAt: Date
  updatedAt: Date
  user?: User
  studio?: Studio
  equipment?: BookingEquipment[]
  returnProofs?: ReturnProof[]
}

export interface BookingEquipment {
  id: string
  bookingId: string
  equipmentId: string
  quantity: number
  equipment?: Equipment
}

export interface ReturnProof {
  id: string
  bookingId: string
  images: string[]
  description: string | null
  createdAt: Date
}

export type BookingWithRelations = Booking & {
  user: User
  studio: Studio
  equipment: (BookingEquipment & { equipment: Equipment })[]
  returnProofs: ReturnProof[]
}
