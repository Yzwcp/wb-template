import request from "./request";
import type { PageParams, PageResult } from "@/types/menu";

export interface UserRecord {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  email: string;
  phone: string;
  status: number;
  createTime: string;
  updateTime: string;
  roleIds?: number[];
}

/** 获取用户列表（分页） */
export function getList(params: PageParams): Promise<PageResult<UserRecord>> {
  return request.get("/api/user/list", { params });
}

/** 根据 ID 获取用户详情 */
export function getById(id: number): Promise<UserRecord> {
  return request.get(`/api/user/${id}`);
}

/** 创建用户 */
export function create(data: Partial<UserRecord>): Promise<void> {
  return request.post("/api/user", data);
}

/** 更新用户 */
export function update(id: number, data: Partial<UserRecord>): Promise<void> {
  return request.post(`/api/user/${id}`, data);
}

/** 删除用户 */
export function remove(id: number): Promise<void> {
  return request.post(`/api/user/${id}/delete`);
}

/** 更新用户状态 */
export function updateStatus(id: number, status: string): Promise<void> {
  return request.post(`/api/user/${id}/status`, { status });
}

/** 分配角色 */
export function assignRoles(id: number, roleIds: number[]): Promise<void> {
  return request.post(`/api/user/${id}/roles`, { roleIds });
}
