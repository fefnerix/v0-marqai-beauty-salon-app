import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Users, DollarSign, TrendingUp, Clock, Star, Plus } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu salão de beleza</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 desde ontem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">248</div>
            <p className="text-xs text-muted-foreground">+12% este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 1.240</div>
            <p className="text-xs text-muted-foreground">+8% desde ontem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">+5% esta semana</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Próximos Agendamentos */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
            <CardDescription>Agendamentos para as próximas horas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                time: "09:00",
                client: "Maria Silva",
                service: "Corte + Escova",
                professional: "Ana Costa",
                status: "confirmado",
              },
              {
                time: "10:30",
                client: "João Santos",
                service: "Barba",
                professional: "Carlos Lima",
                status: "pendente",
              },
              {
                time: "11:00",
                client: "Lucia Oliveira",
                service: "Manicure",
                professional: "Beatriz Souza",
                status: "confirmado",
              },
              {
                time: "14:00",
                client: "Pedro Costa",
                service: "Corte Masculino",
                professional: "Carlos Lima",
                status: "confirmado",
              },
            ].map((appointment, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 rounded-lg border">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{appointment.time}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{appointment.client}</p>
                  <p className="text-sm text-muted-foreground">{appointment.service}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{appointment.professional}</p>
                  <Badge variant={appointment.status === "confirmado" ? "default" : "secondary"}>
                    {appointment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Profissionais em Atividade */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Profissionais</CardTitle>
            <CardDescription>Status atual da equipe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                name: "Ana Costa",
                status: "Ocupada",
                nextFree: "11:30",
                rating: 4.9,
              },
              {
                name: "Carlos Lima",
                status: "Disponível",
                nextFree: "Agora",
                rating: 4.8,
              },
              {
                name: "Beatriz Souza",
                status: "Ocupada",
                nextFree: "12:00",
                rating: 4.7,
              },
            ].map((professional, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={`/abstract-geometric-shapes.png?height=40&width=40&query=${professional.name} avatar`}
                  />
                  <AvatarFallback>
                    {professional.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{professional.name}</p>
                  <div className="flex items-center space-x-2">
                    <Badge variant={professional.status === "Disponível" ? "default" : "secondary"}>
                      {professional.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Livre às {professional.nextFree}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{professional.rating}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
