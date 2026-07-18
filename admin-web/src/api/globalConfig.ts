import request from './request'

/** 微信小程序配置 */
export interface WechatAppConfig {
  appId: string
  secret: string
  paymentMchId: string
  paymentKey: string
  notifyUrl?: string
  refundNotifyUrl?: string
  pfxPath?: string
  /** 虚拟支付 OfferID */
  offerId?: string
  /** 虚拟支付 现网 AppKey */
  appKey?: string
  /** 虚拟支付 沙箱 AppKey */
  sandboxAppKey?: string
  /** 虚拟支付环境：1-沙箱，0-现网 */
  env?: number
}

/** OSS 配置 */
export interface OssConfig {
  region: string
  accessKeyId: string
  accessKeySecret: string
  bucket: string
}

/** 全局配置记录 */
export interface GlobalConfigRecord {
  id: number
  name: string
  isActive: number
  wechatConfig: WechatAppConfig | null
  ossConfig: OssConfig | null
  remark: string
  createdAt: string
  updatedAt: string
}

export function getList(): Promise<GlobalConfigRecord[]> {
  return request.get('/api/global-config')
}
export function getActive(): Promise<GlobalConfigRecord | null> {
  return request.get('/api/global-config/active')
}
export function setActive(id: number): Promise<void> {
  return request.post(`/api/global-config/${id}/active`)
}
export function create(data: Partial<GlobalConfigRecord>): Promise<void> {
  return request.post('/api/global-config', data)
}
export function update(id: number, data: Partial<GlobalConfigRecord>): Promise<void> {
  return request.post(`/api/global-config/${id}`, data)
}
export function remove(id: number): Promise<void> {
  return request.post(`/api/global-config/${id}/delete`)
}
