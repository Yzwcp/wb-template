import request from './request'
import type { PageParams, PageResult } from '@/types/menu'

export interface QueueInfo {
  name: string
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  paused: boolean
}

export interface JobRecord {
  id: string
  name: string
  queue: string
  data: any
  attemptsMade: number
  status: string
  processedOn: number
  finishedOn: number
  failedReason: string
}

export function getQueues(): Promise<QueueInfo[]> {
  return request.get('/api/queue/list')
}

export function getJobs(params: PageParams & { queue?: string }): Promise<PageResult<JobRecord>> {
  return request.get('/api/queue/jobs', { params })
}

export function retryJob(queue: string, jobId: string): Promise<void> {
  return request.post(`/api/queue/${queue}/${jobId}/retry`)
}

export function cleanQueue(queue: string): Promise<void> {
  return request.post(`/api/queue/${queue}/clean`)
}
