"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Clock, DollarSign, Edit, Trash2, TrendingUp } from "lucide-react"

const mockServices = [
  {
    id: 1,
    nome: "Corte + Escova",
    descricao: "Corte de cabelo feminino com escova modeladora",
    preco: 85.0,
    duracao_minutos: 90,
    comissao_percentual: 40,
    ativo: true,
    categoria: "Cabelo",
    agendamentosUltimos30Dias: 45,
    receitaUltimos30Dias: 3825.0,
  },
  {
    id: 2,
    nome: "Corte Masculino",
    descricao: "Corte de cabelo masculino tradicional",
    preco: 35.0,
    duracao_minutos: 30,
    comissao_percentual: 45,
    ativo: true,
    categoria: "Cabelo",
    agendamentosUltimos30Dias: 62,
    receitaUltimos30Dias: 2170.0,
  },
  {
    id: 3,
    nome: "Barba",
    descricao: "Aparar e modelar barba",
    preco: 25.0,
    duracao_minutos: 20,
    comissao_percentual: 50,
    ativo: true,
    categoria: "Barba",
    agendamentosUltimos30Dias: 38,
    receitaUltimos30Dias: 950.0,
  },
  {
    id: 4,
    nome: "Manicure",
    descricao: "Cuidados completos para as unhas das mãos",
    preco: 30.0,
    duracao_minutos: 45,
    comissao_percentual: 35,
    ativo: true,
    categoria: "Unhas",
    agendamentosUltimos30Dias: 52,
    receitaUltimos30Dias: 1560.0,
  },
  {
    id: 5,
    nome: "Pedicure",
    descricao: "Cuidados completos para as unhas dos pés",
    preco: 35.0,
    duracao_minutos: 60,
    comissao_percentual: 35,
    ativo: true,
    categoria: "Unhas",
    agendamentosUltimos30Dias: 34,
    receitaUltimos30Dias: 1190.0,
  },
  {
    id: 6,
    nome: "Coloração",
    descricao: "Coloração completa do cabelo",
    preco: 120.0,
    duracao_minutos: 120,
    comissao_percentual: 30,
    ativo: true,
    categoria: "Cabelo",
    agendamentosUltimos30Dias: 18,
    receitaUltimos30Dias: 2160.0,
  },
  {
    id: 7,
    nome: "Luzes",
    descricao: "Mechas e luzes no cabelo",
    preco: 150.0,
    duracao_minutos: 150,
    comissao_percentual: 25,
    ativo: false,
    categoria: "Cabelo",
    agendamentosUltimos30Dias: 0,
    receitaUltimos30Dias: 0,
  },
]

const categorias = ["Todos", "Cabelo", "Barba", "Unhas", "Tratamentos"]

export default function ServicosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false)

  const filteredServices = mockServices.filter((service) => {
    const matchesSearch =
      service.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "Todos" || service.categoria === selectedCategory
    return matchesSearch && matchesCategory
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ""}`
    }
    return `${mins}min`
  }

  const totalRevenue = mockServices.reduce((sum, service) => sum + service.receitaUltimos30Dias, 0)
  const totalAppointments = mockServices.reduce((sum, service) => sum + service.agendamentosUltimos30Dias, 0)
  const averageTicket = totalRevenue / totalAppointments || 0

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 border-r bg-background">
        <Sidebar />
      </aside>

      <div className="flex-1 md:ml-64">
        <Header />

        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
                <p className="text-muted-foreground">Gerencie os serviços oferecidos pelo seu salão</p>
              </div>
              <Dialog open={isNewServiceOpen} onOpenChange={setIsNewServiceOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Serviço
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Novo Serviço</DialogTitle>
                    <DialogDescription>Cadastre um novo serviço no sistema</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="nome">Nome do Serviço</Label>
                        <Input id="nome" placeholder="Ex: Corte + Escova" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="categoria">Categoria</Label>
                        <Input id="categoria" placeholder="Ex: Cabelo, Unhas, Barba" />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="descricao">Descrição</Label>
                      <Textarea id="descricao" placeholder="Descrição detalhada do serviço..." />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="preco">Preço (R$)</Label>
                        <Input id="preco" type="number" step="0.01" placeholder="0,00" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="duracao">Duração (min)</Label>
                        <Input id="duracao" type="number" placeholder="60" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="comissao">Comissão (%)</Label>
                        <Input id="comissao" type="number" placeholder="40" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="ativo" defaultChecked />
                      <Label htmlFor="ativo">Serviço ativo</Label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsNewServiceOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => setIsNewServiceOpen(false)}>Cadastrar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockServices.length}</div>
                  <p className="text-xs text-muted-foreground">{mockServices.filter((s) => s.ativo).length} ativos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita (30 dias)</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">+12% vs mês anterior</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalAppointments}</div>
                  <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(averageTicket)}</div>
                  <p className="text-xs text-muted-foreground">Por agendamento</p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar serviços..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="flex space-x-2">
                    {categorias.map((categoria) => (
                      <Button
                        key={categoria}
                        variant={selectedCategory === categoria ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(categoria)}
                      >
                        {categoria}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Services Table */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Serviços</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Comissão</TableHead>
                      <TableHead>Performance (30d)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{service.nome}</p>
                            <p className="text-sm text-muted-foreground">{service.descricao}</p>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {service.categoria}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{formatCurrency(service.preco)}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{formatDuration(service.duracao_minutos)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{service.comissao_percentual}%</p>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{formatCurrency(service.receitaUltimos30Dias)}</p>
                            <p className="text-xs text-muted-foreground">
                              {service.agendamentosUltimos30Dias} agendamentos
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={service.ativo ? "default" : "secondary"}>
                            {service.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
