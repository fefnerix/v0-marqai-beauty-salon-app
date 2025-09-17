import { offlineStorage, type OfflineQueue } from "./storage"
import { moveAppointment, createAppointment, deleteAppointment } from "@/server/actions/agenda/appointments"

class SyncManager {
  private static instance: SyncManager
  private isOnline = true
  private syncInProgress = false

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  constructor() {
    // Listen for online/offline events
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.isOnline = true
        this.syncPendingActions()
      })

      window.addEventListener("offline", () => {
        this.isOnline = false
      })

      this.isOnline = navigator.onLine
    }
  }

  getOnlineStatus(): boolean {
    return this.isOnline
  }

  async syncPendingActions() {
    if (this.syncInProgress || !this.isOnline) return

    this.syncInProgress = true

    try {
      const queue = await offlineStorage.getSyncQueue()

      for (const item of queue) {
        try {
          await this.processQueueItem(item)
          await offlineStorage.removeFromSyncQueue(item.id)
        } catch (error) {
          console.error("Error syncing item:", error)
          // Increment retry count
          item.retryCount++

          // Remove from queue if too many retries
          if (item.retryCount > 3) {
            await offlineStorage.removeFromSyncQueue(item.id)
          }
        }
      }
    } catch (error) {
      console.error("Error during sync:", error)
    } finally {
      this.syncInProgress = false
    }
  }

  private async processQueueItem(item: OfflineQueue) {
    switch (item.action) {
      case "move_appointment":
        return await moveAppointment(item.data)

      case "create_appointment":
        return await createAppointment(item.data)

      case "delete_appointment":
        return await deleteAppointment(item.data.id)

      default:
        console.warn("Unknown sync action:", item.action)
    }
  }

  async queueAction(action: string, data: any) {
    return await offlineStorage.addToSyncQueue(action, data)
  }

  // Handle optimistic updates with conflict resolution
  async handleOptimisticUpdate(appointmentId: string, updateFn: () => Promise<any>, rollbackFn: () => void) {
    try {
      // Store optimistic state
      await offlineStorage.storeOptimisticUpdate(appointmentId, {}, "update")

      if (this.isOnline) {
        // Try to sync immediately
        const result = await updateFn()

        if (result.success) {
          // Remove optimistic update on success
          await offlineStorage.removeOptimisticUpdate(appointmentId)
        } else {
          // Rollback on failure
          rollbackFn()
          await offlineStorage.removeOptimisticUpdate(appointmentId)
          throw new Error(result.error || "Update failed")
        }

        return result
      } else {
        // Queue for later sync
        await this.queueAction("update_appointment", { id: appointmentId })
        return { success: true, offline: true }
      }
    } catch (error) {
      // Rollback optimistic update
      rollbackFn()
      await offlineStorage.removeOptimisticUpdate(appointmentId)
      throw error
    }
  }
}

export const syncManager = SyncManager.getInstance()
