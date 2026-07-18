import request from './request'
import type { PageParams, PageResult } from '@/types/menu'

export interface TaskRecord {
  id: number
  name: string
  cronExpression: string
  handler: string
  status: number
  params: string
  createTime: string
  lastRunTime: string
  nextRunTime: string
}

export function getList(params: PageParams): Promise<PageResult<TaskRecord>> {
  return request.get('/api/task/list', { params })
}

export function getById(id: number): Promise<TaskRecord> {
  return request.get(`/api/task/${id}`)
}

export function create(data: Partial<TaskRecord>): Promise<void> {
  return request.post('/api/task', data)
}

export function update(id: number, data: Partial<TaskRecord>): Promise<void> {
  return request.post(`/api/task/${id}`, data)
}

export function remove(id: number): Promise<void> {
  return request.post(`/api/task/${id}/delete`)
}

export function execute(id: number): Promise<void> {
  return request.post(`/api/task/${id}/execute`)
}

export function pause(id: number): Promise<void> {
  return request.post(`/api/task/${id}/pause`)
}

export function resume(id: number): Promise<void> {
  return request.post(`/api/task/${id}/resume`)
}
