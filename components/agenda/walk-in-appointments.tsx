"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, User } from "lucide-react"
import type { AppointmentWithDetails } from "@/server/actions/agenda/appointments"

interface WalkInAppointmentsProps {
  appointments: AppointmentWithDetails[]
  onAppointmentUpdate: () => void
  onScheduleAppointment: (appointmentId: string, professionalId: string, timeSlot: string) => void
}

export function WalkInAppointments({
  appointments,
  onAppointmentUpdate,
  onScheduleAppointment,
}: WalkInAppointmentsProps) {
  if (appointments.length === 0) {
    return (
      <div className="w-80 border-l bg-muted/30">
        <div className="flex h-16 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">Sem Horário</h3>
            <Badge variant="secondary">0</Badge>
          </div>
        </div>
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          Nenhum encaixe pendente
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 border-l bg-muted/30">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Sem Horário</h3>
          <Badge variant="secondary">{appointments.length}</Badge>
        </div>
      </div>

      {/* Walk-in Appointments List */}
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="p-4 space-y-3">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{appointment.client?.name || "Cliente não informado"}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Encaixe
                </Badge>
              </div>

              {/* Services */}
              <div className="mb-3">
                {appointment.services.map((service) => (
                  <Badge key={service.id} variant="secondary" className="mr-1 mb-1 text-xs">
                    {service.name}
                  </Badge>
                ))}
              </div>

              {/* Professional */}
              <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: appointment.professional.color }} />
                <span>{appointment.professional.name}</span>
              </div>

              {/* Notes */}
              {appointment.notes && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{appointment.notes}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs bg-transparent">
                  Agendar
                </Button>
                <Button size="sm" variant="ghost" className="text-xs">
                  Editar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
