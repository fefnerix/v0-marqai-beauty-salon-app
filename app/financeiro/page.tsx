"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Banknote,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const mockTransactions = [
  {
    id: 1,
    data: "2024-03-15",
    cliente: "Maria Silva",
    servico: "Corte + Escova",
    profissional: "Ana Costa",
    valor: 85.0,
    comissao: 34.0,
    metodo_pagamento: "Cartão de Crédito",
    status: "Pago",
    tipo: "receita",
  },
  {
    id: 2,
    data: "2024-03-15",
    cliente: "João Santos",
    servico: "Barba",
    profissional: "Carlos Lima",
    valor: 25.0,
    comissao: 12.5,
    metodo_pagamento: "Dinheiro",
    status: "Pago",
    tipo: "receita",
  },
  {
    id: 3,
    data: "2024-03-14",
    descricao: "Produtos de limpeza",
    valor: 150.0,
    categoria: "Produtos",
    metodo_pagamento: "Cartão de Débito",
    status: "Pago",
    tipo: "despesa",
  },
  {
    id: 4,
    data: "2024-03-14",
    cliente: "Lucia Oliveira",
    servico: "Manicure",
    profissional: "Beatriz Souza",
    valor: 30.0,
    comissao: 10.5,
    metodo_pagamento: "PIX",
    status: "Pago",
    tipo: "receita",
  },
  {
    id: 5,
    data: "2024-03-13",
    descricao: "Aluguel do salão",
    valor: 2500.0,
    categoria: "Aluguel",
    metodo_pagamento: "Transferência",
    status: "Pago",
    tipo: "despesa",
  },
]

const mockMonthlyData = [
  { mes: "Jan", receita: 12500, despesas: 8200, lucro: 4300 },
  { mes: "Fev", receita: 13200, despesas: 8500, lucro: 4700 },
  { mes: "Mar", receita: 14800, despesas: 9100, lucro: 5700 },
]

export default function FinanceiroPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("mes")
  const [selectedDate, setSelectedDate] = useState(new Date())

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const totalReceitas = mockTransactions.filter((t) => t.tipo === "receita").reduce((sum, t) => sum + t.valor, 0)

  const totalDespesas = mockTransactions.filter((t) => t.tipo === "despesa").reduce((sum, t) => sum + t.valor, 0)

  const lucroLiquido = totalReceitas - totalDespesas

  const totalComissoes = mockTransactions
    .filter((t) => t.tipo === "receita" && t.comissao)
    .reduce((sum, t) => sum + (t.comissao || 0), 0)

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
                <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
                <p className="text-muted-foreground">Controle financeiro do seu salão</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </div>

            {/* Period Selector */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const newDate = new Date(selectedDate)
                        newDate.setMonth(newDate.getMonth() - 1)
                        setSelectedDate(newDate)
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-center">
                      <CardTitle className="text-lg">
                        {selectedDate.toLocaleDateString("pt-BR", {
                          month: "long",
                          year: "numeric",
                        })}
                      </CardTitle>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const newDate = new Date(selectedDate)
                        newDate.setMonth(newDate.getMonth() + 1)
                        setSelectedDate(newDate)
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dia">Dia</SelectItem>
                      <SelectItem value="semana">Semana</SelectItem>
                      <SelectItem value="mes">Mês</SelectItem>
                      <SelectItem value="ano">Ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
            </Card>

            {/* Financial Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalReceitas)}</div>
                  <p className="text-xs text-muted-foreground">+12% vs mês anterior</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDespesas)}</div>
                  <p className="text-xs text-muted-foreground">+5% vs mês anterior</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(lucroLiquido)}</div>
                  <p className="text-xs text-muted-foreground">+18% vs mês anterior</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comissões</CardTitle>
                  <CreditCard className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalComissoes)}</div>
                  <p className="text-xs text-muted-foreground">Profissionais</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for different views */}
            <Tabs defaultValue="transacoes" className="space-y-4">
              <TabsList>
                <TabsTrigger value="transacoes">Transações</TabsTrigger>
                <TabsTrigger value="receitas">Receitas</TabsTrigger>
                <TabsTrigger value="despesas">Despesas</TabsTrigger>
                <TabsTrigger value="comissoes">Comissões</TabsTrigger>
              </TabsList>

              <TabsContent value="transacoes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Todas as Transações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{formatDate(transaction.data)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                {transaction.tipo === "receita" ? (
                                  <>
                                    <p className="font-medium">{transaction.cliente}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {transaction.servico} - {transaction.profissional}
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <p className="font-medium">{transaction.descricao}</p>
                                    <p className="text-sm text-muted-foreground">{transaction.categoria}</p>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                {transaction.metodo_pagamento === "Dinheiro" ? (
                                  <Banknote className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                  <CreditCard className="h-3 w-3 text-muted-foreground" />
                                )}
                                <span className="text-sm">{transaction.metodo_pagamento}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`font-medium ${
                                  transaction.tipo === "receita" ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {transaction.tipo === "receita" ? "+" : "-"}
                                {formatCurrency(transaction.valor)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={transaction.status === "Pago" ? "default" : "secondary"}>
                                {transaction.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="receitas" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Receitas por Serviço</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Serviço</TableHead>
                          <TableHead>Profissional</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Comissão</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockTransactions
                          .filter((t) => t.tipo === "receita")
                          .map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>{formatDate(transaction.data)}</TableCell>
                              <TableCell>{transaction.cliente}</TableCell>
                              <TableCell>{transaction.servico}</TableCell>
                              <TableCell>{transaction.profissional}</TableCell>
                              <TableCell className="font-medium text-green-600">
                                {formatCurrency(transaction.valor)}
                              </TableCell>
                              <TableCell className="font-medium text-purple-600">
                                {formatCurrency(transaction.comissao || 0)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="despesas" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Despesas por Categoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockTransactions
                          .filter((t) => t.tipo === "despesa")
                          .map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>{formatDate(transaction.data)}</TableCell>
                              <TableCell>{transaction.descricao}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{transaction.categoria}</Badge>
                              </TableCell>
                              <TableCell>{transaction.metodo_pagamento}</TableCell>
                              <TableCell className="font-medium text-red-600">
                                {formatCurrency(transaction.valor)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comissoes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Comissões por Profissional</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {["Ana Costa", "Carlos Lima", "Beatriz Souza"].map((professional) => {
                        const profissionalTransactions = mockTransactions.filter(
                          (t) => t.tipo === "receita" && t.profissional === professional,
                        )
                        const totalComissao = profissionalTransactions.reduce((sum, t) => sum + (t.comissao || 0), 0)
                        const totalReceita = profissionalTransactions.reduce((sum, t) => sum + t.valor, 0)

                        return (
                          <div key={professional} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <p className="font-medium">{professional}</p>
                              <p className="text-sm text-muted-foreground">
                                {profissionalTransactions.length} serviços realizados
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-purple-600">{formatCurrency(totalComissao)}</p>
                              <p className="text-sm text-muted-foreground">
                                de {formatCurrency(totalReceita)} em receita
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
