"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { AppointmentCard } from "./appointment-card"
import type { AppointmentWithDetails } from "@/server/actions/agenda/appointments"

interface DraggableAppointmentCardProps {
  appointment: AppointmentWithDetails
  onUpdate: () => void
  className?: string
}

export function DraggableAppointmentCard({ appointment, onUpdate, className }: DraggableAppointmentCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appointment.id,
    data: {
      type: "appointment",
      appointment,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
      <AppointmentCard appointment={appointment} onUpdate={onUpdate} className={className} />
    </div>
  )
}
