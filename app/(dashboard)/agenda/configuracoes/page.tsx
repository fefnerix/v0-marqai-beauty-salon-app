"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductivityAnalytics } from "@/components/agenda/productivity-analytics"
import { ProfessionalScheduleSettings } from "@/components/agenda/professional-schedule-settings"
import { ProfessionalAbsenceDialog } from "@/components/agenda/professional-absence-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, BarChart3, Calendar, UserX, Clock } from "lucide-react"
import { getProfessionals, getProfessionalAbsences } from "@/server/actions/agenda/professionals"

interface Professional {
  id: string
  name: string
  avatar_url?: string
  email: string
  phone?: string
  specialties: string[]
  is_active: boolean
}

interface Absence {
  id: string
  professional_id: string
  start_date: string
  end_date: string
  start_time?: string
  end_time?: string
  type: "vacation" | "sick" | "personal" | "training"
  reason?: string
  created_at: string
}

export default function AgendaConfiguracoesPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [absences, setAbsences] = useState<Absence[]>([])
  const [selectedProfessional, setSelectedProfessional] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [profResult, absenceResult] = await Promise.all([getProfessionals(), getProfessionalAbsences()])

      if (profResult.success) {
        setProfessionals(profResult.data || [])
        if (profResult.data && profResult.data.length > 0) {
          setSelectedProfessional(profResult.data[0].id)
        }
      }

      if (absenceResult.success) {
        setAbsences(absenceResult.data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const getAbsenceTypeLabel = (type: string) => {
    const labels = {
      vacation: "Férias",
      sick: "Atestado",
      personal: "Pessoal",
      training: "Treinamento",
    }
    return labels[type as keyof typeof labels] || type
  }

  const getAbsenceTypeColor = (type: string) => {
    const colors = {
      vacation: "bg-blue-100 text-blue-800",
      sick: "bg-red-100 text-red-800",
      personal: "bg-yellow-100 text-yellow-800",
      training: "bg-green-100 text-green-800",
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Configurações da Agenda</h1>
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-muted animate-pulse rounded" />
          <div className="h-96 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configurações da Agenda</h1>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horários
          </TabsTrigger>
          <TabsTrigger value="absences" className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            Ausências
          </TabsTrigger>
          <TabsTrigger value="professionals" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Profissionais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <ProductivityAnalytics professionals={professionals} />
        </TabsContent>

        <TabsContent value="schedules">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Horários de Trabalho</h3>
              <div className="flex gap-2">
                {professionals.map((prof) => (
                  <Button
                    key={prof.id}
                    variant={selectedProfessional === prof.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedProfessional(prof.id)}
                  >
                    {prof.name}
                  </Button>
                ))}
              </div>
            </div>

            {selectedProfessional && (
              <ProfessionalScheduleSettings
                professionalId={selectedProfessional}
                professionalName={professionals.find((p) => p.id === selectedProfessional)?.name || ""}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="absences">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Ausências Registradas</h3>
              <div className="flex gap-2">
                {professionals.map((prof) => (
                  <ProfessionalAbsenceDialog
                    key={prof.id}
                    professionalId={prof.id}
                    professionalName={prof.name}
                    trigger={
                      <Button variant="outline" size="sm">
                        <UserX className="h-4 w-4 mr-2" />
                        {prof.name}
                      </Button>
                    }
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {absences.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhuma ausência registrada</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                absences.map((absence) => {
                  const professional = professionals.find((p) => p.id === absence.professional_id)
                  return (
                    <Card key={absence.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{professional?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(absence.start_date).toLocaleDateString("pt-BR")} -{" "}
                                {new Date(absence.end_date).toLocaleDateString("pt-BR")}
                                {absence.start_time && absence.end_time && (
                                  <span>
                                    {" "}
                                    ({absence.start_time} - {absence.end_time})
                                  </span>
                                )}
                              </p>
                              {absence.reason && <p className="text-sm text-muted-foreground mt-1">{absence.reason}</p>}
                            </div>
                          </div>
                          <Badge className={getAbsenceTypeColor(absence.type)}>
                            {getAbsenceTypeLabel(absence.type)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="professionals">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Profissionais Ativos</h3>
            <div className="grid gap-4">
              {professionals.map((professional) => (
                <Card key={professional.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {professional.avatar_url && (
                          <img
                            src={professional.avatar_url || "/placeholder.svg"}
                            alt={professional.name}
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                        <div>
                          <p className="font-medium">{professional.name}</p>
                          <p className="text-sm text-muted-foreground">{professional.email}</p>
                          {professional.phone && <p className="text-sm text-muted-foreground">{professional.phone}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {professional.specialties.map((specialty) => (
                          <Badge key={specialty} variant="outline">
                            {specialty}
                          </Badge>
                        ))}
                        <Badge variant={professional.is_active ? "default" : "secondary"}>
                          {professional.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
