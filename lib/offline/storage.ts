import localforage from "localforage"

// Configure localforage
localforage.config({
  name: "MarqaiSalon",
  storeName: "agenda_cache",
  description: "Offline cache for agenda data",
})

export interface CachedAppointment {
  id: string
  data: any
  lastModified: string
  action: "create" | "update" | "delete"
  synced: boolean
}

export interface OfflineQueue {
  id: string
  action: string
  data: any
  timestamp: string
  retryCount: number
}

class OfflineStorage {
  private static instance: OfflineStorage
  private syncQueue: OfflineQueue[] = []

  static getInstance(): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage()
    }
    return OfflineStorage.instance
  }

  // Cache agenda data for offline access
  async cacheAgendaData(date: string, companyId: string, data: any) {
    const key = `agenda_${companyId}_${date}`
    await localforage.setItem(key, {
      data,
      cachedAt: new Date().toISOString(),
      companyId,
      date,
    })
  }

  // Get cached agenda data
  async getCachedAgendaData(date: string, companyId: string) {
    const key = `agenda_${companyId}_${date}`
    return await localforage.getItem(key)
  }

  // Add action to sync queue
  async addToSyncQueue(action: string, data: any) {
    const queueItem: OfflineQueue = {
      id: crypto.randomUUID(),
      action,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    }

    this.syncQueue.push(queueItem)
    await localforage.setItem("sync_queue", this.syncQueue)
    return queueItem.id
  }

  // Get sync queue
  async getSyncQueue(): Promise<OfflineQueue[]> {
    const queue = await localforage.getItem<OfflineQueue[]>("sync_queue")
    return queue || []
  }

  // Remove item from sync queue
  async removeFromSyncQueue(id: string) {
    this.syncQueue = this.syncQueue.filter((item) => item.id !== id)
    await localforage.setItem("sync_queue", this.syncQueue)
  }

  // Clear all cached data
  async clearCache() {
    await localforage.clear()
    this.syncQueue = []
  }

  // Store optimistic update
  async storeOptimisticUpdate(appointmentId: string, data: any, action: "create" | "update" | "delete") {
    const key = `optimistic_${appointmentId}`
    await localforage.setItem(key, {
      id: appointmentId,
      data,
      action,
      timestamp: new Date().toISOString(),
    })
  }

  // Get optimistic update
  async getOptimisticUpdate(appointmentId: string) {
    const key = `optimistic_${appointmentId}`
    return await localforage.getItem(key)
  }

  // Remove optimistic update
  async removeOptimisticUpdate(appointmentId: string) {
    const key = `optimistic_${appointmentId}`
    await localforage.removeItem(key)
  }
}

export const offlineStorage = OfflineStorage.getInstance()
