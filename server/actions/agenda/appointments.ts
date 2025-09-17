"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { addMinutes, parseISO } from "date-fns"
import { getCurrentCompanyId } from "@/lib/session/company"

export interface CreateAppointmentData {
  professionalId: string
  clientId?: string
  startAt?: string
  serviceIds: string[]
  notes?: string
  overbooked?: boolean
}

export interface MoveAppointmentData {
  id: string
  newStartAt: string
  newProfessionalId?: string
}

export interface AppointmentWithDetails {
  id: string
  company_id: string
  professional_id: string
  client_id: string | null
  start_at: string | null
  end_at: string | null
  status: "scheduled" | "in_progress" | "done" | "no_show" | "canceled"
  overbooked: boolean
  notes: string | null
  created_at: string
  professional: {
    id: string
    name: string
    color: string
  }
  client: {
    id: string
    name: string
    phone: string | null
  } | null
  services: Array<{
    id: string
    name: string
    duration_minutes: number
    buffer_after_minutes: number
    order_index: number
  }>
}

export async function getAgendaByDay(date: string) {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()

  const startOfDay = `${date}T00:00:00.000Z`
  const endOfDay = `${date}T23:59:59.999Z`

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(`
      *,
      professional:professionals(id, name, color),
      client:clients(id, name, phone),
      appointment_services(
        order_index,
        service:services(id, name, duration_minutes, buffer_after_minutes)
      )
    `)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .or(`start_at.gte.${startOfDay},start_at.lte.${endOfDay},start_at.is.null`)
    .order("start_at", { ascending: true })

  if (error) {
    console.error("Error fetching agenda:", error)
    throw new Error("Erro ao carregar agenda")
  }

  // Transform the data to match our interface
  const transformedAppointments: AppointmentWithDetails[] = appointments.map((apt) => ({
    ...apt,
    services: apt.appointment_services
      .map((as) => ({
        ...as.service,
        order_index: as.order_index,
      }))
      .sort((a, b) => a.order_index - b.order_index),
  }))

  return transformedAppointments
}

export async function createAppointment(data: CreateAppointmentData) {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()

  try {
    // First, get services to calculate duration
    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("id, duration_minutes, buffer_after_minutes")
      .in("id", data.serviceIds)
      .eq("company_id", companyId)

    if (servicesError) throw servicesError

    // Calculate total duration including buffers
    const totalDuration = services.reduce(
      (total, service) => total + service.duration_minutes + service.buffer_after_minutes,
      0,
    )

    let endAt: string | null = null
    if (data.startAt) {
      const startDate = parseISO(data.startAt)
      endAt = addMinutes(startDate, totalDuration).toISOString()
    }

    // Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        company_id: companyId,
        professional_id: data.professionalId,
        client_id: data.clientId || null,
        start_at: data.startAt || null,
        end_at: endAt,
        notes: data.notes || null,
        overbooked: data.overbooked || false,
        status: "scheduled",
      })
      .select()
      .single()

    if (appointmentError) throw appointmentError

    // Add services to appointment
    const appointmentServices = data.serviceIds.map((serviceId, index) => ({
      appointment_id: appointment.id,
      service_id: serviceId,
      order_index: index,
    }))

    const { error: servicesInsertError } = await supabase.from("appointment_services").insert(appointmentServices)

    if (servicesInsertError) throw servicesInsertError

    revalidatePath("/agenda")
    return { success: true, data: appointment }
  } catch (error) {
    console.error("Error creating appointment:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar agendamento",
    }
  }
}

export async function moveAppointment(data: MoveAppointmentData) {
  const supabase = await createClient()

  try {
    // Get current appointment with services to recalculate end time
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select(`
        *,
        appointment_services(
          service:services(duration_minutes, buffer_after_minutes)
        )
      `)
      .eq("id", data.id)
      .single()

    if (fetchError) throw fetchError

    // Calculate new end time
    const totalDuration = appointment.appointment_services.reduce(
      (total: number, as: any) => total + as.service.duration_minutes + as.service.buffer_after_minutes,
      0,
    )

    const newStartDate = parseISO(data.newStartAt)
    const newEndAt = addMinutes(newStartDate, totalDuration).toISOString()

    // Update appointment
    const updateData: any = {
      start_at: data.newStartAt,
      end_at: newEndAt,
      last_write_at: new Date().toISOString(),
    }

    if (data.newProfessionalId) {
      updateData.professional_id = data.newProfessionalId
    }

    const { error: updateError } = await supabase.from("appointments").update(updateData).eq("id", data.id)

    if (updateError) throw updateError

    revalidatePath("/agenda")
    return { success: true }
  } catch (error) {
    console.error("Error moving appointment:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao mover agendamento",
    }
  }
}

export async function setAppointmentStatus(
  id: string,
  status: "scheduled" | "in_progress" | "done" | "no_show" | "canceled",
) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from("appointments")
      .update({
        status,
        last_write_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) throw error

    revalidatePath("/agenda")
    return { success: true }
  } catch (error) {
    console.error("Error updating appointment status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao atualizar status",
    }
  }
}

export async function deleteAppointment(id: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from("appointments")
      .update({
        deleted_at: new Date().toISOString(),
        last_write_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) throw error

    revalidatePath("/agenda")
    return { success: true }
  } catch (error) {
    console.error("Error deleting appointment:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao excluir agendamento",
    }
  }
}

export async function restoreAppointment(id: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from("appointments")
      .update({
        deleted_at: null,
        last_write_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) throw error

    revalidatePath("/agenda")
    return { success: true }
  } catch (error) {
    console.error("Error restoring appointment:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao restaurar agendamento",
    }
  }
}

export async function getDeletedAppointments() {
  const supabase = await createClient()
  const companyId = await getCurrentCompanyId()

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(`
      *,
      professional:professionals(name),
      client:clients(name),
      appointment_services(
        service:services(name)
      )
    `)
    .eq("company_id", companyId)
    .not("deleted_at", "is", null)
    .gte("deleted_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
    .order("deleted_at", { ascending: false })

  if (error) {
    console.error("Error fetching deleted appointments:", error)
    throw new Error("Erro ao carregar lixeira")
  }

  return appointments
}
