import { useUserStore } from '@/stores/user'

/**
 * 判断当前用户是否拥有指定权限。
 * @param perm - 权限码字符串或数组（数组 = AND，全部满足才返回 true）
 * @example hasPerm('order:refund')
 * @example hasPerm(['order:refund', 'order:list'])
 */
export function hasPerm(perm: string | string[]): boolean {
  const perms = useUserStore().permissions
  if (!Array.isArray(perms) || perms.length === 0) return false
  const list = Array.isArray(perm) ? perm : [perm]
  return list.every((p) => perms.includes(p))
}
