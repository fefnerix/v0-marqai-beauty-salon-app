"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format, addMinutes } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createAppointment } from "@/server/actions/agenda/appointments"
import { getServices } from "@/server/actions/agenda/services"
import { cn } from "@/lib/utils"
import type { Professional } from "@/server/actions/agenda/professionals"
import type { Service } from "@/server/actions/agenda/services"

interface CreateAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  professionals: Professional[]
  selectedProfessional?: string
  selectedTimeSlot?: string
  selectedDate: Date
  onSuccess: () => void
}

export function CreateAppointmentDialog({
  open,
  onOpenChange,
  companyId,
  professionals,
  selectedProfessional,
  selectedTimeSlot,
  selectedDate,
  onSuccess,
}: CreateAppointmentDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [formData, setFormData] = useState({
    professionalId: selectedProfessional || "",
    clientName: "",
    clientPhone: "",
    timeSlot: selectedTimeSlot || "",
    serviceIds: [] as string[],
    notes: "",
    isWalkIn: false,
  })

  // Load services when dialog opens
  useEffect(() => {
    if (open) {
      loadServices()
      setFormData((prev) => ({
        ...prev,
        professionalId: selectedProfessional || "",
        timeSlot: selectedTimeSlot || "",
      }))
    }
  }, [open, selectedProfessional, selectedTimeSlot])

  const loadServices = async () => {
    try {
      const servicesData = await getServices(companyId)
      setServices(servicesData)
    } catch (error) {
      console.error("Error loading services:", error)
    }
  }

  const selectedServices = services.filter((service) => formData.serviceIds.includes(service.id))
  const totalDuration = selectedServices.reduce((total, service) => total + service.duration_minutes, 0)
  const totalWithBuffer = selectedServices.reduce(
    (total, service) => total + service.duration_minutes + service.buffer_after_minutes,
    0,
  )

  const calculateEndTime = () => {
    if (!formData.timeSlot || formData.isWalkIn) return null
    const [hours, minutes] = formData.timeSlot.split(":").map(Number)
    const startTime = new Date(selectedDate)
    startTime.setHours(hours, minutes, 0, 0)
    return addMinutes(startTime, totalWithBuffer)
  }

  const endTime = calculateEndTime()

  const handleServiceToggle = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.professionalId || formData.serviceIds.length === 0) return

    setIsLoading(true)
    try {
      let startAt: string | undefined
      if (!formData.isWalkIn && formData.timeSlot) {
        const [hours, minutes] = formData.timeSlot.split(":").map(Number)
        const startTime = new Date(selectedDate)
        startTime.setHours(hours, minutes, 0, 0)
        startAt = startTime.toISOString()
      }

      const result = await createAppointment({
        companyId,
        professionalId: formData.professionalId,
        startAt,
        serviceIds: formData.serviceIds,
        notes: formData.notes || undefined,
      })

      if (result.success) {
        onSuccess()
        setFormData({
          professionalId: "",
          clientName: "",
          clientPhone: "",
          timeSlot: "",
          serviceIds: [],
          notes: "",
          isWalkIn: false,
        })
      }
    } catch (error) {
      console.error("Error creating appointment:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>
            {formData.isWalkIn
              ? "Criar um encaixe sem horário específico"
              : `Agendar para ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {/* Walk-in Toggle */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="walkIn"
                  checked={formData.isWalkIn}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isWalkIn: checked as boolean, timeSlot: "" }))
                  }
                />
                <Label htmlFor="walkIn">Encaixe (sem horário específico)</Label>
              </div>

              {/* Professional Selection */}
              <div className="space-y-2">
                <Label htmlFor="professional">Profissional *</Label>
                <Select
                  value={formData.professionalId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, professionalId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((professional) => (
                      <SelectItem key={professional.id} value={professional.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: professional.color }} />
                          {professional.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time Selection */}
              {!formData.isWalkIn && (
                <div className="space-y-2">
                  <Label htmlFor="timeSlot">Horário *</Label>
                  <Input
                    id="timeSlot"
                    type="time"
                    value={formData.timeSlot}
                    onChange={(e) => setFormData((prev) => ({ ...prev, timeSlot: e.target.value }))}
                    required={!formData.isWalkIn}
                  />
                  {endTime && (
                    <p className="text-sm text-muted-foreground">
                      Término previsto: {format(endTime, "HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
              )}

              {/* Client Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nome do Cliente</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Digite o nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Telefone</Label>
                  <Input
                    id="clientPhone"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, clientPhone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              {/* Services Selection */}
              <div className="space-y-2">
                <Label>Serviços *</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {services.map((service) => (
                    <Card
                      key={service.id}
                      className={cn(
                        "p-3 cursor-pointer transition-colors hover:bg-muted",
                        formData.serviceIds.includes(service.id) && "bg-primary/10 border-primary",
                      )}
                      onClick={() => handleServiceToggle(service.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox checked={formData.serviceIds.includes(service.id)} readOnly />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{service.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {service.duration_minutes}min
                            {service.buffer_after_minutes > 0 && ` + ${service.buffer_after_minutes}min buffer`}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Selected Services Summary */}
                {selectedServices.length > 0 && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Serviços Selecionados:</span>
                      <Badge variant="secondary">
                        {totalDuration}min {totalWithBuffer > totalDuration && `(${totalWithBuffer}min total)`}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedServices.map((service) => (
                        <Badge key={service.id} variant="outline" className="text-xs">
                          {service.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observações adicionais..."
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.professionalId || formData.serviceIds.length === 0}>
              {isLoading ? "Criando..." : "Criar Agendamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
