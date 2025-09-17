"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export interface CompanyContext {
  id: string
  name: string
  role: string
}

export async function getCurrentCompanyId(): Promise<string> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Get user's company membership
  const { data: membership, error: membershipError } = await supabase
    .from("company_members")
    .select(`
      company_id,
      role,
      company:companies(id, name)
    `)
    .eq("user_id", user.id)
    .eq("active", true)
    .single()

  if (membershipError || !membership) {
    // If no company membership, redirect to onboarding
    redirect("/onboarding")
  }

  return membership.company_id
}

export async function getCurrentCompanyContext(): Promise<CompanyContext> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Get user's company membership with company details
  const { data: membership, error: membershipError } = await supabase
    .from("company_members")
    .select(`
      company_id,
      role,
      company:companies(id, name)
    `)
    .eq("user_id", user.id)
    .eq("active", true)
    .single()

  if (membershipError || !membership) {
    redirect("/onboarding")
  }

  return {
    id: membership.company_id,
    name: membership.company.name,
    role: membership.role,
  }
}

export async function validateCompanyAccess(companyId: string): Promise<boolean> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return false
  }

  // Check if user has access to this company
  const { data: membership, error } = await supabase
    .from("company_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("company_id", companyId)
    .eq("active", true)
    .single()

  return !error && !!membership
}
