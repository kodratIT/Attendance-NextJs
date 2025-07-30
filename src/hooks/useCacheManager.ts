'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
}

interface OptimisticUpdate<T> {
  id: string
  data: T
  originalData?: T
  type: 'create' | 'update' | 'delete'
  timestamp: number
}

interface CacheConfig {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum cache size
  enableOptimistic?: boolean
}

class CacheManager<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private optimisticUpdates = new Map<string, OptimisticUpdate<T>>()
  private config: Required<CacheConfig>

  constructor(config: CacheConfig = {}) {
    this.config = {
      ttl: config.ttl || 5 * 60 * 1000, // 5 minutes default
      maxSize: config.maxSize || 100,
      enableOptimistic: config.enableOptimistic ?? true
    }
  }

  set(key: string, data: T): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = Array.from(this.cache.keys())[0]
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + this.config.ttl
    })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Check if entry has expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  optimisticUpdate(key: string, updateData: Partial<T>, type: OptimisticUpdate<T>['type'] = 'update'): string {
    if (!this.config.enableOptimistic) return ''

    const updateId = `${key}-${Date.now()}-${Math.random()}`
    const currentData = this.get(key)
    
    const optimisticData = type === 'delete' 
      ? null 
      : { ...currentData, ...updateData } as T

    this.optimisticUpdates.set(updateId, {
      id: updateId,
      data: optimisticData as T,
      originalData: currentData || undefined,
      type,
      timestamp: Date.now()
    })

    // Apply optimistic update to cache
    if (optimisticData) {
      this.set(key, optimisticData)
    } else {
      this.cache.delete(key)
    }

    return updateId
  }

  confirmOptimisticUpdate(updateId: string, confirmedData?: T): void {
    const update = this.optimisticUpdates.get(updateId)
    if (!update) return

    // If confirmed data is provided, update cache with it
    if (confirmedData && update.type !== 'delete') {
      // Find the original cache key
      const cacheKey = Array.from(this.optimisticUpdates.entries())
        .find(([_, u]) => u.id === updateId)?.[0]?.split('-')[0]
      
      if (cacheKey) {
        this.set(cacheKey, confirmedData)
      }
    }

    this.optimisticUpdates.delete(updateId)
  }

  revertOptimisticUpdate(updateId: string): void {
    const update = this.optimisticUpdates.get(updateId)
    if (!update) return

    // Find the original cache key
    const cacheKey = Array.from(this.optimisticUpdates.entries())
      .find(([_, u]) => u.id === updateId)?.[0]?.split('-')[0]

    if (cacheKey) {
      if (update.originalData) {
        this.set(cacheKey, update.originalData)
      } else {
        this.cache.delete(cacheKey)
      }
    }

    this.optimisticUpdates.delete(updateId)
  }

  clear(): void {
    this.cache.clear()
    this.optimisticUpdates.clear()
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      optimisticUpdates: this.optimisticUpdates.size,
      hitRate: 0 // Would need to track hits/misses for actual hit rate
    }
  }
}

export const useCacheManager = <T>(config?: CacheConfig) => {
  const cacheRef = useRef<CacheManager<T>>()
  const [stats, setStats] = useState({ cacheSize: 0, optimisticUpdates: 0, hitRate: 0 })

  // Initialize cache manager
  if (!cacheRef.current) {
    cacheRef.current = new CacheManager<T>(config)
  }

  const cache = cacheRef.current

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(cache.getStats())
    }, 1000)

    return () => clearInterval(interval)
  }, [cache])

  const set = useCallback((key: string, data: T) => {
    cache.set(key, data)
    setStats(cache.getStats())
  }, [cache])

  const get = useCallback((key: string) => {
    return cache.get(key)
  }, [cache])

  const optimisticUpdate = useCallback((
    key: string, 
    updateData: Partial<T>, 
    type: OptimisticUpdate<T>['type'] = 'update'
  ) => {
    const updateId = cache.optimisticUpdate(key, updateData, type)
    setStats(cache.getStats())
    return updateId
  }, [cache])

  const confirmUpdate = useCallback((updateId: string, confirmedData?: T) => {
    cache.confirmOptimisticUpdate(updateId, confirmedData)
    setStats(cache.getStats())
  }, [cache])

  const revertUpdate = useCallback((updateId: string) => {
    cache.revertOptimisticUpdate(updateId)
    setStats(cache.getStats())
  }, [cache])

  const clear = useCallback(() => {
    cache.clear()
    setStats(cache.getStats())
  }, [cache])

  return {
    set,
    get,
    optimisticUpdate,
    confirmUpdate,
    revertUpdate,
    clear,
    stats
  }
}

export default useCacheManager
