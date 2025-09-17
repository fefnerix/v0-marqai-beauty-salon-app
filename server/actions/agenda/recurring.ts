"use server"

import { createServerClient } from "@/lib/supabase/server"
import { getCurrentCompanyId } from "@/lib/session/company"

interface RepetitionData {
  type: "weekly" | "biweekly" | "monthly"
  endType: "count" | "date"
  count?: number
  endDate?: Date
}

export async function createRecurringAppointment(appointmentId: string, repetitionData: RepetitionData) {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    // Call the database function to generate recurring appointments
    const { data, error } = await supabase.rpc("generate_recurring_appointments", {
      p_appointment_id: appointmentId,
      p_repetition_type: repetitionData.type,
      p_repetition_count: repetitionData.endType === "count" ? repetitionData.count : null,
      p_repetition_end_date:
        repetitionData.endType === "date" ? repetitionData.endDate?.toISOString().split("T")[0] : null,
    })

    if (error) throw error

    return { success: true, created_count: data }
  } catch (error) {
    console.error("Erro ao criar agendamentos recorrentes:", error)
    throw new Error("Falha ao criar agendamentos recorrentes")
  }
}

export async function updateRecurringAppointment(
  appointmentId: string,
  updateType: "this_only" | "this_and_future" | "all",
  appointmentData: {
    client_name?: string
    client_phone?: string
    notes?: string
    price?: number
  },
) {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    const { data, error } = await supabase.rpc("update_recurring_series", {
      p_parent_id: appointmentId,
      p_update_type: updateType,
      p_appointment_data: appointmentData,
    })

    if (error) throw error

    return { success: true, updated_count: data }
  } catch (error) {
    console.error("Erro ao atualizar agendamentos recorrentes:", error)
    throw new Error("Falha ao atualizar agendamentos recorrentes")
  }
}

export async function deleteRecurringAppointment(
  appointmentId: string,
  deleteType: "this_only" | "this_and_future" | "all",
) {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    const { data, error } = await supabase.rpc("delete_recurring_series", {
      p_appointment_id: appointmentId,
      p_delete_type: deleteType,
    })

    if (error) throw error

    return { success: true, deleted_count: data }
  } catch (error) {
    console.error("Erro ao excluir agendamentos recorrentes:", error)
    throw new Error("Falha ao excluir agendamentos recorrentes")
  }
}

export async function getRecurringAppointments(parentId: string) {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        professional:professionals(name, color),
        service:services(name, duration, price)
      `)
      .or(`id.eq.${parentId},parent_appointment_id.eq.${parentId}`)
      .eq("company_id", companyId)
      .order("start_time")

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Erro ao buscar agendamentos recorrentes:", error)
    throw new Error("Falha ao buscar agendamentos recorrentes")
  }
}

export async function isRecurringAppointment(appointmentId: string) {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("is_recurring_parent, parent_appointment_id, repetition_type")
      .eq("id", appointmentId)
      .eq("company_id", companyId)
      .single()

    if (error) throw error

    return {
      isRecurring: data.is_recurring_parent || data.parent_appointment_id !== null,
      isParent: data.is_recurring_parent,
      repetitionType: data.repetition_type,
    }
  } catch (error) {
    console.error("Erro ao verificar agendamento recorrente:", error)
    return { isRecurring: false, isParent: false, repetitionType: "none" }
  }
}
