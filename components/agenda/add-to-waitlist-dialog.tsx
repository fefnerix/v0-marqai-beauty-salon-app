"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Crown, AlertTriangle, Clock } from "lucide-react"
import { addToWaitlist } from "@/server/actions/agenda/waitlist"
import type { Professional } from "@/server/actions/agenda/professionals"

interface AddToWaitlistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  professionals: Professional[]
  onSuccess: () => void
}

export function AddToWaitlistDialog({
  open,
  onOpenChange,
  companyId,
  professionals,
  onSuccess,
}: AddToWaitlistDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    professionalId: "default-professional-id", // Updated default value
    desiredDate: "",
    priority: "normal" as "normal" | "vip" | "urgent",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.clientName) return

    setIsLoading(true)
    try {
      // For now, we'll create a client on the fly
      // In a real app, you'd have client selection/creation
      const result = await addToWaitlist({
        companyId,
        clientId: "temp-client-id", // This would be handled by client creation
        professionalId: formData.professionalId || undefined,
        desiredDate: formData.desiredDate || undefined,
        priority: formData.priority,
        notes: formData.notes || undefined,
      })

      if (result.success) {
        onSuccess()
        setFormData({
          clientName: "",
          clientPhone: "",
          professionalId: "default-professional-id", // Updated default value
          desiredDate: "",
          priority: "normal",
          notes: "",
        })
      }
    } catch (error) {
      console.error("Error adding to waitlist:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar à Fila de Espera</DialogTitle>
          <DialogDescription>Adicione um cliente à fila de espera para agendamento futuro</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Information */}
          <div className="space-y-2">
            <Label htmlFor="clientName">Nome do Cliente *</Label>
            <Input
              id="clientName"
              value={formData.clientName}
              onChange={(e) => setFormData((prev) => ({ ...prev, clientName: e.target.value }))}
              placeholder="Digite o nome do cliente"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientPhone">Telefone</Label>
            <Input
              id="clientPhone"
              value={formData.clientPhone}
              onChange={(e) => setFormData((prev) => ({ ...prev, clientPhone: e.target.value }))}
              placeholder="(11) 99999-9999"
            />
          </div>

          {/* Professional Preference */}
          <div className="space-y-2">
            <Label htmlFor="professional">Profissional (Opcional)</Label>
            <Select
              value={formData.professionalId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, professionalId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Qualquer profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default-professional-id">Qualquer profissional</SelectItem> {/* Updated value */}
                {professionals.map((professional) => (
                  <SelectItem key={professional.id} value={professional.id}>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: professional.color }} />
                      {professional.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desired Date */}
          <div className="space-y-2">
            <Label htmlFor="desiredDate">Data Desejada (Opcional)</Label>
            <Input
              id="desiredDate"
              type="date"
              value={formData.desiredDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, desiredDate: e.target.value }))}
            />
          </div>

          {/* Priority */}
          <div className="space-y-3">
            <Label>Prioridade</Label>
            <RadioGroup
              value={formData.priority}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, priority: value as "normal" | "vip" | "urgent" }))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="normal" />
                <Label htmlFor="normal" className="flex items-center gap-2 cursor-pointer">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Normal
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="vip" id="vip" />
                <Label htmlFor="vip" className="flex items-center gap-2 cursor-pointer">
                  <Crown className="h-4 w-4 text-yellow-600" />
                  VIP
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="urgent" id="urgent" />
                <Label htmlFor="urgent" className="flex items-center gap-2 cursor-pointer">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Urgente
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.clientName}>
              {isLoading ? "Adicionando..." : "Adicionar à Fila"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
