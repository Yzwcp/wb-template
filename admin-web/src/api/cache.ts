import request from './request'
import type { PageParams, PageResult } from '@/types/menu'

export interface CacheInfo {
  redisVersion: string
  uptimeInDays: number
  usedMemory: string
  usedMemoryHuman: string
  connectedClients: number
  keysCount: number
}

export interface CacheKeyRecord {
  key: string
  type: string
  ttl: number
  value?: string
  size?: number
}

export function getInfo(): Promise<CacheInfo> {
  return request.get('/api/cache/info')
}

export function getKeys(params: PageParams & { pattern?: string }): Promise<PageResult<CacheKeyRecord>> {
  return request.get('/api/cache/keys', { params })
}

export function getAllKeys(params: { pattern?: string }): Promise<CacheKeyRecord[]> {
  return request.get('/api/cache/keys/all', { params })
}

export function getKeyDetail(key: string): Promise<CacheKeyRecord> {
  return request.get('/api/cache/key', { params: { key } })
}

export function deleteKey(key: string): Promise<void> {
  return request.post('/api/cache/key/delete', { key })
}

export function clearAll(): Promise<void> {
  return request.post('/api/cache/clear')
}
