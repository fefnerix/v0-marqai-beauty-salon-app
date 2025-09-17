"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock, User, Phone, MoreVertical, Check, X, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { setAppointmentStatus, deleteAppointment } from "@/server/actions/agenda/appointments"
import { generateWhatsAppMessage } from "@/lib/utils/agenda"
import type { AppointmentWithDetails } from "@/server/actions/agenda/appointments"

interface AppointmentCardProps {
  appointment: AppointmentWithDetails
  onUpdate: () => void
  className?: string
}

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
  done: "bg-green-100 text-green-800 border-green-200",
  no_show: "bg-red-100 text-red-800 border-red-200",
  canceled: "bg-gray-100 text-gray-800 border-gray-200",
}

const statusLabels = {
  scheduled: "Agendado",
  in_progress: "Em Andamento",
  done: "Concluído",
  no_show: "Faltou",
  canceled: "Cancelado",
}

export function AppointmentCard({ appointment, onUpdate, className }: AppointmentCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (status: AppointmentWithDetails["status"]) => {
    setIsUpdating(true)
    try {
      const result = await setAppointmentStatus(appointment.id, status)
      if (result.success) {
        onUpdate()
      }
    } catch (error) {
      console.error("Error updating status:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    setIsUpdating(true)
    try {
      const result = await deleteAppointment(appointment.id)
      if (result.success) {
        onUpdate()
      }
    } catch (error) {
      console.error("Error deleting appointment:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleWhatsApp = () => {
    if (!appointment.client || !appointment.start_at) return

    const serviceName = appointment.services.map((s) => s.name).join(" + ")
    const message = generateWhatsAppMessage(
      appointment.client.name,
      serviceName,
      appointment.start_at,
      appointment.professional.name,
    )

    window.open(`https://wa.me/?text=${message}`, "_blank")
  }

  const totalDuration = appointment.services.reduce((total, service) => total + service.duration_minutes, 0)

  return (
    <Card className={cn("p-3 transition-all hover:shadow-md", statusColors[appointment.status], className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Client Info */}
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium truncate">{appointment.client?.name || "Cliente não informado"}</span>
            {appointment.client?.phone && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleWhatsApp}>
                <Phone className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Services */}
          <div className="mb-2">
            {appointment.services.map((service, index) => (
              <Badge key={service.id} variant="outline" className="mr-1 mb-1 text-xs">
                {service.name}
              </Badge>
            ))}
          </div>

          {/* Time and Duration */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {appointment.start_at && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{format(parseISO(appointment.start_at), "HH:mm", { locale: ptBR })}</span>
              </div>
            )}
            <span>{totalDuration}min</span>
            {appointment.overbooked && <Badge variant="destructive">Overbooking</Badge>}
          </div>

          {/* Notes */}
          {appointment.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{appointment.notes}</p>}
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={isUpdating}>
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleStatusChange("done")}>
              <Check className="mr-2 h-4 w-4" />
              Concluído
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("no_show")}>
              <X className="mr-2 h-4 w-4" />
              Faltou
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("in_progress")}>
              <Clock className="mr-2 h-4 w-4" />
              Em Andamento
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleStatusChange("canceled")}>
              <Calendar className="mr-2 h-4 w-4" />
              Reagendar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}
