"use client"

import { useState, useEffect } from "react"
import { startOfDay } from "date-fns"
import { AgendaGrid } from "@/components/agenda/agenda-grid"
import { getAgendaByDay } from "@/server/actions/agenda/appointments"
import { getProfessionals } from "@/server/actions/agenda/professionals"
import type { AppointmentWithDetails } from "@/server/actions/agenda/appointments"
import type { Professional } from "@/server/actions/agenda/professionals"

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()))
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [appointmentsData, professionalsData] = await Promise.all([
        getAgendaByDay(selectedDate.toISOString().split("T")[0]),
        getProfessionals(),
      ])

      setAppointments(appointmentsData)
      setProfessionals(professionalsData)
    } catch (error) {
      console.error("Error loading agenda data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedDate])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando agenda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <AgendaGrid
        appointments={appointments}
        professionals={professionals}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onAppointmentUpdate={loadData}
      />
    </div>
  )
}
