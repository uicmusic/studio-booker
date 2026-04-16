"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react"
import { Calendar, Package, LayoutDashboard, LogIn, LogOut, User, Menu, X } from "lucide-react"
import Image from "next/image"

export default function Navbar() {
  const { data: session, status } = useSession()
  const userRole = (session?.user as any)?.role
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Truncate long names
  const truncateName = (name: string | null, maxLength = 20) => {
    if (!name) return "User"
    if (name.length <= maxLength) return name
    return name.substring(0, maxLength - 3) + "..."
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Section */}
          <div className="flex">
            <Link href="/" className="flex items-center gap-2 px-2 sm:px-4">
              <Image
                src="/uic-logo.png"
                alt="UIC College"
                width={360}
                height={120}
                className="h-20 w-auto sm:h-24"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {session && (
              <>
                <Link
                  href="/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden xl:inline">Dashboard</span>
                </Link>
                <Link
                  href="/bookings"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden xl:inline">Bookings</span>
                </Link>
                <Link
                  href="/studios"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden xl:inline">Studios</span>
                </Link>
                <Link
                  href="/inventory"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  <span className="hidden xl:inline">Inventory</span>
                </Link>
                {(userRole === "LECTURER" || userRole === "ADMIN") && (
                  <Link
                    href="/admin"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    <span className="hidden xl:inline">Admin</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* User Menu - Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            {status === "loading" ? (
              <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>
            ) : session ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700 max-w-[150px] truncate" title={session.user?.name || ''}>
                    {truncateName(session.user?.name, 20)}
                  </span>
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {userRole}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden xl:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <LogIn className="w-4 h-4" />
                Login
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            {session ? (
              <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-full">
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                  {userRole}
                </span>
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D94633] text-white text-sm font-medium rounded-md hover:bg-[#c73d2b] transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Login
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-white">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {session && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Dashboard
                </Link>
                <Link
                  href="/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Calendar className="w-5 h-5" />
                  Bookings
                </Link>
                <Link
                  href="/studios"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Calendar className="w-5 h-5" />
                  Studios
                </Link>
                <Link
                  href="/inventory"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Package className="w-5 h-5" />
                  Inventory
                </Link>
                {(userRole === "LECTURER" || userRole === "ADMIN") && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <Package className="w-5 h-5" />
                    Admin Panel
                  </Link>
                )}
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <User className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {session.user?.name}
                      </p>
                      <p className="text-xs text-gray-500">{session.user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: "/" })
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 mt-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
