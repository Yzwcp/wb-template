import request from './request'
import type { PageParams, PageResult } from '@/types/menu'

export interface DictTypeRecord {
  id: number
  name: string
  code: string
  status: number
}

export interface DictDataRecord {
  id: number
  dictTypeId: number
  label: string
  value: string
  sort: number
  status: number
}

// ==================== 字典类型 ====================

/** 获取字典类型列表 */
export function getTypeList(params: PageParams): Promise<PageResult<DictTypeRecord>> {
  return request.get('/api/dict/type/list', { params })
}

/** 获取全部字典类型 */
export function getAllTypes(): Promise<DictTypeRecord[]> {
  return request.get('/api/dict/type/all')
}

/** 获取字典类型详情 */
export function getTypeById(id: number): Promise<DictTypeRecord> {
  return request.get(`/api/dict/type/${id}`)
}

/** 创建字典类型 */
export function createType(data: Partial<DictTypeRecord>): Promise<void> {
  return request.post('/api/dict/type', data)
}

/** 更新字典类型 */
export function updateType(id: number, data: Partial<DictTypeRecord>): Promise<void> {
  return request.post(`/api/dict/type/${id}`, data)
}

/** 删除字典类型 */
export function removeType(id: number): Promise<void> {
  return request.post(`/api/dict/type/${id}/delete`)
}

// ==================== 字典数据 ====================

/** 获取字典数据列表 */
export function getDataList(params: PageParams & { dictTypeId?: number }): Promise<PageResult<DictDataRecord>> {
  return request.get('/api/dict/data/list', { params })
}

/** 根据字典编码获取字典数据 */
export function getDataByCode(code: string): Promise<DictDataRecord[]> {
  return request.get(`/api/dict/data/${code}`)
}

/** 获取全部字典 */
export function getAll(): Promise<{ code: string; name: string; items: { label: string; value: string; remark?: string }[] }[]> {
  return request.get('/api/dict/all')
}

/** 创建字典数据 */
export function createData(data: Partial<DictDataRecord>): Promise<void> {
  return request.post('/api/dict/data', data)
}

/** 更新字典数据 */
export function updateData(id: number, data: Partial<DictDataRecord>): Promise<void> {
  return request.post(`/api/dict/data/${id}`, data)
}

/** 删除字典数据 */
export function removeData(id: number): Promise<void> {
  return request.post(`/api/dict/data/${id}/delete`)
}
