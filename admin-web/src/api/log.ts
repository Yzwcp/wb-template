import request from './request'
import type { PageParams, PageResult } from '@/types/menu'

export interface LogRecord {
  id: number
  userId: number
  username: string
  operation: string
  method: string
  params: string
  ip: string
  duration: number
  status: number
  createTime: string
}

export interface LoginLogRecord {
  id: number
  userId: number
  username: string
  ip: string
  browser: string
  os: string
  status: number
  message: string
  loginTime: string
}

export function getOperationLogs(params: PageParams): Promise<PageResult<LogRecord>> {
  return request.get('/api/log/operation/list', { params })
}

export function clearOperationLogs(): Promise<void> {
  return request.post('/api/log/operation/clear')
}

export function getLoginLogs(params: PageParams): Promise<PageResult<LoginLogRecord>> {
  return request.get('/api/log/login/list', { params })
}

export function clearLoginLogs(): Promise<void> {
  return request.post('/api/log/login/clear')
}
