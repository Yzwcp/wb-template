import { v4 as uuidv4 } from 'uuid';

/** 生成 32 位订单号（UUID v4 去横线截前 32 位） */
export function generateOrderNo(): string {
  return uuidv4().replace(/-/g, '').slice(0, 32);
}

/** 生成退款单号 */
export function generateRefundNo(): string {
  return `RF${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
