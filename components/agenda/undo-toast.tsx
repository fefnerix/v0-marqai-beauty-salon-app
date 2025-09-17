"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { RotateCcw } from "lucide-react"

interface UndoToastProps {
  message: string
  onUndo: () => Promise<void>
  duration?: number
}

export function showUndoToast({ message, onUndo, duration = 5000 }: UndoToastProps) {
  let isUndone = false

  const handleUndo = async () => {
    if (isUndone) return
    isUndone = true

    try {
      await onUndo()
      toast({
        title: "Ação desfeita",
        description: "O item foi restaurado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao desfazer",
        description: "Não foi possível desfazer a ação.",
        variant: "destructive",
      })
    }
  }

  toast({
    title: message,
    description: "Esta ação pode ser desfeita nos próximos segundos.",
    duration,
    action: (
      <Button variant="outline" size="sm" onClick={handleUndo} className="bg-transparent">
        <RotateCcw className="h-4 w-4 mr-1" />
        Desfazer
      </Button>
    ),
  })
}
