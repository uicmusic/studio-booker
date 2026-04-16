"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Check, Package } from "lucide-react"
import { useRouter } from "next/navigation"

export interface EquipmentRow {
  id: string
  name: string
  description: string | null
  quantity: number
  available: number
  category: string | null
  realTimeAvailable: number
}

interface EquipmentFormData {
  name: string
  description: string
  quantity: number
  available: number
  category: string
}

const EMPTY_FORM: EquipmentFormData = {
  name: "",
  description: "",
  quantity: 1,
  available: 1,
  category: "",
}

interface Props {
  equipmentByCategory: Record<string, EquipmentRow[]>
  isAdmin: boolean
}

export default function InventoryAdmin({ equipmentByCategory, isAdmin }: Props) {
  const router = useRouter()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EquipmentFormData>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openAdd() {
    setForm(EMPTY_FORM)
    setError(null)
    setShowAddModal(true)
  }

  function openEdit(equip: EquipmentRow) {
    setForm({
      name: equip.name,
      description: equip.description ?? "",
      quantity: equip.quantity,
      available: equip.available,
      category: equip.category ?? "",
    })
    setError(null)
    setEditingId(equip.id)
  }

  function closeModal() {
    setShowAddModal(false)
    setEditingId(null)
    setError(null)
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required"); return }
    if (form.quantity < 1) { setError("Quantity must be at least 1"); return }

    setLoading(true)
    setError(null)
    try {
      const isEdit = !!editingId
      const res = await fetch(
        isEdit ? `/api/equipment/${editingId}` : "/api/equipment",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim() || null,
            quantity: Number(form.quantity),
            available: Number(form.available),
            category: form.category.trim() || null,
          }),
        }
      )
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || "Failed to save")
        return
      }
      closeModal()
      router.refresh()
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/equipment/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const d = await res.json()
        alert(d.error || "Failed to delete")
        return
      }
      router.refresh()
    } catch {
      alert("Network error")
    } finally {
      setLoading(false)
    }
  }

  const allEmpty = Object.keys(equipmentByCategory).length === 0

  return (
    <>
      {/* Add button — admin only */}
      {isAdmin && (
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#D94633] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#c73d2b] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Equipment
        </button>
      )}

      {/* Equipment table by category */}
      <div className="space-y-6">
        {Object.entries(equipmentByCategory).map(([category, items]) => (
          <div key={category} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="text-xl font-semibold text-gray-900">{category}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipment Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available Today
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((equip) => (
                    <tr key={equip.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">{equip.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-500">{equip.description || "-"}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <p className="text-sm font-medium text-green-600">{equip.realTimeAvailable}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <p className="text-sm text-gray-600">{equip.quantity}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {equip.realTimeAvailable === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            In Use Today
                          </span>
                        ) : equip.realTimeAvailable < equip.quantity ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Partially Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Available
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEdit(equip)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(equip.id, equip.name)}
                              disabled={loading}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {allEmpty && (
        <div className="text-center py-16 bg-white rounded-lg border">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No equipment yet</h3>
          <p className="text-gray-600">
            {isAdmin ? "Click \"Add Equipment\" to get started." : "Equipment inventory is empty."}
          </p>
        </div>
      )}

      {/* Modal */}
      {(showAddModal || editingId) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? "Edit Equipment" : "Add Equipment"}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#D94633] focus:border-[#D94633]"
                  placeholder="e.g. Shure SM58"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#D94633] focus:border-[#D94633]"
                  placeholder="e.g. Microphone, Cables"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#D94633] focus:border-[#D94633]"
                  placeholder="Optional description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity *</label>
                  <input
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#D94633] focus:border-[#D94633]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available</label>
                  <input
                    type="number"
                    min={0}
                    value={form.available}
                    onChange={e => setForm({ ...form, available: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#D94633] focus:border-[#D94633]"
                  />
                </div>
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
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-[#D94633] text-white rounded-lg hover:bg-[#c73d2b] disabled:opacity-50"
              >
                {loading ? "Saving..." : <><Check className="w-4 h-4" /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
