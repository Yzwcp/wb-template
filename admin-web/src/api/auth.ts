import request from './request'
import type { LoginParams, LoginResult, RefreshTokenResult, UserInfo } from '@/types/menu'

/** 登录 */
export function login(username: string, password: string): Promise<LoginResult> {
  return request.post('/api/auth/login', { username, password })
}

/** 退出登录 */
export function logout(): Promise<void> {
  return request.post('/api/auth/logout')
}

/** 刷新 Token */
export function refreshToken(token: string): Promise<RefreshTokenResult> {
  return request.post('/api/auth/refresh', { refreshToken: token })
}

/** 获取当前用户信息（含权限和菜单） */
export function getUserInfo(): Promise<{
  userInfo: UserInfo
  permissions: string[]
  menus: any[]
}> {
  return request.get('/api/auth/info')
}
