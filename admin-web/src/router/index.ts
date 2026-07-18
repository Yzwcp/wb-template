import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { staticRoutes } from './routes'
import { generateRoutes } from './dynamic'
import { useUserStore } from '@/stores/user'
import { useDictStore } from '@/stores/dict'
import { getToken } from '@/utils/token'

const router = createRouter({
  history: createWebHistory(),
  routes: staticRoutes,
})

/** 白名单：无需登录即可访问 */
const whiteList = ['/login']

/** 已动态添加的路由标记 */
let hasAddedRoutes = false

router.beforeEach(async (to, _from, next) => {
  const token = getToken()
  const userStore = useUserStore()

  // 已登录
  if (token) {
    if (to.path === '/login') {
      // 已登录访问登录页 → 重定向到首页
      next({ path: '/' })
      return
    }

    // 菜单未加载 → 先获取用户信息和菜单，动态添加路由
    if (!userStore.menusLoaded && !hasAddedRoutes) {
      try {
        await userStore.fetchUserInfo()

        // 加载所有字典（失败不阻塞登录）
        const dictStore = useDictStore()
        try { await dictStore.loadAll() } catch { /* 字典加载失败，页面用原始值兜底 */ }

        const dynamicRoutes = generateRoutes(userStore.menus)
        for (const route of dynamicRoutes) {
          router.addRoute('Layout', route)
        }
        // 动态注册 catch-all，放在最后
        router.addRoute('Layout', {
          path: '/:pathMatch(.*)*',
          name: 'CatchAll',
          redirect: '/404',
        })
        hasAddedRoutes = true
        // 重新导航到目标路由
        next({ ...to, replace: true })
        return
      } catch (err) {
        console.error('获取用户信息失败:', err)
        await userStore.logout()
        next(`/login?redirect=${to.path}`)
        return
      }
    }

    next()
    return
  }

  // 未登录
  if (whiteList.includes(to.path)) {
    next()
  } else {
    next(`/login?redirect=${to.path}`)
  }
})

export default router
