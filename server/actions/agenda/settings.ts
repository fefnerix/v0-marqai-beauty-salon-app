"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface AgendaSettings {
  company_id: string
  allow_overbooking: boolean
  late_cancel_limit_minutes: number
  suggest_next_visit_days: number
  created_at: string
}

export interface UpdateSettingsData {
  companyId: string
  allowOverbooking?: boolean
  lateCancelLimitMinutes?: number
  suggestNextVisitDays?: number
}

export async function getAgendaSettings(companyId: string) {
  const supabase = await createClient()

  const { data: settings, error } = await supabase
    .from("agenda_settings")
    .select("*")
    .eq("company_id", companyId)
    .single()

  if (error) {
    // If no settings exist, create default ones
    if (error.code === "PGRST116") {
      const { data: newSettings, error: createError } = await supabase
        .from("agenda_settings")
        .insert({
          company_id: companyId,
          allow_overbooking: false,
          late_cancel_limit_minutes: 120,
          suggest_next_visit_days: 30,
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating default settings:", createError)
        throw new Error("Erro ao criar configurações padrão")
      }

      return newSettings as AgendaSettings
    }

    console.error("Error fetching agenda settings:", error)
    throw new Error("Erro ao carregar configurações da agenda")
  }

  return settings as AgendaSettings
}

export async function updateAgendaSettings(data: UpdateSettingsData) {
  const supabase = await createClient()

  try {
    const updateData: Partial<AgendaSettings> = {}

    if (data.allowOverbooking !== undefined) {
      updateData.allow_overbooking = data.allowOverbooking
    }
    if (data.lateCancelLimitMinutes !== undefined) {
      updateData.late_cancel_limit_minutes = data.lateCancelLimitMinutes
    }
    if (data.suggestNextVisitDays !== undefined) {
      updateData.suggest_next_visit_days = data.suggestNextVisitDays
    }

    const { data: settings, error } = await supabase
      .from("agenda_settings")
      .update(updateData)
      .eq("company_id", data.companyId)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/agenda")
    return { success: true, data: settings }
  } catch (error) {
    console.error("Error updating agenda settings:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao atualizar configurações",
    }
  }
}

export async function getProductivityAnalytics(companyId: string, startDate: string, endDate: string) {
  const supabase = await createClient()

  try {
    // Get all professionals
    const { data: professionals, error: profError } = await supabase
      .from("professionals")
      .select("id, name, color")
      .eq("company_id", companyId)
      .eq("active", true)

    if (profError) throw profError

    // Get appointments for the date range
    const { data: appointments, error: aptError } = await supabase
      .from("appointments")
      .select(`
        professional_id,
        start_at,
        end_at,
        status,
        appointment_services(
          service:services(duration_minutes, buffer_after_minutes)
        )
      `)
      .eq("company_id", companyId)
      .gte("start_at", startDate)
      .lte("start_at", endDate)
      .is("deleted_at", null)
      .in("status", ["scheduled", "in_progress", "done"])

    if (aptError) throw aptError

    // Calculate analytics for each professional
    const analytics = professionals.map((prof) => {
      const profAppointments = appointments.filter((apt) => apt.professional_id === prof.id)

      const totalMinutesWorked = profAppointments.reduce((total, apt) => {
        if (apt.start_at && apt.end_at) {
          const start = new Date(apt.start_at)
          const end = new Date(apt.end_at)
          return total + (end.getTime() - start.getTime()) / (1000 * 60)
        }
        return total
      }, 0)

      const totalRevenue = profAppointments.reduce((total, apt) => {
        return total + (apt.appointment_services?.length || 0) * 50 // Placeholder revenue calculation
      }, 0)

      // Calculate productivity based on 8-hour work days
      const workDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
      const totalWorkMinutes = workDays * 480 // 8 hours per day
      const productivityPercentage = Math.round((totalMinutesWorked / totalWorkMinutes) * 100)

      return {
        ...prof,
        totalMinutesWorked,
        totalRevenue,
        productivityPercentage: Math.min(productivityPercentage, 100),
        appointmentsCount: profAppointments.length,
        averageAppointmentDuration: profAppointments.length > 0 ? totalMinutesWorked / profAppointments.length : 0,
      }
    })

    return analytics
  } catch (error) {
    console.error("Error fetching productivity analytics:", error)
    throw new Error("Erro ao carregar analytics de produtividade")
  }
}
