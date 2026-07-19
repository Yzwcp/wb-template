/** 后端菜单项结构 */
export interface MenuItem {
  /** @deprecated use visible */
  hidden?: never
  id: number
  parentId: number
  name: string
  path: string
  component: string
  icon: string
  sort: number
  visible: number
  type: 'M' | 'C' | 'F'
  permission: string
  children: MenuItem[]
}

/** 通用 API 响应 */
export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
}

/** 分页请求参数 */
export interface PageParams {
  page: number
  pageSize: number
  [key: string]: any
}

/** 分页响应 */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 登录凭据 */
export interface LoginParams {
  username: string
  password: string
}

/** 登录结果 */
export interface LoginResult {
  token: string
  refreshToken: string
  userInfo: UserInfo
}

/** 用户信息 */
export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar: string
}

/** 刷新 Token 结果 */
export interface RefreshTokenResult {
  token: string
  refreshToken: string
}
