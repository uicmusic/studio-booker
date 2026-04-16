"use client"

import { useState } from "react"
import { Plus, Trash2, X, Check, User, Shield, GraduationCap } from "lucide-react"
import { useRouter } from "next/navigation"

export interface UserRow {
  id: string
  name: string
  email: string
  role: "STUDENT" | "LECTURER" | "ADMIN"
  createdAt: string
}

interface FormData {
  name: string
  email: string
  password: string
  role: "STUDENT" | "LECTURER"
}

const EMPTY_FORM: FormData = { name: "", email: "", password: "", role: "STUDENT" }

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800",
  LECTURER: "bg-blue-100 text-blue-800",
  STUDENT: "bg-green-100 text-green-800",
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  ADMIN: <Shield className="w-3 h-3" />,
  LECTURER: <User className="w-3 h-3" />,
  STUDENT: <GraduationCap className="w-3 h-3" />,
}

export default function UserAdmin({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openAdd() {
    setForm(EMPTY_FORM)
    setError(null)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setError(null)
  }

  async function handleCreate() {
    if (!form.name.trim()) { setError("Name is required"); return }
    if (!form.email.trim()) { setError("Email is required"); return }
    if (!form.password) { setError("Password is required"); return }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || "Failed to create user"); return }
      closeModal()
      router.refresh()
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(user: UserRow) {
    if (!confirm(`Delete account for "${user.name}" (${user.email})?\n\nThis cannot be undone.`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?id=${user.id}`, { method: "DELETE" })
      if (!res.ok) {
        const d = await res.json()
        alert(d.error || "Failed to delete user")
        return
      }
      router.refresh()
    } catch {
      alert("Network error")
    } finally {
      setLoading(false)
    }
  }

  const grouped = {
    ADMIN: users.filter((u) => u.role === "ADMIN"),
    LECTURER: users.filter((u) => u.role === "LECTURER"),
    STUDENT: users.filter((u) => u.role === "STUDENT"),
  }

  return (
    <>
      {/* Add button */}
      <button
        onClick={openAdd}
        className="flex items-center gap-2 bg-[#D94633] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#c73d2b] transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add User
      </button>

      {/* User tables grouped by role */}
      <div className="space-y-6">
        {(["STUDENT", "LECTURER", "ADMIN"] as const).map((role) => {
          const group = grouped[role]
          if (group.length === 0) return null
          return (
            <div key={role} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${ROLE_STYLES[role]}`}>
                  {ROLE_ICONS[role]}
                  {role}
                </span>
                <span className="text-sm text-gray-500">{group.length} user{group.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      {role !== "ADMIN" && (
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {group.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {user.name}
                              {user.id === currentUserId && (
                                <span className="ml-2 text-xs text-gray-400">(you)</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        {role !== "ADMIN" && (
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleDelete(user)}
                              disabled={loading}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>

      {users.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg border">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No users yet</h3>
          <p className="text-gray-600">Click "Add User" to create the first account.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Add User</h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#D94633] focus:border-[#D94633]"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#D94633] focus:border-[#D94633]"
                  placeholder="student@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#D94633] focus:border-[#D94633]"
                  placeholder="Min. 8 characters"
                />
                <p className="text-xs text-gray-500 mt-1">The user can change this after logging in.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as "STUDENT" | "LECTURER" })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#D94633] focus:border-[#D94633]"
                >
                  <option value="STUDENT">Student</option>
                  <option value="LECTURER">Lecturer</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-[#D94633] text-white rounded-lg hover:bg-[#c73d2b] disabled:opacity-50"
              >
                {loading ? "Creating..." : <><Check className="w-4 h-4" /> Create Account</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
