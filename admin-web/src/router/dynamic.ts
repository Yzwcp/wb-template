import type { RouteRecordRaw } from 'vue-router'
import type { MenuItem } from '@/types/menu'

/**
 * 将后端菜单树转换为 Vue Router 路由（扁平化，直接挂在 Layout 下）
 * 例：/system/user → path: 'system/user', component: views/system/user/index.vue
 */
export function generateRoutes(menus: MenuItem[]): RouteRecordRaw[] {
  if (!menus || menus.length === 0) return []

  const routes: RouteRecordRaw[] = []

  function walk(items: MenuItem[]) {
    for (const menu of items) {
      // 跳过按钮权限（type=F）
      if (menu.type === 'F') continue

      // 组件路径去掉前导 /
      const compPath = menu.component?.replace(/^\//, '') || ''

      // 只有 type=C 且有 component 的才生成页面路由
      if (menu.type === 'C' && compPath) {
        routes.push({
          path: (menu.path || '').replace(/^\//, ''),
          name: menu.name,
          component: resolveComponent(compPath),
          meta: {
            title: menu.name,
            icon: menu.icon,
            permission: menu.permission,
          },
        })
      }

      // 递归子节点
      if (menu.children?.length) {
        walk(menu.children)
      }
    }
  }

  walk(menus)
  return routes
}

/** 解析组件路径（相对于 src/views/） */
function resolveComponent(componentPath: string) {
  const modules = import.meta.glob('@/views/**/index.vue')
  const key = `/src/views/${componentPath}/index.vue`
  if (modules[key]) return modules[key]
  return () => import(`@/views/${componentPath}/index.vue`)
}
