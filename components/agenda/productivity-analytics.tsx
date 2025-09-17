"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, DollarSign, TrendingUp, Users } from "lucide-react"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { getProductivityAnalytics } from "@/server/actions/agenda/settings"

interface ProductivityData {
  professional: {
    id: string
    name: string
    avatar_url?: string
  }
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  noShowAppointments: number
  totalRevenue: number
  averageServiceTime: number
  utilizationRate: number
  clientSatisfaction: number
  repeatClientRate: number
}

interface ProductivityAnalyticsProps {
  professionals: Array<{ id: string; name: string; avatar_url?: string }>
}

export function ProductivityAnalytics({ professionals }: ProductivityAnalyticsProps) {
  const [period, setPeriod] = useState<"week" | "month">("week")
  const [selectedProfessional, setSelectedProfessional] = useState<string>("all")
  const [data, setData] = useState<ProductivityData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [period, selectedProfessional])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const startDate = period === "week" ? startOfWeek(now) : startOfMonth(now)
      const endDate = period === "week" ? endOfWeek(now) : endOfMonth(now)

      const result = await getProductivityAnalytics({
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        professionalId: selectedProfessional === "all" ? undefined : selectedProfessional,
      })

      if (result.success) {
        setData(result.data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}min`
  }

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return "text-green-600"
    if (rate >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getSatisfactionBadge = (score: number) => {
    if (score >= 4.5) return <Badge className="bg-green-100 text-green-800">Excelente</Badge>
    if (score >= 4.0) return <Badge className="bg-blue-100 text-blue-800">Muito Bom</Badge>
    if (score >= 3.5) return <Badge className="bg-yellow-100 text-yellow-800">Bom</Badge>
    return <Badge className="bg-red-100 text-red-800">Precisa Melhorar</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Analytics de Produtividade</h3>
          <div className="flex gap-2">
            <div className="w-32 h-10 bg-muted animate-pulse rounded" />
            <div className="w-40 h-10 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Analytics de Produtividade</h3>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Profissionais</SelectItem>
              {professionals.map((prof) => (
                <SelectItem key={prof.id} value={prof.id}>
                  {prof.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((item) => (
          <Card key={item.professional.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {item.professional.avatar_url && (
                  <img
                    src={item.professional.avatar_url || "/placeholder.svg"}
                    alt={item.professional.name}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                {item.professional.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{item.totalAppointments}</p>
                    <p className="text-muted-foreground">Agendamentos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{formatCurrency(item.totalRevenue)}</p>
                    <p className="text-muted-foreground">Faturamento</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Taxa de Utilização</span>
                  <span className={`font-medium ${getUtilizationColor(item.utilizationRate)}`}>
                    {item.utilizationRate.toFixed(1)}%
                  </span>
                </div>
                <Progress value={item.utilizationRate} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{formatTime(item.averageServiceTime)}</p>
                    <p className="text-muted-foreground">Tempo Médio</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{item.repeatClientRate.toFixed(1)}%</p>
                    <p className="text-muted-foreground">Clientes Fiéis</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Satisfação</span>
                {getSatisfactionBadge(item.clientSatisfaction)}
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <p className="font-medium text-green-600">{item.completedAppointments}</p>
                  <p className="text-muted-foreground">Concluídos</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-yellow-600">{item.cancelledAppointments}</p>
                  <p className="text-muted-foreground">Cancelados</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-red-600">{item.noShowAppointments}</p>
                  <p className="text-muted-foreground">Faltaram</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum dado encontrado para o período selecionado</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
