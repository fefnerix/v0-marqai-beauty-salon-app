"use client"

import type React from "react"

import { useDroppable } from "@dnd-kit/core"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DroppableTimeSlotProps {
  professionalId: string
  timeSlot: string
  date: Date
  isOccupied: boolean
  onCreateAppointment: (professionalId: string, timeSlot: string) => void
  children?: React.ReactNode
}

export function DroppableTimeSlot({
  professionalId,
  timeSlot,
  date,
  isOccupied,
  onCreateAppointment,
  children,
}: DroppableTimeSlotProps) {
  const dropId = `${professionalId}-${timeSlot}`
  const { isOver, setNodeRef } = useDroppable({
    id: dropId,
    data: {
      type: "timeSlot",
      professionalId,
      timeSlot,
      date: date.toISOString(),
    },
  })

  if (isOccupied && children) {
    return (
      <div ref={setNodeRef} className="relative h-16 border-b">
        {children}
        {isOver && <div className="absolute inset-0 bg-primary/20 border-2 border-primary border-dashed rounded-md" />}
      </div>
    )
  }

  return (
    <div ref={setNodeRef} className="relative h-16 border-b">
      <Button
        variant="ghost"
        className={cn(
          "h-full w-full justify-start rounded-none text-left hover:bg-muted/50 transition-colors",
          isOver && "bg-primary/10 border-2 border-primary border-dashed",
        )}
        onClick={() => onCreateAppointment(professionalId, timeSlot)}
      >
        <span className="text-xs text-muted-foreground">{isOver ? "Soltar aqui" : "Disponível"}</span>
      </Button>
      {isOver && (
        <div className="absolute inset-0 bg-primary/20 border-2 border-primary border-dashed rounded-md pointer-events-none" />
      )}
    </div>
  )
}
