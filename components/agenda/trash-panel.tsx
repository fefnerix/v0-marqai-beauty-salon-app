"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, RotateCcw, Search, Calendar, User, Briefcase, Clock } from "lucide-react"
import { getTrashItems, restoreItem, permanentDeleteItem } from "@/server/actions/agenda/trash"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TrashItem {
  id: string
  table_name: string
  record_id: string
  record_data: any
  deleted_at: string
  deleted_by: string
  delete_reason?: string
  user_name?: string
}

export function TrashPanel() {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTrashItems()
  }, [])

  const loadTrashItems = async () => {
    try {
      const items = await getTrashItems()
      setTrashItems(items)
    } catch (error) {
      console.error("Erro ao carregar lixeira:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async (item: TrashItem) => {
    try {
      await restoreItem(item.table_name, item.record_id)
      await loadTrashItems()
    } catch (error) {
      console.error("Erro ao restaurar item:", error)
    }
  }

  const handlePermanentDelete = async (item: TrashItem) => {
    try {
      await permanentDeleteItem(item.table_name, item.record_id)
      await loadTrashItems()
    } catch (error) {
      console.error("Erro ao excluir permanentemente:", error)
    }
  }

  const filteredItems = trashItems.filter((item) => {
    const matchesSearch =
      JSON.stringify(item.record_data).toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.delete_reason?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTab = selectedTab === "all" || item.table_name === selectedTab

    return matchesSearch && matchesTab
  })

  const getItemIcon = (tableName: string) => {
    switch (tableName) {
      case "appointments":
        return <Calendar className="h-4 w-4" />
      case "professionals":
        return <User className="h-4 w-4" />
      case "services":
        return <Briefcase className="h-4 w-4" />
      case "waitlist_entries":
        return <Clock className="h-4 w-4" />
      default:
        return <Trash2 className="h-4 w-4" />
    }
  }

  const getItemTitle = (item: TrashItem) => {
    const data = item.record_data
    switch (item.table_name) {
      case "appointments":
        return `${data.client_name} - ${data.service?.name || "Serviço"}`
      case "professionals":
        return data.name
      case "services":
        return data.name
      case "waitlist_entries":
        return `${data.client_name} - Lista de espera`
      default:
        return "Item desconhecido"
    }
  }

  const getItemSubtitle = (item: TrashItem) => {
    const data = item.record_data
    switch (item.table_name) {
      case "appointments":
        return `${format(new Date(data.start_time), "PPP 'às' HH:mm", { locale: ptBR })}`
      case "professionals":
        return data.email
      case "services":
        return `${data.duration}min - R$ ${data.price}`
      case "waitlist_entries":
        return `Prioridade: ${data.priority}`
      default:
        return ""
    }
  }

  const getTableDisplayName = (tableName: string) => {
    switch (tableName) {
      case "appointments":
        return "Agendamentos"
      case "professionals":
        return "Profissionais"
      case "services":
        return "Serviços"
      case "waitlist_entries":
        return "Lista de Espera"
      default:
        return tableName
    }
  }

  const tabCounts = trashItems.reduce(
    (acc, item) => {
      acc[item.table_name] = (acc[item.table_name] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

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
          <h2 className="text-2xl font-bold">Lixeira</h2>
          <p className="text-muted-foreground">Itens excluídos nos últimos 30 dias</p>
        </div>
        <Badge variant="secondary">{trashItems.length} itens</Badge>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar na lixeira..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">Todos ({trashItems.length})</TabsTrigger>
          <TabsTrigger value="appointments">Agendamentos ({tabCounts.appointments || 0})</TabsTrigger>
          <TabsTrigger value="professionals">Profissionais ({tabCounts.professionals || 0})</TabsTrigger>
          <TabsTrigger value="services">Serviços ({tabCounts.services || 0})</TabsTrigger>
          <TabsTrigger value="waitlist_entries">Lista de Espera ({tabCounts.waitlist_entries || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Trash2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhum item encontrado." : "A lixeira está vazia."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="p-2 bg-muted rounded-lg">{getItemIcon(item.table_name)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium truncate">{getItemTitle(item)}</h4>
                            <Badge variant="outline" className="text-xs">
                              {getTableDisplayName(item.table_name)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{getItemSubtitle(item)}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <span>
                              Excluído em {format(new Date(item.deleted_at), "PPP 'às' HH:mm", { locale: ptBR })}
                            </span>
                            {item.user_name && <span>por {item.user_name}</span>}
                          </div>
                          {item.delete_reason && (
                            <p className="text-xs text-muted-foreground mt-1 italic">Motivo: {item.delete_reason}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(item)}
                          className="bg-transparent"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restaurar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive bg-transparent"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Permanentemente</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O item será excluído permanentemente do sistema.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handlePermanentDelete(item)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir Permanentemente
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
