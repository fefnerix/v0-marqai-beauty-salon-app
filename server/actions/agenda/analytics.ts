"use server"

import { createServerClient } from "@/lib/supabase/server"
import { getCurrentCompanyId } from "@/lib/session/company"
import { subDays, format } from "date-fns"

export async function getScheduleHeatmapData(weekStart: Date, professionalId?: string) {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    let query = supabase
      .from("appointments")
      .select(`
        start_time,
        end_time,
        professional_id,
        price,
        status
      `)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .gte("start_time", weekStart.toISOString())
      .lte("start_time", weekEnd.toISOString())
      .neq("status", "canceled")

    if (professionalId) {
      query = query.eq("professional_id", professionalId)
    }

    const { data: appointments, error } = await query

    if (error) throw error

    // Process data into heatmap format
    const heatmapData: Array<{
      date: string
      hour: number
      density: number
      appointments_count: number
      professionals_count: number
      revenue: number
    }> = []

    // Generate all time slots for the week
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(weekStart)
      currentDate.setDate(weekStart.getDate() + day)

      for (let hour = 8; hour < 20; hour++) {
        const slotStart = new Date(currentDate)
        slotStart.setHours(hour, 0, 0, 0)
        const slotEnd = new Date(currentDate)
        slotEnd.setHours(hour + 1, 0, 0, 0)

        const slotAppointments =
          appointments?.filter((apt) => {
            const aptStart = new Date(apt.start_time)
            return aptStart >= slotStart && aptStart < slotEnd
          }) || []

        const uniqueProfessionals = new Set(slotAppointments.map((apt) => apt.professional_id))
        const totalRevenue = slotAppointments.reduce((sum, apt) => sum + (apt.price || 0), 0)

        // Calculate density (0-1 based on appointments vs available slots)
        const maxPossibleAppointments = professionalId ? 4 : 12 // Assuming 15min slots
        const density = Math.min(slotAppointments.length / maxPossibleAppointments, 1)

        heatmapData.push({
          date: currentDate.toISOString().split("T")[0],
          hour,
          density,
          appointments_count: slotAppointments.length,
          professionals_count: uniqueProfessionals.size,
          revenue: totalRevenue,
        })
      }
    }

    return heatmapData
  } catch (error) {
    console.error("Erro ao buscar dados do heatmap:", error)
    throw new Error("Falha ao buscar dados do heatmap")
  }
}

export async function getAnalyticsData(days: number, professionalId?: string) {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    const endDate = new Date()
    const startDate = subDays(endDate, days)

    let appointmentsQuery = supabase
      .from("appointments")
      .select(`
        *,
        professional:professionals(name, color),
        service:services(name, duration, price)
      `)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .gte("start_time", startDate.toISOString())
      .lte("start_time", endDate.toISOString())

    if (professionalId && professionalId !== "all") {
      appointmentsQuery = appointmentsQuery.eq("professional_id", professionalId)
    }

    const { data: appointments, error: appointmentsError } = await appointmentsQuery

    if (appointmentsError) throw appointmentsError

    // Calculate KPIs
    const totalAppointments = appointments?.length || 0
    const totalRevenue = appointments?.reduce((sum, apt) => sum + (apt.price || 0), 0) || 0
    const avgAppointmentValue = totalAppointments > 0 ? totalRevenue / totalAppointments : 0
    const noShowCount = appointments?.filter((apt) => apt.status === "no_show").length || 0
    const noShowRate = totalAppointments > 0 ? noShowCount / totalAppointments : 0

    // Appointments by day
    const appointmentsByDay =
      appointments?.reduce(
        (acc, apt) => {
          const day = format(new Date(apt.start_time), "EEE")
          if (!acc[day]) acc[day] = { count: 0, revenue: 0 }
          acc[day].count++
          acc[day].revenue += apt.price || 0
          return acc
        },
        {} as Record<string, { count: number; revenue: number }>,
      ) || {}

    const appointmentsByDayArray = Object.entries(appointmentsByDay).map(([day, data]) => ({
      day,
      ...data,
    }))

    // Appointments by hour
    const appointmentsByHour =
      appointments?.reduce(
        (acc, apt) => {
          const hour = new Date(apt.start_time).getHours()
          if (!acc[hour]) acc[hour] = { count: 0, total_duration: 0 }
          acc[hour].count++
          acc[hour].total_duration += apt.service?.duration || 60
          return acc
        },
        {} as Record<number, { count: number; total_duration: number }>,
      ) || {}

    const appointmentsByHourArray = Object.entries(appointmentsByHour).map(([hour, data]) => ({
      hour: Number.parseInt(hour),
      count: data.count,
      avg_duration: data.count > 0 ? data.total_duration / data.count : 0,
    }))

    // Professional performance
    const professionalPerformance =
      appointments?.reduce(
        (acc, apt) => {
          const profName = apt.professional?.name || "Desconhecido"
          if (!acc[profName]) acc[profName] = { appointments: 0, revenue: 0, ratings: [] }
          acc[profName].appointments++
          acc[profName].revenue += apt.price || 0
          return acc
        },
        {} as Record<string, { appointments: number; revenue: number; ratings: number[] }>,
      ) || {}

    const professionalPerformanceArray = Object.entries(professionalPerformance).map(([name, data]) => ({
      name,
      appointments: data.appointments,
      revenue: data.revenue,
      rating: 4.5, // Mock rating - would come from reviews table
    }))

    // Service popularity
    const servicePopularity =
      appointments?.reduce(
        (acc, apt) => {
          const serviceName = apt.service?.name || "Serviço desconhecido"
          if (!acc[serviceName]) acc[serviceName] = { count: 0, revenue: 0, total_duration: 0 }
          acc[serviceName].count++
          acc[serviceName].revenue += apt.price || 0
          acc[serviceName].total_duration += apt.service?.duration || 60
          return acc
        },
        {} as Record<string, { count: number; revenue: number; total_duration: number }>,
      ) || {}

    const servicePopularityArray = Object.entries(servicePopularity).map(([name, data]) => ({
      name,
      count: data.count,
      revenue: data.revenue,
      avg_duration: data.count > 0 ? data.total_duration / data.count : 0,
    }))

    // Monthly trends (mock data for now)
    const monthlyTrends = [
      { month: "Jan", appointments: 120, revenue: 15000, new_clients: 25 },
      { month: "Fev", appointments: 135, revenue: 18000, new_clients: 30 },
      { month: "Mar", appointments: 150, revenue: 22000, new_clients: 35 },
    ]

    return {
      appointments_by_day: appointmentsByDayArray,
      appointments_by_hour: appointmentsByHourArray,
      professional_performance: professionalPerformanceArray.sort((a, b) => b.revenue - a.revenue),
      service_popularity: servicePopularityArray.sort((a, b) => b.count - a.count),
      monthly_trends: monthlyTrends,
      kpis: {
        total_appointments: totalAppointments,
        total_revenue: totalRevenue,
        avg_appointment_value: avgAppointmentValue,
        client_retention_rate: 0.75, // Mock data
        no_show_rate: noShowRate,
        occupancy_rate: 0.68, // Mock data
      },
    }
  } catch (error) {
    console.error("Erro ao buscar dados de analytics:", error)
    throw new Error("Falha ao buscar dados de analytics")
  }
}

export async function getProfessionalPerformance(professionalId: string, days = 30) {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    const endDate = new Date()
    const startDate = subDays(endDate, days)

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(`
        *,
        service:services(name, duration, price)
      `)
      .eq("company_id", companyId)
      .eq("professional_id", professionalId)
      .is("deleted_at", null)
      .gte("start_time", startDate.toISOString())
      .lte("start_time", endDate.toISOString())

    if (error) throw error

    const totalAppointments = appointments?.length || 0
    const totalRevenue = appointments?.reduce((sum, apt) => sum + (apt.price || 0), 0) || 0
    const completedAppointments = appointments?.filter((apt) => apt.status === "completed").length || 0
    const noShowCount = appointments?.filter((apt) => apt.status === "no_show").length || 0

    return {
      total_appointments: totalAppointments,
      completed_appointments: completedAppointments,
      total_revenue: totalRevenue,
      avg_appointment_value: totalAppointments > 0 ? totalRevenue / totalAppointments : 0,
      completion_rate: totalAppointments > 0 ? completedAppointments / totalAppointments : 0,
      no_show_rate: totalAppointments > 0 ? noShowCount / totalAppointments : 0,
    }
  } catch (error) {
    console.error("Erro ao buscar performance do profissional:", error)
    throw new Error("Falha ao buscar performance do profissional")
  }
}

export async function getServiceAnalytics(days = 30) {
  const supabase = createServerClient()
  const companyId = await getCurrentCompanyId()

  try {
    const endDate = new Date()
    const startDate = subDays(endDate, days)

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(`
        *,
        service:services(name, duration, price, category)
      `)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .gte("start_time", startDate.toISOString())
      .lte("start_time", endDate.toISOString())

    if (error) throw error

    const serviceStats =
      appointments?.reduce(
        (acc, apt) => {
          const serviceName = apt.service?.name || "Serviço desconhecido"
          if (!acc[serviceName]) {
            acc[serviceName] = {
              count: 0,
              revenue: 0,
              total_duration: 0,
              category: apt.service?.category || "Outros",
            }
          }
          acc[serviceName].count++
          acc[serviceName].revenue += apt.price || 0
          acc[serviceName].total_duration += apt.service?.duration || 60
          return acc
        },
        {} as Record<string, { count: number; revenue: number; total_duration: number; category: string }>,
      ) || {}

    return Object.entries(serviceStats).map(([name, data]) => ({
      name,
      count: data.count,
      revenue: data.revenue,
      avg_duration: data.count > 0 ? data.total_duration / data.count : 0,
      category: data.category,
    }))
  } catch (error) {
    console.error("Erro ao buscar analytics de serviços:", error)
    throw new Error("Falha ao buscar analytics de serviços")
  }
}
