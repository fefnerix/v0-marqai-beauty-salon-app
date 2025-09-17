"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"

interface Professional {
  id?: string
  name: string
  email: string
  phone: string
  specialties: string[]
  avatar_url?: string
  is_active: boolean
  bio?: string
  address?: string
}

interface ProfessionalFormProps {
  professional?: Professional
  onSubmit: (data: Partial<Professional>) => Promise<void>
}

export function ProfessionalForm({ professional, onSubmit }: ProfessionalFormProps) {
  const [formData, setFormData] = useState<Partial<Professional>>({
    name: professional?.name || "",
    email: professional?.email || "",
    phone: professional?.phone || "",
    specialties: professional?.specialties || [],
    avatar_url: professional?.avatar_url || "",
    is_active: professional?.is_active ?? true,
    bio: professional?.bio || "",
    address: professional?.address || "",
  })
  const [newSpecialty, setNewSpecialty] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error("Erro ao salvar profissional:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties?.includes(newSpecialty.trim())) {
      setFormData((prev) => ({
        ...prev,
        specialties: [...(prev.specialties || []), newSpecialty.trim()],
      }))
      setNewSpecialty("")
    }
  }

  const removeSpecialty = (specialty: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties?.filter((s) => s !== specialty) || [],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avatar_url">URL do Avatar</Label>
          <Input
            id="avatar_url"
            value={formData.avatar_url}
            onChange={(e) => setFormData((prev) => ({ ...prev, avatar_url: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Biografia</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Especialidades</Label>
        <div className="flex space-x-2">
          <Input
            value={newSpecialty}
            onChange={(e) => setNewSpecialty(e.target.value)}
            placeholder="Nova especialidade"
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialty())}
          />
          <Button type="button" onClick={addSpecialty} variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.specialties?.map((specialty, index) => (
            <Badge key={index} variant="secondary" className="flex items-center space-x-1">
              <span>{specialty}</span>
              <button type="button" onClick={() => removeSpecialty(specialty)} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
        />
        <Label htmlFor="is_active">Profissional ativo</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : professional ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  )
}
