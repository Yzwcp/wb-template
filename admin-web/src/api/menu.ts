import request from './request'
import type { PageParams, PageResult } from '@/types/menu'
import type { MenuItem } from '@/types/menu'

/** 获取菜单树 */
export function getTree(): Promise<MenuItem[]> {
  return request.get('/api/menu/tree')
}

/** 获取全部菜单列表 */
export function getList(params?: PageParams): Promise<PageResult<MenuItem>> {
  return request.get('/api/menu/list', { params })
}

/** 根据 ID 获取菜单 */
export function getById(id: number): Promise<MenuItem> {
  return request.get(`/api/menu/${id}`)
}

/** 创建菜单 */
export function create(data: Partial<MenuItem>): Promise<void> {
  return request.post('/api/menu', data)
}

/** 更新菜单 */
export function update(id: number, data: Partial<MenuItem>): Promise<void> {
  return request.post(`/api/menu/${id}`, data)
}

/** 删除菜单 */
export function remove(id: number): Promise<void> {
  return request.post(`/api/menu/${id}/delete`)
}
