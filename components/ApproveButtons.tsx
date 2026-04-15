"use client"

import { useState } from "react"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

interface ApproveButtonsProps {
  bookingId: string
  onApprove?: () => void
}

export default function ApproveButtons({ bookingId, onApprove }: ApproveButtonsProps) {
  const [loading, setLoading] = useState<"APPROVED" | "REJECTED" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleApprove = async (action: "APPROVED" | "REJECTED") => {
    setLoading(action)
    setError(null)

    console.log("=== APPROVE BUTTON CLICKED ===")
    console.log("Booking ID:", bookingId)
    console.log("Action:", action)

    try {
      const response = await fetch(`/api/bookings/${bookingId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })

      console.log("Response status:", response.status)

      const responseData = await response.json()
      console.log("Response data:", responseData)

      if (response.ok) {
        console.log("Booking updated successfully!")
        // Reload page after successful approve/reject
        window.location.reload()
      } else {
        console.error("API error:", responseData)
        
        // Handle conflict error specially
        if (responseData.error === "Studio already booked for this time slot" && responseData.conflict) {
          const conflict = responseData.conflict
          const conflictMessage = `
⚠️ Cannot approve this booking

${conflict.studio} is already booked for:
• Date: ${new Date(conflict.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
• Session: ${conflict.session}
• Booked by: ${conflict.bookedBy}

Please reject this booking and ask the student to choose a different time slot.
          `.trim()
          
          alert(conflictMessage)
        } else {
          setError(responseData.error || "Failed to process booking")
          alert("Error: " + (responseData.error || "Failed to process booking"))
        }
        
        setLoading(null)
      }
    } catch (error) {
      console.error("=== ERROR ===")
      console.error("Error details:", error)
      setError("An error occurred while processing the booking")
      alert("Error: An error occurred")
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2 ml-4">
      <button
        onClick={() => handleApprove("APPROVED")}
        disabled={loading !== null}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading === "APPROVED" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CheckCircle className="w-4 h-4" />
        )}
        {loading === "APPROVED" ? "Processing..." : "Approve"}
      </button>
      <button
        onClick={() => handleApprove("REJECTED")}
        disabled={loading !== null}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading === "REJECTED" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <XCircle className="w-4 h-4" />
        )}
        {loading === "REJECTED" ? "Processing..." : "Reject"}
      </button>
      {error && (
        <div className="absolute -bottom-8 left-0 text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}
