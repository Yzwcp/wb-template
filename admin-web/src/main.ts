import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

// Vue patchStyle CSSStyleDeclaration 兼容 polyfill
const _origSetProperty = CSSStyleDeclaration.prototype.setProperty
CSSStyleDeclaration.prototype.setProperty = function (prop: string, value: string, priority?: string) {
  if (typeof prop === 'number') return
  return _origSetProperty.call(this, prop, value, priority)
}
// 彻底屏蔽索引赋值 style[0]=xxx
const _origDefineProperty = Object.defineProperty
try {
  Object.defineProperty(CSSStyleDeclaration.prototype, '0', {
    set() {}, get() { return '' }, configurable: true, enumerable: false
  })
} catch {}

import App from './App.vue'
import router from './router'
import vHas from './directives/has'
import './styles/global.less'

dayjs.locale('zh-cn')

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)
app.use(Antd)
app.directive('has', vHas)

app.mount('#app')
