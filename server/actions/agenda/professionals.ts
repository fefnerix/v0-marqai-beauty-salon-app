"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getCurrentCompanyId } from "@/lib/session/company"

export interface Professional {
  id: string
  company_id: string
  name: string
  active: boolean
  color: string
  created_at: string
}

export interface CreateProfessionalData {
  name: string
  color?: string
}

export interface ProfessionalAbsence {
  id: string
  company_id: string
  professional_id: string
  kind: "vacation" | "time_off" | "leave"
  start_at: string
  end_at: string
  notes: string | null
  created_at: string
}

export interface CreateAbsenceData {
  professionalId: string
  kind: "vacation" | "time_off" | "leave"
  startAt: string
  endAt: string
  notes?: string
}

export async function getProfessionals() {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()

  const { data: professionals, error } = await supabase
    .from("professionals")
    .select("*")
    .eq("company_id", companyId)
    .eq("active", true)
    .order("name")

  if (error) {
    console.error("Error fetching professionals:", error)
    throw new Error("Erro ao carregar profissionais")
  }

  return professionals as Professional[]
}

export async function createProfessional(data: CreateProfessionalData) {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()

  try {
    const { data: professional, error } = await supabase
      .from("professionals")
      .insert({
        company_id: companyId,
        name: data.name,
        color: data.color || "#3B82F6",
        active: true,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/agenda")
    return { success: true, data: professional }
  } catch (error) {
    console.error("Error creating professional:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar profissional",
    }
  }
}

export async function getProfessionalAbsences(professionalId?: string) {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()

  let query = supabase
    .from("professional_absences")
    .select(`
      *,
      professional:professionals(name)
    `)
    .eq("company_id", companyId)
    .gte("end_at", new Date().toISOString()) // Only future/current absences
    .order("start_at")

  if (professionalId) {
    query = query.eq("professional_id", professionalId)
  }

  const { data: absences, error } = await query

  if (error) {
    console.error("Error fetching absences:", error)
    throw new Error("Erro ao carregar ausências")
  }

  return absences as ProfessionalAbsence[]
}

export async function createAbsence(data: CreateAbsenceData) {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()

  try {
    const { data: absence, error } = await supabase
      .from("professional_absences")
      .insert({
        company_id: companyId,
        professional_id: data.professionalId,
        kind: data.kind,
        start_at: data.startAt,
        end_at: data.endAt,
        notes: data.notes || null,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/agenda")
    return { success: true, data: absence }
  } catch (error) {
    console.error("Error creating absence:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar ausência",
    }
  }
}

export const createProfessionalAbsence = createAbsence

export async function getProfessionalSchedule(professionalId: string) {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()

  try {
    // Get professional's work schedule settings
    const { data: schedule, error } = await supabase
      .from("professional_schedules")
      .select("*")
      .eq("company_id", companyId)
      .eq("professional_id", professionalId)
      .order("day_of_week")

    if (error && error.code !== "PGRST116") throw error

    // If no schedule exists, return default schedule
    if (!schedule || schedule.length === 0) {
      const defaultSchedule = Array.from({ length: 7 }, (_, i) => ({
        professional_id: professionalId,
        company_id: companyId,
        day_of_week: i,
        is_working: i >= 1 && i <= 5, // Monday to Friday
        start_time: "09:00",
        end_time: "18:00",
        break_start: "12:00",
        break_end: "13:00",
      }))

      return defaultSchedule
    }

    return schedule
  } catch (error) {
    console.error("Error fetching professional schedule:", error)
    throw new Error("Erro ao carregar horários do profissional")
  }
}

export async function updateProfessionalSchedule(
  professionalId: string,
  scheduleData: Array<{
    day_of_week: number
    is_working: boolean
    start_time?: string
    end_time?: string
    break_start?: string
    break_end?: string
  }>,
) {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()

  try {
    // Delete existing schedule
    await supabase
      .from("professional_schedules")
      .delete()
      .eq("company_id", companyId)
      .eq("professional_id", professionalId)

    // Insert new schedule
    const scheduleInserts = scheduleData.map((day) => ({
      company_id: companyId,
      professional_id: professionalId,
      ...day,
    }))

    const { data: newSchedule, error } = await supabase.from("professional_schedules").insert(scheduleInserts).select()

    if (error) throw error

    revalidatePath("/agenda")
    return { success: true, data: newSchedule }
  } catch (error) {
    console.error("Error updating professional schedule:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao atualizar horários",
    }
  }
}

export async function getProfessionalProductivity(date: string) {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()

  const startOfDay = `${date}T00:00:00.000Z`
  const endOfDay = `${date}T23:59:59.999Z`

  // Get all professionals
  const { data: professionals, error: profError } = await supabase
    .from("professionals")
    .select("id, name, color")
    .eq("company_id", companyId)
    .eq("active", true)

  if (profError) throw profError

  // Get appointments for the day
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
    .gte("start_at", startOfDay)
    .lte("start_at", endOfDay)
    .is("deleted_at", null)
    .in("status", ["scheduled", "in_progress", "done"])

  if (aptError) throw aptError

  // Calculate productivity for each professional
  const productivity = professionals.map((prof) => {
    const profAppointments = appointments.filter((apt) => apt.professional_id === prof.id)

    const totalMinutesWorked = profAppointments.reduce((total, apt) => {
      if (apt.start_at && apt.end_at) {
        const start = new Date(apt.start_at)
        const end = new Date(apt.end_at)
        return total + (end.getTime() - start.getTime()) / (1000 * 60)
      }
      return total
    }, 0)

    // Assuming 8-hour work day (480 minutes)
    const workDayMinutes = 480
    const productivityPercentage = Math.round((totalMinutesWorked / workDayMinutes) * 100)

    return {
      ...prof,
      totalMinutesWorked,
      productivityPercentage: Math.min(productivityPercentage, 100),
      appointmentsCount: profAppointments.length,
    }
  })

  return productivity
}

export async function getProfessionalById(professionalId: string) {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()

  try {
    const { data: professional, error } = await supabase
      .from("professionals")
      .select(`
        *,
        total_appointments:appointments(count),
        total_revenue:appointments(price)
      `)
      .eq("id", professionalId)
      .eq("company_id", companyId)
      .single()

    if (error) throw error

    // Calculate totals from the aggregated data
    const totalAppointments = professional.total_appointments?.[0]?.count || 0
    const totalRevenue = professional.total_revenue?.reduce((sum: number, apt: any) => sum + (apt.price || 0), 0) || 0

    return {
      ...professional,
      total_appointments: totalAppointments,
      total_revenue: totalRevenue,
      working_hours_per_week: 40, // Mock data - would come from schedule calculation
      rating: 4.5, // Mock data - would come from reviews
    }
  } catch (error) {
    console.error("Error fetching professional:", error)
    throw new Error("Erro ao carregar profissional")
  }
}

export async function getProfessionalAppointments(professionalId: string, limit = 10) {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()

  try {
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(`
        *,
        service:services(name, duration, price)
      `)
      .eq("professional_id", professionalId)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .gte("start_time", new Date().toISOString())
      .order("start_time")
      .limit(limit)

    if (error) throw error

    return appointments || []
  } catch (error) {
    console.error("Error fetching professional appointments:", error)
    throw new Error("Erro ao carregar agendamentos do profissional")
  }
}
