"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Clock, Save, Settings } from "lucide-react"
import { getProfessionalSchedule, updateProfessionalSchedule } from "@/server/actions/agenda/professionals"
import { toast } from "sonner"

interface ScheduleDay {
  day: string
  dayName: string
  enabled: boolean
  startTime: string
  endTime: string
  breakStart?: string
  breakEnd?: string
}

interface ProfessionalScheduleSettingsProps {
  professionalId: string
  professionalName: string
}

export function ProfessionalScheduleSettings({ professionalId, professionalName }: ProfessionalScheduleSettingsProps) {
  const [schedule, setSchedule] = useState<ScheduleDay[]>([
    { day: "monday", dayName: "Segunda-feira", enabled: true, startTime: "08:00", endTime: "18:00" },
    { day: "tuesday", dayName: "Terça-feira", enabled: true, startTime: "08:00", endTime: "18:00" },
    { day: "wednesday", dayName: "Quarta-feira", enabled: true, startTime: "08:00", endTime: "18:00" },
    { day: "thursday", dayName: "Quinta-feira", enabled: true, startTime: "08:00", endTime: "18:00" },
    { day: "friday", dayName: "Sexta-feira", enabled: true, startTime: "08:00", endTime: "18:00" },
    { day: "saturday", dayName: "Sábado", enabled: true, startTime: "08:00", endTime: "16:00" },
    { day: "sunday", dayName: "Domingo", enabled: false, startTime: "08:00", endTime: "16:00" },
  ])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSchedule()
  }, [professionalId])

  const loadSchedule = async () => {
    setLoading(true)
    try {
      const result = await getProfessionalSchedule(professionalId)
      if (result.success && result.data) {
        setSchedule(result.data)
      }
    } catch (error) {
      console.error("Erro ao carregar horários:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleChange = (dayIndex: number, field: keyof ScheduleDay, value: any) => {
    setSchedule((prev) => prev.map((day, index) => (index === dayIndex ? { ...day, [field]: value } : day)))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await updateProfessionalSchedule(professionalId, schedule)
      if (result.success) {
        toast.success("Horários atualizados com sucesso")
      } else {
        toast.error(result.error || "Erro ao salvar horários")
      }
    } catch (error) {
      toast.error("Erro inesperado")
    } finally {
      setSaving(false)
    }
  }

  const getWorkingDaysCount = () => {
    return schedule.filter((day) => day.enabled).length
  }

  const getTotalWorkingHours = () => {
    return schedule.reduce((total, day) => {
      if (!day.enabled) return total

      const start = new Date(`2000-01-01T${day.startTime}:00`)
      const end = new Date(`2000-01-01T${day.endTime}:00`)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

      // Subtract break time if exists
      if (day.breakStart && day.breakEnd) {
        const breakStart = new Date(`2000-01-01T${day.breakStart}:00`)
        const breakEnd = new Date(`2000-01-01T${day.breakEnd}:00`)
        const breakHours = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60)
        return total + hours - breakHours
      }

      return total + hours
    }, 0)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Horários de Trabalho - {professionalName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Horários de Trabalho - {professionalName}
        </CardTitle>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{getWorkingDaysCount()} dias/semana</Badge>
            <Badge variant="outline">{getTotalWorkingHours().toFixed(1)}h semanais</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {schedule.map((day, index) => (
          <div key={day.day} className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="flex items-center space-x-2">
              <Switch
                checked={day.enabled}
                onCheckedChange={(checked) => handleScheduleChange(index, "enabled", checked)}
              />
              <Label className="w-24 font-medium">{day.dayName}</Label>
            </div>

            {day.enabled && (
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={day.startTime}
                    onChange={(e) => handleScheduleChange(index, "startTime", e.target.value)}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">às</span>
                  <Input
                    type="time"
                    value={day.endTime}
                    onChange={(e) => handleScheduleChange(index, "endTime", e.target.value)}
                    className="w-24"
                  />
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Intervalo:</span>
                  <Input
                    type="time"
                    value={day.breakStart || ""}
                    onChange={(e) => handleScheduleChange(index, "breakStart", e.target.value)}
                    className="w-20 text-xs"
                    placeholder="Início"
                  />
                  <span>-</span>
                  <Input
                    type="time"
                    value={day.breakEnd || ""}
                    onChange={(e) => handleScheduleChange(index, "breakEnd", e.target.value)}
                    className="w-20 text-xs"
                    placeholder="Fim"
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Horários"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
