import { post, get } from "@/utils/request";

/** 小程序登录 - 用 wx.login 的 code 换取 token */
export function mpLogin(data) {
  return post("/api/auth/mp-login", data);
}

/** 刷新 token */
export function refreshToken(data) {
  return post("/api/auth/refresh", data);
}

/** 退出登录 */
export function logout() {
  return post("/api/auth/logout");
}

/** 获取当前用户信息 */
export function getUserInfo() {
  return get("/api/auth/info");
}

/** 用 code 换取 openid（企业微信/OAuth 场景） */
export function getOpenidByCode(data) {
  return post("/api/wechat/openid", data);
}

/** 账号密码登录（管理员后台场景） */
export function login(data) {
  return post("/api/auth/login", data);
}

/** 获取登录用户信息（兼容旧接口） */
export function getLoginUser() {
  return get("/api/auth/info");
}

/** 获取用户菜单（兼容旧接口） */
export function getUserMenu() {
  return get("/api/auth/info");
}

/** 工作台首页数据（兼容旧接口） */
export function workHome() {
  return get("/api/auth/info");
}
