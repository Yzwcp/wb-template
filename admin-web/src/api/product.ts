import request from './request'
import type { PageResult } from '@/types/menu'

export interface ProductRecord {
  id: number; name: string; description: string; price: number;
  coverImage: string; images: string; stock: number; status: number; sort: number;
  createdAt: string;
}

export function getList(params: any): Promise<PageResult<ProductRecord>> {
  return request.get('/api/product', { params })
}
export function getAll(): Promise<ProductRecord[]> {
  return request.get('/api/product/all')
}
export function getById(id: number): Promise<ProductRecord> {
  return request.get(`/api/product/${id}`)
}
export function create(data: any): Promise<void> {
  return request.post('/api/product', data)
}
export function update(id: number, data: any): Promise<void> {
  return request.post(`/api/product/${id}`, data)
}
export function remove(id: number): Promise<void> {
  return request.post(`/api/product/${id}/delete`)
}
