"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Calendar, CalendarRange, CalendarX } from "lucide-react"
import { useState } from "react"

interface RecurringOptionsDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (option: "this_only" | "this_and_future" | "all") => void
  action: "edit" | "delete"
  appointmentInfo: {
    client_name: string
    service_name: string
    date: string
  }
}

export function RecurringOptionsDialog({
  isOpen,
  onClose,
  onConfirm,
  action,
  appointmentInfo,
}: RecurringOptionsDialogProps) {
  const [selectedOption, setSelectedOption] = useState<"this_only" | "this_and_future" | "all">("this_only")

  const handleConfirm = () => {
    onConfirm(selectedOption)
    onClose()
  }

  const actionText = action === "edit" ? "editar" : "excluir"
  const actionTitle = action === "edit" ? "Editar" : "Excluir"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{actionTitle} Agendamento Recorrente</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Appointment Info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-1">
            <p className="font-medium">{appointmentInfo.client_name}</p>
            <p className="text-sm text-muted-foreground">{appointmentInfo.service_name}</p>
            <p className="text-sm text-muted-foreground">{appointmentInfo.date}</p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Este agendamento faz parte de uma série recorrente. O que você gostaria de {actionText}?
            </p>

            <RadioGroup value={selectedOption} onValueChange={(value: any) => setSelectedOption(value)}>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                <RadioGroupItem value="this_only" id="this_only" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="this_only" className="flex items-center space-x-2 cursor-pointer">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Apenas este agendamento</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {actionTitle} somente este agendamento específico
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                <RadioGroupItem value="this_and_future" id="this_and_future" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="this_and_future" className="flex items-center space-x-2 cursor-pointer">
                    <CalendarRange className="h-4 w-4" />
                    <span className="font-medium">Este e futuros agendamentos</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {actionTitle} este agendamento e todos os próximos da série
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                <RadioGroupItem value="all" id="all" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="all" className="flex items-center space-x-2 cursor-pointer">
                    <CalendarX className="h-4 w-4" />
                    <span className="font-medium">Toda a série</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {actionTitle} todos os agendamentos desta série recorrente
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1"
              variant={action === "delete" ? "destructive" : "default"}
            >
              {actionTitle}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
