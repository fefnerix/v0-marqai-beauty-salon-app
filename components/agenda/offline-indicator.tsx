"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { syncManager } from "@/lib/offline/sync"
import { offlineStorage } from "@/lib/offline/storage"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingSync, setPendingSync] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    const checkPendingSync = async () => {
      const queue = await offlineStorage.getSyncQueue()
      setPendingSync(queue.length)
    }

    // Initial check
    updateOnlineStatus()
    checkPendingSync()

    // Listen for online/offline events
    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    // Check pending sync periodically
    const interval = setInterval(checkPendingSync, 5000)

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
      clearInterval(interval)
    }
  }, [])

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await syncManager.syncPendingActions()
      const queue = await offlineStorage.getSyncQueue()
      setPendingSync(queue.length)
    } catch (error) {
      console.error("Error during manual sync:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  if (isOnline && pendingSync === 0) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <Wifi className="mr-1 h-3 w-3" />
        Online
      </Badge>
    )
  }

  if (!isOnline) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <WifiOff className="mr-1 h-3 w-3" />
        Offline
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
        <Wifi className="mr-1 h-3 w-3" />
        {pendingSync} pendente{pendingSync !== 1 ? "s" : ""}
      </Badge>
      <Button variant="ghost" size="sm" onClick={handleSync} disabled={isSyncing}>
        <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
      </Button>
    </div>
  )
}
