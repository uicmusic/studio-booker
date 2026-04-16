import type { UserRole } from "@prisma/client"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { supabase, supabaseAdmin } from "@/lib/supabase"

type Role = "STUDENT" | "LECTURER" | "ADMIN"

function normalizeRole(raw: string | undefined): UserRole {
  const u = (raw || "STUDENT").toUpperCase()
  if (u === "LECTURER" || u === "ADMIN" || u === "STUDENT") return u as UserRole
  return "STUDENT"
}

/** HTTPS (Vercel / prod URL) → secure cookies. HTTP localhost → non-secure cookie name. */
const useSecureCookies =
  process.env.NEXTAUTH_URL?.startsWith("https://") === true ||
  process.env.VERCEL === "1"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  // New cookie name so old session cookies (from a previous NEXTAUTH_SECRET) are ignored — no more decrypt errors.
  cookies: {
    sessionToken: {
      name: useSecureCookies
        ? "__Secure-next-auth.session-token.v2"
        : "next-auth.session-token.v2",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string | undefined
        if (!password) {
          return null
        }

        const isDev = process.env.NODE_ENV === "development"

        // 1) Supabase Auth first — fixes users in auth.users without a public.users row (trigger missed / old data).
        const { data: signData, error: signErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (isDev && signErr) {
          console.error(`[auth] signInWithPassword failed for ${email}:`, signErr.message)
        }

        if (!signErr && signData.user) {
          const authUser = signData.user
          const meta = (authUser.user_metadata || {}) as Record<string, unknown>
          let dbUser = await prisma.user.findUnique({ where: { email } })

          if (!dbUser) {
            try {
              dbUser = await prisma.user.create({
                data: {
                  id: authUser.id,
                  email: authUser.email!,
                  name:
                    (typeof meta.name === "string" && meta.name.trim()) ||
                    authUser.email!,
                  role: normalizeRole(
                    typeof meta.role === "string" ? meta.role : undefined
                  ),
                },
              })
            } catch (e: any) {
              // P2002 = unique constraint: trigger already created the row — re-query instead of failing.
              if (e?.code === "P2002") {
                dbUser = await prisma.user.findUnique({ where: { email } })
              }
              if (!dbUser) {
                console.error("[auth] sync public.users after sign-in", e)
                return null
              }
            }
          }

          return {
            id: dbUser!.id,
            email: dbUser!.email,
            name: dbUser!.name,
            role: dbUser!.role as Role,
          }
        }

        // 2) Auth rejected — if profile exists, wrong password (or Auth password hash incompatible with SQL inserts).
        //    SQL-seeded users: run `npm run fix:admin-passwords` once to reset via Admin API.
        const existingProfile = await prisma.user.findUnique({ where: { email } })
        if (isDev && existingProfile) {
          console.error(
            `[auth] ${email} exists in public.users but signInWithPassword failed. ` +
            `If created via SQL migration, run: npm run fix:admin-passwords`
          )
        }
        if (existingProfile) {
          return null
        }

        // 3) New user: create in Auth; trigger fills public.users (or we poll).
        const name = (credentials.name as string) || email
        const role = normalizeRole(credentials.role as string | undefined)

        const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name, role },
        })

        if (createErr) {
          const msg = createErr.message || ""
          if (
            msg.toLowerCase().includes("already") ||
            msg.toLowerCase().includes("registered")
          ) {
            console.error(
              "[auth] Email already in Supabase Auth but sign-in failed. Reset password in Supabase → Authentication → Users."
            )
          } else {
            console.error("[auth] createUser", msg)
          }
          return null
        }

        let created = await prisma.user.findUnique({ where: { email } })
        for (let i = 0; i < 12 && !created; i++) {
          await new Promise((r) => setTimeout(r, 150))
          created = await prisma.user.findUnique({ where: { email } })
        }

        if (!created) {
          console.error("[auth] public.users missing after signup")
          return null
        }

        return {
          id: created.id,
          email: created.email,
          name: created.name,
          role: created.role as Role,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).role = token.role
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
}
