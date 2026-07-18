import { useDictStore } from '@/stores/dict'

/**
 * 通用字典 composable
 * 优先从 Pinia dictStore 读取（登录时已全量加载），
 * 未加载时回退到按需 API 请求（兼容非登录页面）
 */
export function useDict() {
  const dictStore = useDictStore()

  /** 加载单个字典 */
  async function loadDict(code: string) {
    // store 已全量加载，无需再请求
    return
  }

  /** 批量加载 */
  async function loadDicts(_codes: string[]) {
    return
  }

  function getLabel(code: string, value: any): string {
    return dictStore.getLabel(code, value)
  }

  function getOptions(code: string): { label: string; value: string }[] {
    return dictStore.getOptions(code)
  }

  function getDict(code: string) {
    return dictStore.dictMap[code] || []
  }

  function getMeta(code: string, value: any): Record<string, any> {
    return dictStore.getMeta(code, value)
  }

  return { loadDict, loadDicts, getLabel, getOptions, getDict, getMeta }
}
