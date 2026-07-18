import request from './request'
import type { PageParams, PageResult } from '@/types/menu'

export interface RoleRecord {
  id: number
  name: string
  code: string
  description: string
  status: number
  createTime: string
  menuIds?: number[]
}

/** 获取角色列表 */
export function getList(params: PageParams): Promise<PageResult<RoleRecord>> {
  return request.get('/api/role/list', { params })
}

/** 获取全部角色（不分页） */
export function getAll(): Promise<RoleRecord[]> {
  return request.get('/api/role/all')
}

/** 根据 ID 获取角色详情 */
export function getById(id: number): Promise<RoleRecord> {
  return request.get(`/api/role/${id}`)
}

/** 创建角色 */
export function create(data: Partial<RoleRecord>): Promise<void> {
  return request.post('/api/role', data)
}

/** 更新角色 */
export function update(id: number, data: Partial<RoleRecord>): Promise<void> {
  return request.post(`/api/role/${id}`, data)
}

/** 删除角色 */
export function remove(id: number): Promise<void> {
  return request.post(`/api/role/${id}/delete`)
}

/** 更新角色状态 */
export function updateStatus(id: number, status: number): Promise<void> {
  return request.post(`/api/role/${id}/status`, { status })
}

/** 分配菜单权限 */
export function assignMenus(id: number, menuIds: number[]): Promise<void> {
  return request.post(`/api/role/${id}/menus`, { menuIds })
}
