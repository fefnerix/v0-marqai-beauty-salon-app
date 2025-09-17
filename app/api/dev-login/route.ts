import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

function devEnabled() {
  return process.env.ENABLE_DEV_LOGIN === "1" && process.env.NODE_ENV !== "production"
}

async function ensureDevAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const email = process.env.DEV_ADMIN_EMAIL!
  const password = process.env.DEV_ADMIN_PASSWORD!
  const companyName = process.env.DEV_COMPANY_NAME || "Barbearia Dev"

  const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })

  // 1) garante usuário no Auth
  let { data: getUser } = await admin.auth.admin.getUserByEmail(email)
  if (!getUser?.user) {
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: "Dev Owner" },
    })
    if (cErr) throw new Error(`createUser: ${cErr.message}`)
    getUser = { user: created.user }
  }
  const uid = getUser.user.id

  // 2) garante empresa
  const { data: compSel, error: sErr } = await admin.from("companies").select("id").eq("name", companyName).limit(1)
  if (sErr) throw new Error(`selectCompany: ${sErr.message}`)
  let companyId = compSel?.[0]?.id as string | undefined
  if (!companyId) {
    const { data: ins, error: iErr } = await admin.from("companies").insert({ name: companyName }).select("id").single()
    if (iErr) throw new Error(`insertCompany: ${iErr.message}`)
    companyId = ins.id
  }

  // 3) membership como OWNER
  const { error: mErr } = await admin
    .from("company_members")
    .upsert({ company_id: companyId, user_id: uid, role: "owner" as any }, { onConflict: "company_id,user_id" })
  if (mErr) throw new Error(`upsertMember: ${mErr.message}`)

  return { uid, email, password }
}

async function handle(req: NextRequest) {
  if (!devEnabled()) {
    return NextResponse.json({ ok: false, error: "dev_login_disabled" }, { status: 403 })
  }

  try {
    const { email, password } = await ensureDevAdmin()

    // 4) cria sessão e seta cookie via auth-helpers (route handler)
    const res = NextResponse.redirect(new URL("/dashboard", req.url))
    const supabase = createRouteHandlerClient({ cookies })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return NextResponse.json({ ok: false, step: "signInWithPassword", error: error.message }, { status: 500 })
    }
    return res
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return handle(req)
}
export async function POST(req: NextRequest) {
  return handle(req)
}
