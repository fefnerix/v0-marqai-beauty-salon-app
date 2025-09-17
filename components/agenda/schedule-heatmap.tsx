"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, TrendingUp, Clock, Users } from "lucide-react"
import { getScheduleHeatmapData } from "@/server/actions/agenda/analytics"
import { format, startOfWeek, addDays, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"

interface HeatmapData {
  date: string
  hour: number
  density: number
  appointments_count: number
  professionals_count: number
  revenue: number
}

interface ScheduleHeatmapProps {
  professionalId?: string
}

export function ScheduleHeatmap({ professionalId }: ScheduleHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([])
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [viewMode, setViewMode] = useState<"density" | "revenue" | "appointments">("density")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadHeatmapData()
  }, [selectedWeek, professionalId])

  const loadHeatmapData = async () => {
    try {
      const data = await getScheduleHeatmapData(selectedWeek, professionalId)
      setHeatmapData(data)
    } catch (error) {
      console.error("Erro ao carregar dados do heatmap:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getWeekDays = () => {
    const start = startOfWeek(selectedWeek, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }

  const getHourSlots = () => {
    return Array.from({ length: 12 }, (_, i) => i + 8) // 8h às 19h
  }

  const getIntensityColor = (value: number, maxValue: number) => {
    if (maxValue === 0) return "bg-muted"

    const intensity = value / maxValue

    if (intensity === 0) return "bg-muted"
    if (intensity <= 0.2) return "bg-blue-100"
    if (intensity <= 0.4) return "bg-blue-200"
    if (intensity <= 0.6) return "bg-blue-300"
    if (intensity <= 0.8) return "bg-blue-400"
    return "bg-blue-500"
  }

  const getValueForMode = (item: HeatmapData) => {
    switch (viewMode) {
      case "density":
        return item.density
      case "revenue":
        return item.revenue
      case "appointments":
        return item.appointments_count
      default:
        return item.density
    }
  }

  const getMaxValue = () => {
    return Math.max(...heatmapData.map(getValueForMode))
  }

  const getDataForSlot = (date: Date, hour: number) => {
    return heatmapData.find((item) => isSameDay(new Date(item.date), date) && item.hour === hour)
  }

  const getTotalStats = () => {
    return heatmapData.reduce(
      (acc, item) => ({
        totalAppointments: acc.totalAppointments + item.appointments_count,
        totalRevenue: acc.totalRevenue + item.revenue,
        avgDensity: acc.avgDensity + item.density,
      }),
      { totalAppointments: 0, totalRevenue: 0, avgDensity: 0 },
    )
  }

  const stats = getTotalStats()
  const avgDensity = heatmapData.length > 0 ? stats.avgDensity / heatmapData.length : 0

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
            className="bg-transparent"
          >
            ← Semana Anterior
          </Button>
          <h3 className="font-semibold">
            {format(startOfWeek(selectedWeek, { weekStartsOn: 1 }), "PPP", { locale: ptBR })}
          </h3>
          <Button
            variant="outline"
            onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
            className="bg-transparent"
          >
            Próxima Semana →
          </Button>
        </div>
        <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="density">Densidade de Ocupação</SelectItem>
            <SelectItem value="appointments">Número de Agendamentos</SelectItem>
            <SelectItem value="revenue">Receita</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Agendamentos</p>
                <p className="text-2xl font-bold">{stats.totalAppointments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold">R$ {stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Densidade Média</p>
                <p className="text-2xl font-bold">{(avgDensity * 100).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>
              Mapa de Calor -{" "}
              {viewMode === "density" ? "Densidade" : viewMode === "revenue" ? "Receita" : "Agendamentos"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center justify-between text-sm">
              <span>Baixa atividade</span>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-muted rounded"></div>
                <div className="w-3 h-3 bg-blue-100 rounded"></div>
                <div className="w-3 h-3 bg-blue-200 rounded"></div>
                <div className="w-3 h-3 bg-blue-300 rounded"></div>
                <div className="w-3 h-3 bg-blue-400 rounded"></div>
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
              </div>
              <span>Alta atividade</span>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Header with days */}
                <div className="grid grid-cols-8 gap-1 mb-2">
                  <div className="text-sm font-medium text-center py-2">Horário</div>
                  {getWeekDays().map((day) => (
                    <div key={day.toISOString()} className="text-sm font-medium text-center py-2">
                      <div>{format(day, "EEE", { locale: ptBR })}</div>
                      <div className="text-xs text-muted-foreground">{format(day, "dd/MM")}</div>
                    </div>
                  ))}
                </div>

                {/* Heatmap rows */}
                {getHourSlots().map((hour) => (
                  <div key={hour} className="grid grid-cols-8 gap-1 mb-1">
                    <div className="text-sm text-center py-3 font-medium">{hour}:00</div>
                    {getWeekDays().map((day) => {
                      const data = getDataForSlot(day, hour)
                      const value = data ? getValueForMode(data) : 0
                      const maxValue = getMaxValue()

                      return (
                        <div
                          key={`${day.toISOString()}-${hour}`}
                          className={`h-12 rounded cursor-pointer transition-all hover:scale-105 flex items-center justify-center ${getIntensityColor(value, maxValue)}`}
                          title={`${format(day, "PPP", { locale: ptBR })} ${hour}:00\n${
                            viewMode === "density"
                              ? `Densidade: ${(value * 100).toFixed(1)}%`
                              : viewMode === "revenue"
                                ? `Receita: R$ ${value.toLocaleString()}`
                                : `Agendamentos: ${value}`
                          }`}
                        >
                          {value > 0 && (
                            <span className="text-xs font-medium text-white">
                              {viewMode === "density"
                                ? `${(value * 100).toFixed(0)}%`
                                : viewMode === "revenue"
                                  ? `R$${Math.round(value)}`
                                  : value}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
