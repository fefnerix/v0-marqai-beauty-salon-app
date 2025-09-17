import type React from "react"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 border-r bg-background">
        <Sidebar />
      </aside>

      <div className="flex-1 md:ml-64">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
