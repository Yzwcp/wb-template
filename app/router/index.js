import createRouter from '@/uni_modules/zzh-simple-router/js_sdk/router/router.js'
import { useGlobalStore } from '../store/global'

const router = createRouter()
router.encode = 0

// 白名单：不需要登录即可访问的页面
const whiteList = [
  'pages/tab/index',
  'pages/login/login',
  'pages/login/openid',
]

router.before = function (from, next) {
  const { token } = useGlobalStore()

  // 已登录则放行
  if (token) {
    next()
    return
  }

  // 检查目标页面是否在白名单内
  const targetUrl = from.url || ''
  const isPublic = whiteList.some((rule) => targetUrl.includes(rule))
  if (isPublic) {
    next()
    return
  }

  // 未登录且不在白名单，提示去登录
  uni.showModal({
    title: '温馨提示',
    content: '您还未登录，是否前往登录？',
    success: (res) => {
      if (res.confirm) {
        next({ url: '/pages/login/login' })
      } else {
        // 取消则跳回首页
        next({ url: '/pages/tab/index' })
      }
    },
  })
}

router.after = (to) => to
router.onError = (err) => console.log(err)

uni.$router = router
export default router
