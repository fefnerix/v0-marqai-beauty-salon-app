"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CalendarIcon, Repeat } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface RecurringAppointmentDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (repetitionData: RepetitionData) => void
  appointmentData: {
    client_name: string
    service_name: string
    start_time: string
    professional_name: string
  }
}

interface RepetitionData {
  type: "weekly" | "biweekly" | "monthly"
  endType: "count" | "date"
  count?: number
  endDate?: Date
}

export function RecurringAppointmentDialog({
  isOpen,
  onClose,
  onConfirm,
  appointmentData,
}: RecurringAppointmentDialogProps) {
  const [repetitionType, setRepetitionType] = useState<"weekly" | "biweekly" | "monthly">("weekly")
  const [endType, setEndType] = useState<"count" | "date">("count")
  const [count, setCount] = useState(4)
  const [endDate, setEndDate] = useState<Date>()

  const handleConfirm = () => {
    const repetitionData: RepetitionData = {
      type: repetitionType,
      endType,
      ...(endType === "count" ? { count } : { endDate }),
    }
    onConfirm(repetitionData)
    onClose()
  }

  const getPreviewDates = () => {
    const startDate = new Date(appointmentData.start_time)
    const dates = [startDate]

    let intervalDays = 7
    if (repetitionType === "biweekly") intervalDays = 14
    if (repetitionType === "monthly") intervalDays = 30

    const maxCount = endType === "count" ? count : 10

    for (let i = 1; i < maxCount && dates.length < 5; i++) {
      const nextDate = new Date(startDate)
      nextDate.setDate(startDate.getDate() + intervalDays * i)

      if (endType === "date" && endDate && nextDate > endDate) break

      dates.push(nextDate)
    }

    return dates
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Repeat className="h-5 w-5" />
            <span>Agendamento Recorrente</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Appointment Summary */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="font-medium">{appointmentData.client_name}</p>
            <p className="text-sm text-muted-foreground">{appointmentData.service_name}</p>
            <p className="text-sm text-muted-foreground">
              {appointmentData.professional_name} •{" "}
              {format(new Date(appointmentData.start_time), "PPP", { locale: ptBR })}
            </p>
          </div>

          {/* Repetition Type */}
          <div className="space-y-3">
            <Label>Frequência</Label>
            <Select value={repetitionType} onValueChange={(value: any) => setRepetitionType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="biweekly">Quinzenal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* End Type */}
          <div className="space-y-3">
            <Label>Terminar</Label>
            <RadioGroup value={endType} onValueChange={(value: any) => setEndType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="count" id="count" />
                <Label htmlFor="count" className="flex items-center space-x-2 flex-1">
                  <span>Após</span>
                  <Input
                    type="number"
                    min="2"
                    max="52"
                    value={count}
                    onChange={(e) => setCount(Number.parseInt(e.target.value) || 2)}
                    className="w-20"
                    disabled={endType !== "count"}
                  />
                  <span>agendamentos</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="date" id="date" />
                <Label htmlFor="date" className="flex items-center space-x-2 flex-1">
                  <span>Em</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={endType !== "date"}
                        className="justify-start text-left font-normal bg-transparent"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => date <= new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <Label>Próximos agendamentos</Label>
            <div className="bg-muted/30 p-3 rounded-lg space-y-1 max-h-32 overflow-y-auto">
              {getPreviewDates().map((date, index) => (
                <div key={index} className="text-sm flex items-center justify-between">
                  <span>{format(date, "PPP", { locale: ptBR })}</span>
                  <span className="text-muted-foreground">{format(new Date(appointmentData.start_time), "HH:mm")}</span>
                </div>
              ))}
              {(endType === "count" ? count : getPreviewDates().length) > 5 && (
                <div className="text-sm text-muted-foreground text-center pt-2">
                  ... e mais {(endType === "count" ? count : 10) - 5} agendamentos
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} className="flex-1">
              Criar Série
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
