import request from './request'
import type { PageParams, PageResult } from '@/types/menu'

export interface PermissionRecord {
  id: number
  name: string
  code: string
  description: string
  createTime?: string
}

export function getList(params: PageParams): Promise<PageResult<PermissionRecord>> {
  return request.get('/api/permission/list', { params })
}

export function create(data: Partial<PermissionRecord>): Promise<void> {
  return request.post('/api/permission', data)
}

export function update(id: number, data: Partial<PermissionRecord>): Promise<void> {
  return request.post(`/api/permission/${id}`, data)
}

export function remove(id: number): Promise<void> {
  return request.post(`/api/permission/${id}/delete`)
}
