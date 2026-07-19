import request from './request'
import type { PageResult } from '@/types/menu'

export interface FileRecord {
  id: number
  originalName: string
  url: string
  mimeType: string
  size: number
  storageType: string
  uploadBy: number
  createdAt: string
}

export interface UploadUrlResult {
  uploadUrl: string
  fileUrl: string
  objectKey: string
  category: string
}

/** 获取文件列表 */
export function getList(params: {
  page: number; pageSize: number; keyword?: string; fileType?: string; uploadBy?: number
}): Promise<PageResult<FileRecord>> {
  return request.get('/api/file/list', { params })
}

/** 获取 OSS 直传预签名 URL */
export function getUploadUrl(fileName: string, contentType: string): Promise<UploadUrlResult> {
  return request.get('/api/file/upload-url', { params: { fileName, contentType } })
}

/** 保存 OSS 上传后的文件记录 */
export function saveFile(data: { originalName: string; url: string; mimeType: string; size: number }): Promise<FileRecord> {
  return request.post('/api/file/save', data)
}

/** 删除文件 */
export function removeFile(id: number): Promise<void> {
  return request.post(`/api/file/${id}/delete`)
}

/** 移动文件到分组 */
export function moveToGroup(data: { fileIds: number[]; groupId: number | null }): Promise<{ affectedCount: number }> {
  return request.post("/api/file/move-to-group", data)
}

// ===== 文件分组 =====
export interface FileGroup { id: number; name: string; sort: number }

export function getGroups(): Promise<FileGroup[]> {
  return request.get('/api/file/groups/list')
}
export function createGroup(name: string): Promise<FileGroup> {
  return request.post('/api/file/groups', { name })
}
export function updateGroup(id: number, name: string): Promise<void> {
  return request.post(`/api/file/groups/${id}`, { name })
}
export function deleteGroup(id: number): Promise<void> {
  return request.post(`/api/file/groups/${id}/delete`)
}
