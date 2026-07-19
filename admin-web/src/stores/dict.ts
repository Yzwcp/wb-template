import { defineStore } from "pinia";
import { ref } from "vue";
import * as dictApi from "@/api/dict";

interface DictItem {
  label: string;
  value: string;
  remark?: string;
}

// ===== localStorage 持久化工具 =====
const PREFIX = "persist:";
function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function saveJSON(key: string, val: any) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(val));
  } catch {}
}
function removeKey(key: string) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {}
}

const K_DICT_MAP = "dict_map";

export const useDictStore = defineStore("dict", () => {
  // 从 localStorage 恢复字典数据，页面切换无需重复加载
  const loaded = ref(false);
  const loading = ref(false);
  const dictMap = ref<Record<string, DictItem[]>>(loadJSON(K_DICT_MAP, {}));

  /** 一键加载所有字典 */
  async function loadAll() {
    if (loaded.value || loading.value) return;
    loading.value = true;
    try {
      const data: any[] = await dictApi.getAll();
      const map: Record<string, DictItem[]> = {};
      for (const group of data) {
        map[group.code] = group.items;
      }
      dictMap.value = map;
      loaded.value = true;
      // 持久化
      saveJSON(K_DICT_MAP, map);
    } finally {
      loading.value = false;
    }
  }

  /** 获取标签 */
  function getLabel(code: string, value: any): string {
    const items = dictMap.value[code];
    if (!items) return String(value ?? "");
    const item = items.find((i) => String(i.value) === String(value));
    return item?.label ?? String(value ?? "");
  }

  /** 获取选项列表 */
  function getOptions(code: string): { label: string; value: string }[] {
    return dictMap.value[code] || [];
  }

  /** 获取元数据（remark JSON） */
  function getMeta(code: string, value: any): Record<string, any> {
    const items = dictMap.value[code];
    if (!items) return {};
    const item = items.find((i) => String(i.value) === String(value));
    if (!item?.remark) return {};
    try {
      return JSON.parse(item.remark);
    } catch {
      return {};
    }
  }

  function reset() {
    dictMap.value = {};
    loaded.value = false;
    removeKey(K_DICT_MAP);
  }

  return {
    loaded,
    loading,
    dictMap,
    loadAll,
    getLabel,
    getOptions,
    getMeta,
    reset,
  };
});
