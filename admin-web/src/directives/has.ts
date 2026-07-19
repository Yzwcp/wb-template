import type { Directive } from 'vue'
import { hasPerm } from '@/utils/perm'

/**
 * v-has 权限指令：当用户缺少指定权限时，隐藏元素。
 * @example v-has="'order:refund'"
 * @example v-has="['order:refund', 'order:list']"
 */
const vHas: Directive = {
  mounted(el, binding) {
    const perm = binding.value
    if (!hasPerm(perm)) {
      el.parentNode?.removeChild(el)
    }
  },
}

export default vHas
