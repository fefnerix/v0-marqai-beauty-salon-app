"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Clock, Star, TrendingUp, Phone, Mail, MapPin, Edit } from "lucide-react"
import { ProfessionalScheduleSettings } from "@/components/agenda/professional-schedule-settings"
import { ProfessionalAbsenceDialog } from "@/components/agenda/professional-absence-dialog"
import { ProductivityAnalytics } from "@/components/agenda/productivity-analytics"
import { getProfessionalById, getProfessionalAppointments } from "@/server/actions/agenda/professionals"
import { ProfessionalForm } from "@/components/agenda/professional-form"

interface Professional {
  id: string
  name: string
  email: string
  phone: string
  specialties: string[]
  avatar_url?: string
  is_active: boolean
  rating: number
  total_appointments: number
  total_revenue: number
  working_hours_per_week: number
  bio?: string
  address?: string
}

interface Appointment {
  id: string
  client_name: string
  service_name: string
  start_time: string
  end_time: string
  status: string
  price: number
}

export default function ProfessionalDetailPage() {
  const params = useParams()
  const professionalId = params.id as string

  const [professional, setProfessional] = useState<Professional | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    if (professionalId) {
      loadProfessionalData()
    }
  }, [professionalId])

  const loadProfessionalData = async () => {
    try {
      const [professionalData, appointmentsData] = await Promise.all([
        getProfessionalById(professionalId),
        getProfessionalAppointments(professionalId),
      ])
      setProfessional(professionalData)
      setAppointments(appointmentsData)
    } catch (error) {
      console.error("Erro ao carregar dados do profissional:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!professional) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Profissional não encontrado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={professional.avatar_url || "/placeholder.svg"} />
            <AvatarFallback className="text-2xl">
              {professional.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{professional.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-lg font-medium">{professional.rating.toFixed(1)}</span>
              <Badge variant={professional.is_active ? "default" : "secondary"} className="ml-2">
                {professional.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {professional.specialties.map((specialty, index) => (
                <Badge key={index} variant="outline">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Profissional</DialogTitle>
              </DialogHeader>
              <ProfessionalForm
                professional={professional}
                onSubmit={async (data) => {
                  // Handle update
                  setIsEditDialogOpen(false)
                  await loadProfessionalData()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Agendamentos</p>
                <p className="text-2xl font-bold">{professional.total_appointments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold">R$ {professional.total_revenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Horas/Semana</p>
                <p className="text-2xl font-bold">{professional.working_hours_per_week}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avaliação</p>
                <p className="text-2xl font-bold">{professional.rating.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule">Horários</TabsTrigger>
          <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Configuração de Horários</h3>
            <ProfessionalAbsenceDialog professionalId={professional.id} />
          </div>
          <ProfessionalScheduleSettings professionalId={professional.id} />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <h3 className="text-lg font-semibold">Próximos Agendamentos</h3>
          <div className="space-y-2">
            {appointments.slice(0, 10).map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{appointment.client_name}</p>
                      <p className="text-sm text-muted-foreground">{appointment.service_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(appointment.start_time).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <h3 className="text-lg font-semibold">Analytics de Produtividade</h3>
          <ProductivityAnalytics professionalId={professional.id} />
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span>{professional.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span>{professional.phone}</span>
              </div>
              {professional.address && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span>{professional.address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {professional.bio && (
            <Card>
              <CardHeader>
                <CardTitle>Biografia</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{professional.bio}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
