import { get, post } from "@/utils/request";

/** 小程序创建订单 */
export function createOrder(data) {
  return post("/api/order/mp/create", data);
}

/** 小程序发起支付 */
export function payOrder(data) {
  return post("/api/order/mp/pay", data);
}

/** 获取我的订单列表 */
export function getOrderList(params) {
  return get("/api/order/mp/list", params);
}

/** 获取订单详情 */
export function getOrderById(id) {
  return get("/api/order/" + id);
}
