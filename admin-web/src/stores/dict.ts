import { defineStore } from "pinia";
import { ref } from "vue";
import * as dictApi from "@/api/dict";

interface DictItem {
  label: string;
  value: string;
  remark?: string;
}

export const useDictStore = defineStore(
  "dict",
  () => {
    const loaded = ref(false);
    const loading = ref(false);
    const dictMap = ref<Record<string, DictItem[]>>({});

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
        // pinia-plugin-persistedstate 自动保存 dictMap
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
      // localStorage 中的 dictMap 由 pinia-plugin-persistedstate 同步清除
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
  },
  {
    persist: {
      key: "persist:dict",
      storage: localStorage,
      pick: ["dictMap"],
    },
  }
);
