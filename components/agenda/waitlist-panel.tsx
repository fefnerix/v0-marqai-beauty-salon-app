"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { Users, Plus, Crown, AlertTriangle, Clock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AddToWaitlistDialog } from "./add-to-waitlist-dialog"
import { getWaitlist, removeFromWaitlist, reorderWaitlist } from "@/server/actions/agenda/waitlist"
import { suggestClientsForSlot } from "@/server/actions/agenda/waitlist"
import type { WaitlistEntry } from "@/server/actions/agenda/waitlist"
import type { Professional } from "@/server/actions/agenda/professionals"

interface WaitlistPanelProps {
  companyId: string
  professionals: Professional[]
  onAppointmentUpdate: () => void
}

const priorityIcons = {
  normal: Clock,
  vip: Crown,
  urgent: AlertTriangle,
}

const priorityColors = {
  normal: "text-blue-600",
  vip: "text-yellow-600",
  urgent: "text-red-600",
}

const priorityLabels = {
  normal: "Normal",
  vip: "VIP",
  urgent: "Urgente",
}

export function WaitlistPanel({ companyId, professionals, onAppointmentUpdate }: WaitlistPanelProps) {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [suggestions, setSuggestions] = useState<{
    waitlistSuggestions: WaitlistEntry[]
    recentClientsSuggestions: any[]
  }>({ waitlistSuggestions: [], recentClientsSuggestions: [] })

  const loadWaitlist = async () => {
    try {
      const data = await getWaitlist(companyId)
      setWaitlist(data)
    } catch (error) {
      console.error("Error loading waitlist:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadWaitlist()
  }, [companyId])

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(waitlist)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update local state optimistically
    setWaitlist(items)

    // Update positions in database
    try {
      const reorderedIds = items.map((item) => item.id)
      await reorderWaitlist(companyId, reorderedIds)
    } catch (error) {
      console.error("Error reordering waitlist:", error)
      // Revert on error
      loadWaitlist()
    }
  }

  const handleRemoveFromWaitlist = async (id: string) => {
    try {
      const result = await removeFromWaitlist(id)
      if (result.success) {
        loadWaitlist()
      }
    } catch (error) {
      console.error("Error removing from waitlist:", error)
    }
  }

  const loadSuggestions = async (professionalId: string, dateTime: string) => {
    try {
      const data = await suggestClientsForSlot(companyId, professionalId, dateTime)
      setSuggestions(data)
    } catch (error) {
      console.error("Error loading suggestions:", error)
    }
  }

  const groupedByPriority = waitlist.reduce(
    (acc, entry) => {
      acc[entry.priority].push(entry)
      return acc
    },
    { urgent: [], vip: [], normal: [] } as Record<string, WaitlistEntry[]>,
  )

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative bg-transparent">
          <Users className="mr-2 h-4 w-4" />
          Fila de Espera
          {waitlist.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {waitlist.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Fila de Espera</SheetTitle>
          <SheetDescription>Gerencie clientes aguardando agendamento</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Add to Waitlist Button */}
          <Button onClick={() => setShowAddDialog(true)} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar à Fila
          </Button>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : waitlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum cliente na fila de espera</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-4">
                  {/* Urgent Priority */}
                  {groupedByPriority.urgent.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <h3 className="font-medium text-red-600">Urgente</h3>
                        <Badge variant="destructive">{groupedByPriority.urgent.length}</Badge>
                      </div>
                      <Droppable droppableId="urgent">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {groupedByPriority.urgent.map((entry, index) => (
                              <WaitlistCard
                                key={entry.id}
                                entry={entry}
                                index={index}
                                onRemove={handleRemoveFromWaitlist}
                              />
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  )}

                  {/* VIP Priority */}
                  {groupedByPriority.vip.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="h-4 w-4 text-yellow-600" />
                        <h3 className="font-medium text-yellow-600">VIP</h3>
                        <Badge variant="secondary">{groupedByPriority.vip.length}</Badge>
                      </div>
                      <Droppable droppableId="vip">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {groupedByPriority.vip.map((entry, index) => (
                              <WaitlistCard
                                key={entry.id}
                                entry={entry}
                                index={index}
                                onRemove={handleRemoveFromWaitlist}
                              />
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  )}

                  {/* Normal Priority */}
                  {groupedByPriority.normal.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <h3 className="font-medium text-blue-600">Normal</h3>
                        <Badge variant="outline">{groupedByPriority.normal.length}</Badge>
                      </div>
                      <Droppable droppableId="normal">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {groupedByPriority.normal.map((entry, index) => (
                              <WaitlistCard
                                key={entry.id}
                                entry={entry}
                                index={index}
                                onRemove={handleRemoveFromWaitlist}
                              />
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </DragDropContext>
          )}
        </div>

        {/* Add to Waitlist Dialog */}
        <AddToWaitlistDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          companyId={companyId}
          professionals={professionals}
          onSuccess={() => {
            setShowAddDialog(false)
            loadWaitlist()
          }}
        />
      </SheetContent>
    </Sheet>
  )
}

interface WaitlistCardProps {
  entry: WaitlistEntry
  index: number
  onRemove: (id: string) => void
}

function WaitlistCard({ entry, index, onRemove }: WaitlistCardProps) {
  const PriorityIcon = priorityIcons[entry.priority]

  return (
    <Draggable draggableId={entry.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-3 ${snapshot.isDragging ? "shadow-lg" : ""}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <PriorityIcon className={`h-4 w-4 ${priorityColors[entry.priority]}`} />
                <span className="font-medium truncate">{entry.client.name}</span>
                <Badge variant="outline" className="text-xs">
                  {priorityLabels[entry.priority]}
                </Badge>
              </div>

              {entry.client.phone && <p className="text-xs text-muted-foreground mb-2">{entry.client.phone}</p>}

              {entry.professional && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">{entry.professional.name}</span>
                </div>
              )}

              {entry.desired_date && (
                <p className="text-xs text-muted-foreground mb-2">
                  Deseja: {new Date(entry.desired_date).toLocaleDateString("pt-BR")}
                </p>
              )}

              {entry.notes && <p className="text-xs text-muted-foreground line-clamp-2">{entry.notes}</p>}
            </div>

            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onRemove(entry.id)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Card>
      )}
    </Draggable>
  )
}
