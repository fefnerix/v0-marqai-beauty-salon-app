"use client"

import { DragOverlay } from "@dnd-kit/core"
import { AppointmentCard } from "./appointment-card"
import type { AppointmentWithDetails } from "@/server/actions/agenda/appointments"

interface DragOverlayComponentProps {
  activeAppointment: AppointmentWithDetails | null
}

export function DragOverlayComponent({ activeAppointment }: DragOverlayComponentProps) {
  return (
    <DragOverlay>
      {activeAppointment && (
        <div className="rotate-3 scale-105">
          <AppointmentCard
            appointment={activeAppointment}
            onUpdate={() => {}}
            className="shadow-lg border-2 border-primary"
          />
        </div>
      )}
    </DragOverlay>
  )
}
