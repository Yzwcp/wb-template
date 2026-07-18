import { get } from "@/utils/request";

/** 获取商品列表（分页） */
export function getProductList(params) {
  return get("/api/product/list", params);
}

/** 获取所有在售商品 */
export function getProductAll() {
  return get("/api/product/all");
}

/** 获取商品详情 */
export function getProductById(id) {
  return get("/api/product/" + id);
}
