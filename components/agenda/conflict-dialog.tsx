"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { AppointmentWithDetails } from "@/server/actions/agenda/appointments"

interface ConflictDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conflictingAppointment: AppointmentWithDetails | null
  draggedAppointment: AppointmentWithDetails | null
  allowOverbooking: boolean
  onConfirm: (allowOverbook: boolean) => void
}

export function ConflictDialog({
  open,
  onOpenChange,
  conflictingAppointment,
  draggedAppointment,
  allowOverbooking,
  onConfirm,
}: ConflictDialogProps) {
  if (!conflictingAppointment || !draggedAppointment) return null

  const formatTime = (dateTime: string) => format(parseISO(dateTime), "HH:mm", { locale: ptBR })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Conflito de Horário Detectado</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>Já existe um agendamento neste horário. Verifique os detalhes abaixo:</p>

              {/* Existing Appointment */}
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Agendamento Existente:</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Cliente:</strong> {conflictingAppointment.client?.name}
                  </p>
                  <p>
                    <strong>Profissional:</strong> {conflictingAppointment.professional.name}
                  </p>
                  {conflictingAppointment.start_at && (
                    <p>
                      <strong>Horário:</strong> {formatTime(conflictingAppointment.start_at)}
                    </p>
                  )}
                  <div className="flex gap-1 mt-2">
                    {conflictingAppointment.services.map((service) => (
                      <Badge key={service.id} variant="outline" className="text-xs">
                        {service.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dragged Appointment */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Agendamento a Mover:</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Cliente:</strong> {draggedAppointment.client?.name}
                  </p>
                  <p>
                    <strong>Profissional:</strong> {draggedAppointment.professional.name}
                  </p>
                  <div className="flex gap-1 mt-2">
                    {draggedAppointment.services.map((service) => (
                      <Badge key={service.id} variant="outline" className="text-xs">
                        {service.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {allowOverbooking && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Overbooking permitido:</strong> Você pode forçar este agendamento mesmo com conflito.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          {allowOverbooking && (
            <AlertDialogAction onClick={() => onConfirm(true)} className="bg-yellow-600 hover:bg-yellow-700">
              Forçar Overbooking
            </AlertDialogAction>
          )}
          <AlertDialogAction onClick={() => onConfirm(false)} variant="destructive">
            Substituir Agendamento
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
