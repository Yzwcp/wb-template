/**
 * 订单状态常量 — 全项目唯一来源
 * 后端枚举值与字典 ORDER_STATUS 的 value 一一对应
 */

export const OrderStatus = {
  /** 待支付 */
  PENDING: "PENDING",
  /** 已支付 */
  PAID: "PAID",
  /** 已关闭 */
  CLOSED: "CLOSED",
  /** 退款中 */
  REFUNDING: "REFUNDING",
  /** 已退款 */
  REFUNDED: "REFUNDED",
  /** 部分退款 */
  PARTIAL_REFUND: "PARTIAL_REFUND",
} as const;

export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus];

/** 微信 trade_state → 本地状态映射 */
export const WECHAT_TRADE_STATE_MAP: Record<string, OrderStatusType> = {
  SUCCESS: OrderStatus.PAID,
  REFUND: OrderStatus.REFUNDED,
  CLOSED: OrderStatus.CLOSED,
  NOTPAY: OrderStatus.PENDING,
  USERPAYING: OrderStatus.PENDING,
  PAYERROR: OrderStatus.PENDING,
};

/** 退款状态 */
export const RefundStatus = {
  /** 处理中 */
  PROCESSING: "PROCESSING",
  /** 成功 */
  SUCCESS: "SUCCESS",
  /** 失败 */
  FAIL: "FAIL",
} as const;

/** 可退款的订单状态 */
export const REFUNDABLE_STATUSES: OrderStatusType[] = [
  OrderStatus.PAID,
  OrderStatus.PARTIAL_REFUND,
];
