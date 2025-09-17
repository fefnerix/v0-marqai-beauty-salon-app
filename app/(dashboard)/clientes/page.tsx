"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Phone, Mail, Calendar, TrendingUp, Users, Star } from "lucide-react"
import { getClients, getClientHistory, getSuggestionStats } from "@/server/actions/agenda/client-suggestions"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Client {
  id: string
  name: string
  phone: string
  email?: string
  total_appointments: number
  total_spent: number
  last_appointment_date?: string
  status: string
  average_interval_days?: number
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientHistory, setClientHistory] = useState<any[]>([])
  const [suggestionStats, setSuggestionStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [clientsData, statsData] = await Promise.all([getClients(), getSuggestionStats()])
      setClients(clientsData)
      setSuggestionStats(statsData)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadClientHistory = async (clientId: string) => {
    try {
      const history = await getClientHistory(clientId)
      setClientHistory(history)
    } catch (error) {
      console.error("Erro ao carregar histórico:", error)
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getClientStatusColor = (status: string) => {
    switch (status) {
      case "vip":
        return "bg-yellow-100 text-yellow-800"
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerencie sua base de clientes e histórico de agendamentos</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Cliente</DialogTitle>
            </DialogHeader>
            {/* Client form would go here */}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {suggestionStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Clientes</p>
                  <p className="text-2xl font-bold">{clients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Sugestões Aceitas</p>
                  <p className="text-2xl font-bold">{suggestionStats.accepted_suggestions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Aceitação</p>
                  <p className="text-2xl font-bold">{(suggestionStats.acceptance_rate * 100).toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Clientes VIP</p>
                  <p className="text-2xl font-bold">{clients.filter((c) => c.status === "vip").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {client.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{client.name}</h3>
                    <Badge className={getClientStatusColor(client.status)}>
                      {client.status === "vip" ? "VIP" : client.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{client.phone}</span>
                    </div>
                    {client.email && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{client.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Agendamentos</p>
                  <p className="font-semibold">{client.total_appointments}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Gasto</p>
                  <p className="font-semibold">R$ {client.total_spent.toLocaleString()}</p>
                </div>
              </div>

              {client.last_appointment_date && (
                <div className="mt-4 text-sm">
                  <p className="text-muted-foreground">Último agendamento</p>
                  <p className="font-medium">
                    {format(new Date(client.last_appointment_date), "PPP", { locale: ptBR })}
                  </p>
                </div>
              )}

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full mt-4 bg-transparent"
                    onClick={() => {
                      setSelectedClient(client)
                      loadClientHistory(client.id)
                    }}
                  >
                    Ver Detalhes
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{client.name}</DialogTitle>
                  </DialogHeader>
                  <Tabs defaultValue="info">
                    <TabsList>
                      <TabsTrigger value="info">Informações</TabsTrigger>
                      <TabsTrigger value="history">Histórico</TabsTrigger>
                    </TabsList>
                    <TabsContent value="info" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Telefone</p>
                          <p className="font-medium">{client.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{client.email || "Não informado"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total de Agendamentos</p>
                          <p className="font-medium">{client.total_appointments}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Gasto</p>
                          <p className="font-medium">R$ {client.total_spent.toLocaleString()}</p>
                        </div>
                        {client.average_interval_days && (
                          <div>
                            <p className="text-sm text-muted-foreground">Intervalo Médio</p>
                            <p className="font-medium">{client.average_interval_days} dias</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="history" className="space-y-4">
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {clientHistory.map((appointment) => (
                          <div key={appointment.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{appointment.service?.name}</p>
                                <p className="text-sm text-muted-foreground">{appointment.professional?.name}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  {format(new Date(appointment.start_time), "PPP", { locale: ptBR })}
                                </p>
                                <Badge variant="outline">{appointment.status}</Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchTerm ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado."}
          </p>
        </div>
      )}
    </div>
  )
}
