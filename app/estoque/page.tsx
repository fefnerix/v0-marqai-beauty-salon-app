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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Package, AlertTriangle, TrendingDown, Edit, Trash2, Minus, RotateCcw } from "lucide-react"

const mockProducts = [
  {
    id: 1,
    nome: "Shampoo Profissional",
    categoria: "Cabelo",
    marca: "L'Oréal",
    quantidade_atual: 15,
    quantidade_minima: 5,
    preco_custo: 25.0,
    preco_venda: 45.0,
    fornecedor: "Distribuidora Beauty",
    data_validade: "2025-06-15",
    localizacao: "Prateleira A1",
    status: "disponivel",
  },
  {
    id: 2,
    nome: "Condicionador Hidratante",
    categoria: "Cabelo",
    marca: "Kerastase",
    quantidade_atual: 8,
    quantidade_minima: 10,
    preco_custo: 35.0,
    preco_venda: 65.0,
    fornecedor: "Distribuidora Beauty",
    data_validade: "2025-08-20",
    localizacao: "Prateleira A2",
    status: "baixo_estoque",
  },
  {
    id: 3,
    nome: "Esmalte Vermelho",
    categoria: "Unhas",
    marca: "Risqué",
    quantidade_atual: 25,
    quantidade_minima: 8,
    preco_custo: 8.0,
    preco_venda: 15.0,
    fornecedor: "Cosméticos Silva",
    data_validade: "2026-12-31",
    localizacao: "Gaveta B3",
    status: "disponivel",
  },
  {
    id: 4,
    nome: "Creme para Barbear",
    categoria: "Barba",
    marca: "Gillette",
    quantidade_atual: 2,
    quantidade_minima: 5,
    preco_custo: 12.0,
    preco_venda: 22.0,
    fornecedor: "Distribuidora Masculina",
    data_validade: "2025-03-30",
    localizacao: "Prateleira C1",
    status: "baixo_estoque",
  },
  {
    id: 5,
    nome: "Acetona",
    categoria: "Unhas",
    marca: "Impala",
    quantidade_atual: 0,
    quantidade_minima: 3,
    preco_custo: 6.0,
    preco_venda: 12.0,
    fornecedor: "Cosméticos Silva",
    data_validade: "2025-12-31",
    localizacao: "Gaveta B1",
    status: "sem_estoque",
  },
]

const mockMovements = [
  {
    id: 1,
    data: "2024-03-15",
    produto: "Shampoo Profissional",
    tipo: "saida",
    quantidade: 2,
    motivo: "Uso em serviço",
    usuario: "Ana Costa",
  },
  {
    id: 2,
    data: "2024-03-14",
    produto: "Condicionador Hidratante",
    tipo: "entrada",
    quantidade: 10,
    motivo: "Compra",
    usuario: "Administrador",
  },
  {
    id: 3,
    data: "2024-03-13",
    produto: "Esmalte Vermelho",
    tipo: "saida",
    quantidade: 1,
    motivo: "Uso em serviço",
    usuario: "Beatriz Souza",
  },
]

const categorias = ["Todos", "Cabelo", "Unhas", "Barba", "Limpeza", "Equipamentos"]

export default function EstoquePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [selectedStatus, setSelectedStatus] = useState("todos")
  const [isNewProductOpen, setIsNewProductOpen] = useState(false)
  const [isMovementOpen, setIsMovementOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch =
      product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.marca.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "Todos" || product.categoria === selectedCategory
    const matchesStatus = selectedStatus === "todos" || product.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "disponivel":
        return <Badge variant="default">Disponível</Badge>
      case "baixo_estoque":
        return <Badge variant="secondary">Baixo Estoque</Badge>
      case "sem_estoque":
        return <Badge variant="destructive">Sem Estoque</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  const totalProducts = mockProducts.length
  const lowStockProducts = mockProducts.filter((p) => p.status === "baixo_estoque").length
  const outOfStockProducts = mockProducts.filter((p) => p.status === "sem_estoque").length
  const totalValue = mockProducts.reduce((sum, p) => sum + p.quantidade_atual * p.preco_custo, 0)

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
                <h1 className="text-3xl font-bold tracking-tight">Estoque</h1>
                <p className="text-muted-foreground">Gerencie o inventário do seu salão</p>
              </div>
              <div className="flex items-center space-x-2">
                <Dialog open={isMovementOpen} onOpenChange={setIsMovementOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Movimentação
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Nova Movimentação</DialogTitle>
                      <DialogDescription>Registre entrada ou saída de produtos</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="produto">Produto</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockProducts.map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="tipo">Tipo</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="entrada">Entrada</SelectItem>
                              <SelectItem value="saida">Saída</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="quantidade">Quantidade</Label>
                          <Input id="quantidade" type="number" placeholder="0" />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="motivo">Motivo</Label>
                        <Textarea id="motivo" placeholder="Motivo da movimentação..." />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsMovementOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => setIsMovementOpen(false)}>Registrar</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isNewProductOpen} onOpenChange={setIsNewProductOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Produto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Novo Produto</DialogTitle>
                      <DialogDescription>Cadastre um novo produto no estoque</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="nome">Nome do Produto</Label>
                          <Input id="nome" placeholder="Ex: Shampoo Profissional" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="marca">Marca</Label>
                          <Input id="marca" placeholder="Ex: L'Oréal" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="categoria">Categoria</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cabelo">Cabelo</SelectItem>
                              <SelectItem value="unhas">Unhas</SelectItem>
                              <SelectItem value="barba">Barba</SelectItem>
                              <SelectItem value="limpeza">Limpeza</SelectItem>
                              <SelectItem value="equipamentos">Equipamentos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="fornecedor">Fornecedor</Label>
                          <Input id="fornecedor" placeholder="Nome do fornecedor" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="quantidade_atual">Quantidade</Label>
                          <Input id="quantidade_atual" type="number" placeholder="0" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="quantidade_minima">Estoque Mínimo</Label>
                          <Input id="quantidade_minima" type="number" placeholder="0" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="localizacao">Localização</Label>
                          <Input id="localizacao" placeholder="Ex: Prateleira A1" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="preco_custo">Preço de Custo</Label>
                          <Input id="preco_custo" type="number" step="0.01" placeholder="0,00" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="preco_venda">Preço de Venda</Label>
                          <Input id="preco_venda" type="number" step="0.01" placeholder="0,00" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="data_validade">Validade</Label>
                          <Input id="data_validade" type="date" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsNewProductOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => setIsNewProductOpen(false)}>Cadastrar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalProducts}</div>
                  <p className="text-xs text-muted-foreground">Itens cadastrados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Baixo Estoque</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{lowStockProducts}</div>
                  <p className="text-xs text-muted-foreground">Produtos com estoque baixo</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{outOfStockProducts}</div>
                  <p className="text-xs text-muted-foreground">Produtos esgotados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                  <p className="text-xs text-muted-foreground">Valor do estoque</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="produtos" className="space-y-4">
              <TabsList>
                <TabsTrigger value="produtos">Produtos</TabsTrigger>
                <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
                <TabsTrigger value="alertas">Alertas</TabsTrigger>
              </TabsList>

              <TabsContent value="produtos" className="space-y-4">
                {/* Search and Filters */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar produtos..."
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
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="disponivel">Disponível</SelectItem>
                          <SelectItem value="baixo_estoque">Baixo Estoque</SelectItem>
                          <SelectItem value="sem_estoque">Sem Estoque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                </Card>

                {/* Products Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Lista de Produtos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Estoque</TableHead>
                          <TableHead>Localização</TableHead>
                          <TableHead>Preços</TableHead>
                          <TableHead>Validade</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{product.nome}</p>
                                <p className="text-sm text-muted-foreground">
                                  {product.marca} • {product.categoria}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{product.quantidade_atual} un</p>
                                <p className="text-xs text-muted-foreground">Mín: {product.quantidade_minima} un</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{product.localizacao}</p>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">Custo: {formatCurrency(product.preco_custo)}</p>
                                <p className="text-sm">Venda: {formatCurrency(product.preco_venda)}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{formatDate(product.data_validade)}</p>
                            </TableCell>
                            <TableCell>{getStatusBadge(product.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedProduct(product)
                                    setIsMovementOpen(true)
                                  }}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
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
              </TabsContent>

              <TabsContent value="movimentacoes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Movimentações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Produto</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Usuário</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockMovements.map((movement) => (
                          <TableRow key={movement.id}>
                            <TableCell>{formatDate(movement.data)}</TableCell>
                            <TableCell>{movement.produto}</TableCell>
                            <TableCell>
                              <Badge variant={movement.tipo === "entrada" ? "default" : "secondary"}>
                                {movement.tipo === "entrada" ? "Entrada" : "Saída"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className={movement.tipo === "entrada" ? "text-green-600" : "text-red-600"}>
                                {movement.tipo === "entrada" ? "+" : "-"}
                                {movement.quantidade}
                              </span>
                            </TableCell>
                            <TableCell>{movement.motivo}</TableCell>
                            <TableCell>{movement.usuario}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alertas" className="space-y-4">
                <div className="grid gap-4">
                  {/* Low Stock Alerts */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <span>Produtos com Baixo Estoque</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {mockProducts
                          .filter((p) => p.status === "baixo_estoque")
                          .map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50"
                            >
                              <div>
                                <p className="font-medium">{product.nome}</p>
                                <p className="text-sm text-muted-foreground">
                                  Estoque atual: {product.quantidade_atual} un • Mínimo: {product.quantidade_minima} un
                                </p>
                              </div>
                              <Button size="sm">Repor Estoque</Button>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Out of Stock Alerts */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                        <span>Produtos Sem Estoque</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {mockProducts
                          .filter((p) => p.status === "sem_estoque")
                          .map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center justify-between p-3 border rounded-lg bg-red-50"
                            >
                              <div>
                                <p className="font-medium">{product.nome}</p>
                                <p className="text-sm text-muted-foreground">
                                  Produto esgotado • Fornecedor: {product.fornecedor}
                                </p>
                              </div>
                              <Button size="sm" variant="destructive">
                                Comprar Urgente
                              </Button>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
