import request from './request'
import type { PageResult } from '@/types/menu'

export interface OrderRecord {
  id: number
  orderNo: string
  outTradeNo: string
  transactionId: string
  userId: number
  productId: number
  openid: string
  body: string
  totalFee: number
  status: string
  payTime: string
  refundFee: number
  refundStatus: string
  refundNo: string
  createdAt: string
}

export interface RefundRecordItem {
  id: number
  orderId: number
  refundNo: string
  refundFee: number
  refundDesc: string
  status: string
  errorMsg: string
  createdAt: string
}

export function getList(params: any): Promise<PageResult<OrderRecord>> {
  return request.get('/api/order', { params })
}
export function getById(id: number): Promise<OrderRecord> {
  return request.get(`/api/order/${id}`)
}
export function queryAndSync(outTradeNo: string): Promise<OrderRecord> {
  return request.post('/api/order/query-sync', { outTradeNo })
}
export function syncRefund(id: number): Promise<any> {
  return request.post('/api/order/sync-refund', { id })
}
export function refund(id: number, refundFee: number, refundDesc?: string): Promise<void> {
  return request.post('/api/order/refund', { id, refundFee, refundDesc })
}
export function getRefundRecords(orderId: number): Promise<RefundRecordItem[]> {
  return request.get(`/api/order/${orderId}/refunds`)
}
