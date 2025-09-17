"use client"

import { useState, useMemo } from "react"
import { format, addDays, subDays, startOfDay, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Calendar, Plus, Settings } from "lucide-react"
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { ProfessionalColumn } from "./professional-column"
import { WalkInAppointments } from "./walk-in-appointments"
import { CreateAppointmentDialog } from "./create-appointment-dialog"
import { DragOverlayComponent } from "./drag-overlay"
import { ConflictDialog } from "./conflict-dialog"
import { WaitlistPanel } from "./waitlist-panel"
import { OfflineIndicator } from "./offline-indicator"
import { moveAppointment } from "@/server/actions/agenda/appointments"
import { getAgendaSettings } from "@/server/actions/agenda/settings"
import { hasTimeConflict } from "@/lib/utils/agenda"
import { syncManager } from "@/lib/offline/sync"
import { offlineStorage } from "@/lib/offline/storage"
import type { AppointmentWithDetails } from "@/server/actions/agenda/appointments"
import type { Professional } from "@/server/actions/agenda/professionals"

interface AgendaGridProps {
  appointments: AppointmentWithDetails[]
  professionals: Professional[]
  companyId: string
  selectedDate: Date
  onDateChange: (date: Date) => void
  onAppointmentUpdate: () => void
}

export function AgendaGrid({
  appointments,
  professionals,
  companyId,
  selectedDate,
  onDateChange,
  onAppointmentUpdate,
}: AgendaGridProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState<string>()
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>()
  const [activeAppointment, setActiveAppointment] = useState<AppointmentWithDetails | null>(null)
  const [conflictDialog, setConflictDialog] = useState<{
    open: boolean
    conflicting: AppointmentWithDetails | null
    dragged: AppointmentWithDetails | null
    targetProfessionalId: string
    targetTimeSlot: string
    allowOverbooking: boolean
  }>({
    open: false,
    conflicting: null,
    dragged: null,
    targetProfessionalId: "",
    targetTimeSlot: "",
    allowOverbooking: false,
  })

  const { toast } = useToast()

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  // Generate time slots (8:00 to 18:00, 30-minute intervals)
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        slots.push(time)
      }
    }
    return slots
  }, [])

  // Separate walk-in appointments (no scheduled time)
  const walkInAppointments = appointments.filter((apt) => !apt.start_at)
  const scheduledAppointments = appointments.filter((apt) => apt.start_at)

  // Group appointments by professional
  const appointmentsByProfessional = useMemo(() => {
    const grouped: Record<string, AppointmentWithDetails[]> = {}
    professionals.forEach((prof) => {
      grouped[prof.id] = scheduledAppointments.filter((apt) => apt.professional_id === prof.id)
    })
    return grouped
  }, [scheduledAppointments, professionals])

  useMemo(() => {
    const cacheData = async () => {
      await offlineStorage.cacheAgendaData(selectedDate.toISOString().split("T")[0], companyId, {
        appointments,
        professionals,
        cachedAt: new Date().toISOString(),
      })
    }
    cacheData()
  }, [appointments, professionals, selectedDate, companyId])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    if (active.data.current?.type === "appointment") {
      setActiveAppointment(active.data.current.appointment)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveAppointment(null)

    if (!over || !active.data.current?.appointment) return

    const draggedAppointment = active.data.current.appointment as AppointmentWithDetails
    const overData = over.data.current

    if (overData?.type !== "timeSlot") return

    const targetProfessionalId = overData.professionalId
    const targetTimeSlot = overData.timeSlot
    const targetDate = parseISO(overData.date)

    // Calculate new start time
    const [hours, minutes] = targetTimeSlot.split(":").map(Number)
    const newStartTime = new Date(targetDate)
    newStartTime.setHours(hours, minutes, 0, 0)
    const newStartAt = newStartTime.toISOString()

    // Check for conflicts
    const targetProfessionalAppointments = appointmentsByProfessional[targetProfessionalId] || []
    const otherAppointments = targetProfessionalAppointments.filter((apt) => apt.id !== draggedAppointment.id)

    // Calculate end time based on services
    const totalDuration = draggedAppointment.services.reduce(
      (total, service) => total + service.duration_minutes + service.buffer_after_minutes,
      0,
    )
    const newEndTime = new Date(newStartTime.getTime() + totalDuration * 60 * 1000)
    const newEndAt = newEndTime.toISOString()

    const hasConflict = hasTimeConflict(newStartAt, newEndAt, otherAppointments)

    if (hasConflict) {
      // Find conflicting appointment
      const conflictingAppointment = otherAppointments.find((apt) => {
        if (!apt.start_at || !apt.end_at) return false
        return hasTimeConflict(newStartAt, newEndAt, [apt])
      })

      if (conflictingAppointment) {
        // Get agenda settings to check if overbooking is allowed
        try {
          const settings = await getAgendaSettings(companyId)
          setConflictDialog({
            open: true,
            conflicting: conflictingAppointment,
            dragged: draggedAppointment,
            targetProfessionalId,
            targetTimeSlot,
            allowOverbooking: settings.allow_overbooking,
          })
        } catch (error) {
          console.error("Error getting settings:", error)
          toast({
            title: "Conflito de horário",
            description: "Já existe um agendamento neste horário.",
            variant: "destructive",
          })
        }
        return
      }
    }

    // No conflict, proceed with move
    await performMove(draggedAppointment.id, newStartAt, targetProfessionalId, false)
  }

  const performMove = async (
    appointmentId: string,
    newStartAt: string,
    newProfessionalId: string,
    overbooked: boolean,
  ) => {
    const originalAppointment = appointments.find((apt) => apt.id === appointmentId)
    if (!originalAppointment) return

    // Optimistic update
    const optimisticUpdate = {
      ...originalAppointment,
      start_at: newStartAt,
      professional_id: newProfessionalId,
      overbooked,
    }

    // Update UI immediately
    onAppointmentUpdate()

    try {
      await syncManager.handleOptimisticUpdate(
        appointmentId,
        async () => {
          return await moveAppointment({
            id: appointmentId,
            newStartAt,
            newProfessionalId,
          })
        },
        () => {
          // Rollback function
          onAppointmentUpdate()
        },
      )

      toast({
        title: "Agendamento movido",
        description: syncManager.getOnlineStatus()
          ? "O agendamento foi movido com sucesso."
          : "Agendamento movido. Será sincronizado quando voltar online.",
      })
    } catch (error) {
      console.error("Error moving appointment:", error)
      toast({
        title: "Erro ao mover agendamento",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    }
  }

  const handleConflictResolution = async (allowOverbook: boolean) => {
    const { dragged, targetProfessionalId, targetTimeSlot } = conflictDialog

    if (!dragged) return

    const [hours, minutes] = targetTimeSlot.split(":").map(Number)
    const newStartTime = new Date(selectedDate)
    newStartTime.setHours(hours, minutes, 0, 0)
    const newStartAt = newStartTime.toISOString()

    setConflictDialog((prev) => ({ ...prev, open: false }))

    await performMove(dragged.id, newStartAt, targetProfessionalId, allowOverbook)
  }

  const handleCreateAppointment = (professionalId: string, timeSlot?: string) => {
    setSelectedProfessional(professionalId)
    setSelectedTimeSlot(timeSlot)
    setShowCreateDialog(true)
  }

  const formatSelectedDate = format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-background p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => onDateChange(subDays(selectedDate, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => onDateChange(addDays(selectedDate, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold capitalize">{formatSelectedDate}</h2>
            </div>
            <Button variant="outline" onClick={() => onDateChange(startOfDay(new Date()))}>
              Hoje
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <OfflineIndicator />
            <WaitlistPanel
              companyId={companyId}
              professionals={professionals}
              onAppointmentUpdate={onAppointmentUpdate}
            />
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Time Column */}
          <div className="w-20 border-r bg-muted/30">
            <div className="h-16 border-b" /> {/* Header spacer */}
            <ScrollArea className="h-[calc(100vh-8rem)]">
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="flex h-16 items-center justify-center border-b text-sm text-muted-foreground"
                >
                  {time}
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Professionals Columns */}
          <ScrollArea className="flex-1" orientation="horizontal">
            <div className="flex min-w-max">
              {professionals.map((professional) => (
                <ProfessionalColumn
                  key={professional.id}
                  professional={professional}
                  appointments={appointmentsByProfessional[professional.id] || []}
                  timeSlots={timeSlots}
                  selectedDate={selectedDate}
                  onCreateAppointment={handleCreateAppointment}
                  onAppointmentUpdate={onAppointmentUpdate}
                />
              ))}
            </div>
          </ScrollArea>

          {/* Walk-in Appointments Sidebar */}
          <WalkInAppointments
            appointments={walkInAppointments}
            onAppointmentUpdate={onAppointmentUpdate}
            onScheduleAppointment={(appointmentId, professionalId, timeSlot) => {
              console.log("Schedule walk-in:", { appointmentId, professionalId, timeSlot })
            }}
          />
        </div>

        {/* Drag Overlay */}
        <DragOverlayComponent activeAppointment={activeAppointment} />

        {/* Create Appointment Dialog */}
        <CreateAppointmentDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          companyId={companyId}
          professionals={professionals}
          selectedProfessional={selectedProfessional}
          selectedTimeSlot={selectedTimeSlot}
          selectedDate={selectedDate}
          onSuccess={() => {
            setShowCreateDialog(false)
            onAppointmentUpdate()
          }}
        />

        {/* Conflict Resolution Dialog */}
        <ConflictDialog
          open={conflictDialog.open}
          onOpenChange={(open) => setConflictDialog((prev) => ({ ...prev, open }))}
          conflictingAppointment={conflictDialog.conflicting}
          draggedAppointment={conflictDialog.dragged}
          allowOverbooking={conflictDialog.allowOverbooking}
          onConfirm={handleConflictResolution}
        />
      </div>
    </DndContext>
  )
}
