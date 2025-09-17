"use server"

import { createServerClient } from "@/lib/supabase/server"
import { getCurrentCompanyId } from "@/lib/session/company"

export async function getClientSuggestions(professionalId: string, startTime: Date, endTime: Date, limit = 5) {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    const { data, error } = await supabase.rpc("generate_client_suggestions", {
      p_professional_id: professionalId,
      p_start_time: startTime.toISOString(),
      p_end_time: endTime.toISOString(),
      p_limit: limit,
    })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Erro ao buscar sugestões de clientes:", error)
    throw new Error("Falha ao buscar sugestões de clientes")
  }
}

export async function createSuggestionAppointment(appointmentData: {
  client_id: string
  professional_id: string
  service_id: string
  start_time: Date
  client_name: string
  client_phone: string
}) {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    // Get service details
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("duration, price")
      .eq("id", appointmentData.service_id)
      .single()

    if (serviceError) throw serviceError

    // Calculate end time
    const endTime = new Date(appointmentData.start_time)
    endTime.setMinutes(endTime.getMinutes() + service.duration)

    // Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        company_id: companyId,
        professional_id: appointmentData.professional_id,
        service_id: appointmentData.service_id,
        client_name: appointmentData.client_name,
        client_phone: appointmentData.client_phone,
        start_time: appointmentData.start_time.toISOString(),
        end_time: endTime.toISOString(),
        price: service.price,
        status: "scheduled",
      })
      .select()
      .single()

    if (appointmentError) throw appointmentError

    // Update client stats
    await supabase.rpc("update_client_stats", {
      p_client_id: appointmentData.client_id,
    })

    return appointment
  } catch (error) {
    console.error("Erro ao criar agendamento da sugestão:", error)
    throw new Error("Falha ao criar agendamento da sugestão")
  }
}

export async function dismissSuggestion(clientId: string, professionalId: string, suggestedTime: Date) {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    const { error } = await supabase
      .from("client_suggestions")
      .update({ status: "declined" })
      .eq("client_id", clientId)
      .eq("professional_id", professionalId)
      .eq("suggested_time", suggestedTime.toISOString())
      .eq("company_id", companyId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Erro ao dispensar sugestão:", error)
    throw new Error("Falha ao dispensar sugestão")
  }
}

export async function getClients() {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("company_id", companyId)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("last_appointment_date", { ascending: false, nullsLast: true })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Erro ao buscar clientes:", error)
    throw new Error("Falha ao buscar clientes")
  }
}

export async function createClient(clientData: {
  name: string
  phone: string
  email?: string
  notes?: string
}) {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    const { data, error } = await supabase
      .from("clients")
      .insert({
        company_id: companyId,
        name: clientData.name,
        phone: clientData.phone,
        email: clientData.email,
        notes: clientData.notes,
      })
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error("Erro ao criar cliente:", error)
    throw new Error("Falha ao criar cliente")
  }
}

export async function updateClientPreferences(
  clientId: string,
  preferences: Array<{
    type: string
    value: any
    weight: number
  }>,
) {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    // Delete existing preferences
    await supabase.from("client_preferences").delete().eq("client_id", clientId).eq("company_id", companyId)

    // Insert new preferences
    const { error } = await supabase.from("client_preferences").insert(
      preferences.map((pref) => ({
        company_id: companyId,
        client_id: clientId,
        preference_type: pref.type,
        preference_value: pref.value,
        weight: pref.weight,
      })),
    )

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Erro ao atualizar preferências do cliente:", error)
    throw new Error("Falha ao atualizar preferências do cliente")
  }
}

export async function getClientHistory(clientId: string) {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        professional:professionals(name),
        service:services(name, duration, price)
      `)
      .eq("company_id", companyId)
      .eq("client_phone", (await supabase.from("clients").select("phone").eq("id", clientId).single()).data?.phone)
      .is("deleted_at", null)
      .order("start_time", { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Erro ao buscar histórico do cliente:", error)
    throw new Error("Falha ao buscar histórico do cliente")
  }
}

export async function getSuggestionStats() {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    const { data, error } = await supabase
      .from("client_suggestions")
      .select("status")
      .eq("company_id", companyId)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

    if (error) throw error

    const stats = (data || []).reduce(
      (acc, suggestion) => {
        acc[suggestion.status] = (acc[suggestion.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const total = data?.length || 0
    const accepted = stats.accepted || 0
    const acceptanceRate = total > 0 ? accepted / total : 0

    return {
      total_suggestions: total,
      accepted_suggestions: accepted,
      acceptance_rate: acceptanceRate,
      pending_suggestions: stats.pending || 0,
      declined_suggestions: stats.declined || 0,
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas de sugestões:", error)
    throw new Error("Falha ao buscar estatísticas de sugestões")
  }
}
