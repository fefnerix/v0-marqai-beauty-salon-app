"use client"

import { useMemo } from "react"
import { format, parseISO } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { DraggableAppointmentCard } from "./draggable-appointment-card"
import { DroppableTimeSlot } from "./droppable-time-slot"
import type { AppointmentWithDetails } from "@/server/actions/agenda/appointments"
import type { Professional } from "@/server/actions/agenda/professionals"

interface ProfessionalColumnProps {
  professional: Professional
  appointments: AppointmentWithDetails[]
  timeSlots: string[]
  selectedDate: Date
  onCreateAppointment: (professionalId: string, timeSlot?: string) => void
  onAppointmentUpdate: () => void
}

export function ProfessionalColumn({
  professional,
  appointments,
  timeSlots,
  selectedDate,
  onCreateAppointment,
  onAppointmentUpdate,
}: ProfessionalColumnProps) {
  // Calculate productivity percentage
  const productivity = useMemo(() => {
    const totalMinutes = appointments.reduce((total, apt) => {
      if (apt.start_at && apt.end_at) {
        const start = parseISO(apt.start_at)
        const end = parseISO(apt.end_at)
        return total + (end.getTime() - start.getTime()) / (1000 * 60)
      }
      return total
    }, 0)

    const workDayMinutes = 10 * 60 // 10 hours
    return Math.round((totalMinutes / workDayMinutes) * 100)
  }, [appointments])

  // Map appointments to time slots
  const appointmentsByTime = useMemo(() => {
    const mapped: Record<string, AppointmentWithDetails> = {}
    appointments.forEach((apt) => {
      if (apt.start_at) {
        const time = format(parseISO(apt.start_at), "HH:mm")
        mapped[time] = apt
      }
    })
    return mapped
  }, [appointments])

  return (
    <div className="w-80 border-r">
      {/* Professional Header */}
      <div className="flex h-16 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: professional.color }} />
          <div>
            <h3 className="font-medium">{professional.name}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {productivity}% ocupado
              </Badge>
              <span className="text-xs text-muted-foreground">{appointments.length} agendamentos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Time Slots */}
      <div className="relative">
        {timeSlots.map((timeSlot) => {
          const appointment = appointmentsByTime[timeSlot]

          return (
            <DroppableTimeSlot
              key={timeSlot}
              professionalId={professional.id}
              timeSlot={timeSlot}
              date={selectedDate}
              isOccupied={!!appointment}
              onCreateAppointment={onCreateAppointment}
            >
              {appointment && (
                <DraggableAppointmentCard
                  appointment={appointment}
                  onUpdate={onAppointmentUpdate}
                  className="absolute inset-x-2 inset-y-1"
                />
              )}
            </DroppableTimeSlot>
          )
        })}
      </div>
    </div>
  )
}
