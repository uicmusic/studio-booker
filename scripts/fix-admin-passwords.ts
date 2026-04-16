/**
 * One-time script: reset passwords for SQL-seeded admin users.
 *
 * SQL migrations (003, 004) insert into auth.users with PostgreSQL crypt() —
 * GoTrue cannot verify that hash, so signInWithPassword always fails.
 * This script uses the Admin API to set a proper GoTrue-compatible password hash.
 *
 * Usage:
 *   npx tsx scripts/fix-admin-passwords.ts
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { resolve } from "path"

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
  )
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Admins created via raw SQL INSERT — their passwords need to be reset via Admin API.
const ADMINS = [
  { email: "alex.kosasih@usg.education", password: "Admin123456!", name: "Alexander Kosasih", role: "ADMIN" },
  { email: "feliks.fernando@usg.education", password: "Admin123456!", name: "Feliks Fernando", role: "ADMIN" },
  { email: "kang.irfas@usg.education", password: "Admin123456!", name: "Irfas", role: "ADMIN" },
]

async function main() {
  console.log("Fetching users from Supabase Auth...\n")

  // listUsers returns paginated results; page 1 is enough for a small org
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 100 })
  if (error) {
    console.error("listUsers failed:", error.message)
    process.exit(1)
  }

  const userMap = new Map(data.users.map((u): [string, string] => [u.email ?? "", u.id]))

  for (const { email, password, name, role } of ADMINS) {
    const existingAuthId = userMap.get(email)

    if (existingAuthId) {
      // Already in auth.users — just reset password
      const { error } = await admin.auth.admin.updateUserById(existingAuthId, {
        password,
        email_confirm: true,
      })
      if (error) {
        console.error(`  FAILED update ${email}: ${error.message}`)
      } else {
        console.log(`  UPDATED  ${email} — password reset`)
      }
      continue
    }

    // Not in auth.users — but public.users might have an orphaned row (from raw SQL insert).
    // Delete it first so the trigger can re-create it cleanly.
    const deleteRes = await fetch(
      `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(email)}`,
      {
        method: "DELETE",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Prefer: "return=minimal",
        },
      }
    )
    if (deleteRes.ok) {
      console.log(`  CLEANED  orphaned public.users row for ${email}`)
    }

    // Create in auth.users via Admin API — trigger auto-creates public.users row
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    })
    if (error) {
      console.error(`  FAILED create ${email}: ${error.message}`)
    } else {
      console.log(`  CREATED  ${email} (id: ${data.user.id})`)
    }
  }

  console.log("\nDone. Login dengan password: Admin123456!")
  console.log("Ganti password setelah login pertama.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
