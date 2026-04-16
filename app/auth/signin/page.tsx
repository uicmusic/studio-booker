"use client"

import { signIn } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock } from "lucide-react"
import Image from "next/image"

/** Drop a bad ?callbackUrl= (e.g. wrong port like 30001) so NextAuth matches this tab. */
function sanitizeSignInUrl() {
  if (typeof window === "undefined") return
  const params = new URLSearchParams(window.location.search)
  const raw = params.get("callbackUrl")
  if (!raw) return
  try {
    const decoded = decodeURIComponent(raw)
    const target = new URL(decoded, window.location.origin)
    if (target.host !== window.location.host) {
      window.history.replaceState({}, "", "/auth/signin")
    }
  } catch {
    window.history.replaceState({}, "", "/auth/signin")
  }
}

export default function SignIn() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  useEffect(() => {
    sanitizeSignInUrl()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : ""
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        callbackUrl: origin ? `${origin}/dashboard` : "/dashboard",
        redirect: false,
      })

      if (result?.ok) {
        router.push("/dashboard")
        router.refresh()
      } else {
        setErrorMessage("Email atau password salah. Akun harus dibuat terlebih dahulu oleh Admin.")
      }
    } catch (error) {
      console.error("Sign in error:", error)
      setErrorMessage("Terjadi kesalahan saat login. Coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background pattern - UIC colors in geometric blocks */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-[#D94633]"></div>
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#F5A623]"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#00889E]"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-[#D94633]"></div>
      </div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="bg-white w-40 h-40 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Image
              src="/uic-logo.png"
              alt="UIC College"
              width={240}
              height={240}
              className="w-32 h-32"
            />
          </div>
          <h1 className="text-3xl font-bold text-white">Studio Booker</h1>
          <p className="text-white/90 mt-2">UIC Music Department</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>

          {errorMessage && (
            <div
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D94633] focus:border-[#D94633]"
                  placeholder="your.email@uic.edu"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D94633] focus:border-[#D94633]"
                  placeholder="Your account password"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#D94633] text-white py-3 rounded-lg font-medium hover:bg-[#c73d2b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-500 text-center">
            Akun hanya bisa dibuat oleh Admin. Hubungi admin UIC Music jika belum punya akses.
          </p>
        </div>
      </div>
    </div>
  )
}
