"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface WaitlistEntry {
  id: string
  company_id: string
  client_id: string
  professional_id: string | null
  desired_date: string | null
  priority: "normal" | "vip" | "urgent"
  position: number
  notes: string | null
  created_at: string
  client: {
    id: string
    name: string
    phone: string | null
  }
  professional: {
    id: string
    name: string
  } | null
}

export interface CreateWaitlistData {
  companyId: string
  clientId: string
  professionalId?: string
  desiredDate?: string
  priority?: "normal" | "vip" | "urgent"
  notes?: string
}

export async function getWaitlist(companyId: string) {
  const supabase = await createClient()

  const { data: waitlist, error } = await supabase
    .from("waitlist")
    .select(`
      *,
      client:clients(id, name, phone),
      professional:professionals(id, name)
    `)
    .eq("company_id", companyId)
    .order("priority", { ascending: false }) // urgent, vip, normal
    .order("position", { ascending: true })

  if (error) {
    console.error("Error fetching waitlist:", error)
    throw new Error("Erro ao carregar fila de espera")
  }

  return waitlist as WaitlistEntry[]
}

export async function addToWaitlist(data: CreateWaitlistData) {
  const supabase = await createClient()

  try {
    // Get next position
    const { data: lastEntry } = await supabase
      .from("waitlist")
      .select("position")
      .eq("company_id", data.companyId)
      .order("position", { ascending: false })
      .limit(1)
      .single()

    const nextPosition = (lastEntry?.position || 0) + 1

    const { data: waitlistEntry, error } = await supabase
      .from("waitlist")
      .insert({
        company_id: data.companyId,
        client_id: data.clientId,
        professional_id: data.professionalId || null,
        desired_date: data.desiredDate || null,
        priority: data.priority || "normal",
        position: nextPosition,
        notes: data.notes || null,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/agenda")
    return { success: true, data: waitlistEntry }
  } catch (error) {
    console.error("Error adding to waitlist:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao adicionar à fila de espera",
    }
  }
}

export async function removeFromWaitlist(id: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase.from("waitlist").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/agenda")
    return { success: true }
  } catch (error) {
    console.error("Error removing from waitlist:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao remover da fila de espera",
    }
  }
}

export async function reorderWaitlist(companyId: string, reorderedIds: string[]) {
  const supabase = await createClient()

  try {
    // Update positions based on new order
    const updates = reorderedIds.map((id, index) => ({
      id,
      position: index + 1,
    }))

    for (const update of updates) {
      const { error } = await supabase
        .from("waitlist")
        .update({ position: update.position })
        .eq("id", update.id)
        .eq("company_id", companyId)

      if (error) throw error
    }

    revalidatePath("/agenda")
    return { success: true }
  } catch (error) {
    console.error("Error reordering waitlist:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao reordenar fila de espera",
    }
  }
}

export async function suggestClientsForSlot(companyId: string, professionalId: string, dateTime: string) {
  const supabase = await createClient()

  try {
    // Get waitlist entries for this professional or any professional
    const { data: waitlistSuggestions, error: waitlistError } = await supabase
      .from("waitlist")
      .select(`
        *,
        client:clients(id, name, phone)
      `)
      .eq("company_id", companyId)
      .or(`professional_id.eq.${professionalId},professional_id.is.null`)
      .order("priority", { ascending: false })
      .order("position", { ascending: true })
      .limit(5)

    if (waitlistError) throw waitlistError

    // Get clients who haven't been served recently (simple heuristic)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: recentClients, error: recentError } = await supabase
      .from("clients")
      .select(`
        *,
        recent_appointments:appointments!inner(id)
      `)
      .eq("company_id", companyId)
      .not("recent_appointments.professional_id", "eq", professionalId)
      .gte("recent_appointments.start_at", thirtyDaysAgo)
      .limit(3)

    if (recentError) throw recentError

    return {
      waitlistSuggestions: waitlistSuggestions || [],
      recentClientsSuggestions: recentClients || [],
    }
  } catch (error) {
    console.error("Error getting client suggestions:", error)
    return {
      waitlistSuggestions: [],
      recentClientsSuggestions: [],
    }
  }
}
