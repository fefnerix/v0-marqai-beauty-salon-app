"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Phone, Send, X, Plus } from "lucide-react"
import {
  getClientSuggestions,
  createSuggestionAppointment,
  dismissSuggestion,
  getClients,
  createClient,
} from "@/server/actions/agenda/client-suggestions"
import { getServices } from "@/server/actions/agenda/services"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ClientSuggestion {
  client_id: string
  client_name: string
  client_phone: string
  confidence_score: number
  suggestion_reason: string
}

interface Client {
  id: string
  name: string
  phone: string
  email?: string
  total_appointments: number
  total_spent: number
  last_appointment_date?: string
  status: string
}

interface Service {
  id: string
  name: string
  duration: number
  price: number
}

interface ClientSuggestionsPanelProps {
  professionalId: string
  professionalName: string
  timeSlot: {
    start: Date
    end: Date
  }
  onAppointmentCreated: () => void
}

export function ClientSuggestionsPanel({
  professionalId,
  professionalName,
  timeSlot,
  onAppointmentCreated,
}: ClientSuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<ClientSuggestion[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<string>("")
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false)
  const [newClientData, setNewClientData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  })

  useEffect(() => {
    loadData()
  }, [professionalId, timeSlot])

  const loadData = async () => {
    try {
      const [suggestionsData, clientsData, servicesData] = await Promise.all([
        getClientSuggestions(professionalId, timeSlot.start, timeSlot.end),
        getClients(),
        getServices(),
      ])
      setSuggestions(suggestionsData)
      setClients(clientsData)
      setServices(servicesData)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAppointment = async (suggestion: ClientSuggestion) => {
    if (!selectedService) return

    try {
      await createSuggestionAppointment({
        client_id: suggestion.client_id,
        professional_id: professionalId,
        service_id: selectedService,
        start_time: timeSlot.start,
        client_name: suggestion.client_name,
        client_phone: suggestion.client_phone,
      })
      onAppointmentCreated()
    } catch (error) {
      console.error("Erro ao criar agendamento:", error)
    }
  }

  const handleDismissSuggestion = async (clientId: string) => {
    try {
      await dismissSuggestion(clientId, professionalId, timeSlot.start)
      setSuggestions((prev) => prev.filter((s) => s.client_id !== clientId))
    } catch (error) {
      console.error("Erro ao dispensar sugestão:", error)
    }
  }

  const handleCreateClient = async () => {
    try {
      await createClient(newClientData)
      setIsCreateClientOpen(false)
      setNewClientData({ name: "", phone: "", email: "", notes: "" })
      await loadData()
    } catch (error) {
      console.error("Erro ao criar cliente:", error)
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "bg-green-100 text-green-800"
    if (score >= 0.6) return "bg-blue-100 text-blue-800"
    if (score >= 0.4) return "bg-yellow-100 text-yellow-800"
    return "bg-gray-100 text-gray-800"
  }

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return "Alta"
    if (score >= 0.6) return "Média"
    if (score >= 0.4) return "Baixa"
    return "Muito Baixa"
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Sugestões de Clientes</span>
            </CardTitle>
            <Dialog open={isCreateClientOpen} onOpenChange={setIsCreateClientOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-transparent">
                  <Plus className="h-4 w-4 mr-1" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Cliente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={newClientData.name}
                      onChange={(e) => setNewClientData((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={newClientData.phone}
                      onChange={(e) => setNewClientData((prev) => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newClientData.email}
                      onChange={(e) => setNewClientData((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={newClientData.notes}
                      onChange={(e) => setNewClientData((prev) => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateClientOpen(false)} className="bg-transparent">
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateClient}>Criar Cliente</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-muted-foreground">
            {professionalName} • {format(timeSlot.start, "PPP 'às' HH:mm", { locale: ptBR })}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Service Selection */}
          <div className="space-y-2">
            <Label>Serviço para o agendamento</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} - {service.duration}min - R$ {service.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Suggestions */}
          {suggestions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma sugestão de cliente para este horário.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Considere criar um novo cliente ou verificar a lista de espera.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-medium">Clientes Sugeridos ({suggestions.length})</h4>
              {suggestions.map((suggestion) => {
                const client = clients.find((c) => c.id === suggestion.client_id)
                return (
                  <Card key={suggestion.client_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {suggestion.client_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h5 className="font-medium">{suggestion.client_name}</h5>
                              <Badge className={getConfidenceColor(suggestion.confidence_score)}>
                                {getConfidenceLabel(suggestion.confidence_score)}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>{suggestion.client_phone}</span>
                              </span>
                              {client && (
                                <>
                                  <span>{client.total_appointments} agendamentos</span>
                                  <span>R$ {client.total_spent.toLocaleString()}</span>
                                </>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{suggestion.suggestion_reason}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDismissSuggestion(suggestion.client_id)}
                            className="bg-transparent"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleCreateAppointment(suggestion)}
                            disabled={!selectedService}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Agendar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Recent Clients */}
          <div className="space-y-3">
            <h4 className="font-medium">Clientes Recentes</h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {clients
                .filter((client) => !suggestions.some((s) => s.client_id === client.id))
                .slice(0, 5)
                .map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {client.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.phone}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCreateAppointment({
                          client_id: client.id,
                          client_name: client.name,
                          client_phone: client.phone,
                          confidence_score: 0.5,
                          suggestion_reason: "Cliente selecionado manualmente",
                        })
                      }
                      disabled={!selectedService}
                      className="bg-transparent"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Agendar
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
