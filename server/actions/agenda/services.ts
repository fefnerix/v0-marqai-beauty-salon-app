"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface Service {
  id: string
  company_id: string
  name: string
  duration_minutes: number
  buffer_after_minutes: number
  created_at: string
}

export interface CreateServiceData {
  companyId: string
  name: string
  durationMinutes: number
  bufferAfterMinutes?: number
}

export async function getServices(companyId: string) {
  const supabase = await createClient()

  const { data: services, error } = await supabase
    .from("services")
    .select("*")
    .eq("company_id", companyId)
    .order("name")

  if (error) {
    console.error("Error fetching services:", error)
    throw new Error("Erro ao carregar serviços")
  }

  return services as Service[]
}

export async function createService(data: CreateServiceData) {
  const supabase = await createClient()

  try {
    const { data: service, error } = await supabase
      .from("services")
      .insert({
        company_id: data.companyId,
        name: data.name,
        duration_minutes: data.durationMinutes,
        buffer_after_minutes: data.bufferAfterMinutes || 0,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/agenda")
    return { success: true, data: service }
  } catch (error) {
    console.error("Error creating service:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar serviço",
    }
  }
}
