<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { message } from "ant-design-vue";
import type { Column } from "@/types";

defineOptions({ name: "SSearchBar" });

interface SearchFieldOption {
  label: string;
  name: string;
  type: "input" | "select" | "date" | "dateRange" | "switch";
  options?: { label: string; value: any }[];
  placeholder?: string;
  span?: number;
}

const props = withDefaults(
  defineProps<{
    fields: SearchFieldOption[];
    collapsed?: boolean;
    loading?: boolean;
  }>(),
  { collapsed: false, loading: false },
);

const emit = defineEmits<{
  (e: "search", values: Record<string, any>): void;
  (e: "reset"): void;
}>();

const formModel = ref<Record<string, any>>({});
const expanded = ref(false);

const displayFields = computed(() => {
  if (props.fields.length <= 3 || !props.collapsed || expanded.value) {
    return props.fields;
  }
  return props.fields.slice(0, 3);
});

const showExpand = computed(() => props.collapsed && props.fields.length > 3);

function initForm() {
  const model: Record<string, any> = {};
  props.fields.forEach((f) => {
    if (f.type === "dateRange") {
      model[f.name] = [];
    } else {
      model[f.name] = undefined;
    }
  });
  formModel.value = model;
}

initForm();

function handleSearch() {
  const values: Record<string, any> = {};
  props.fields.forEach((f) => {
    const val = formModel.value[f.name];
    if (
      val !== undefined &&
      val !== null &&
      val !== "" &&
      !(Array.isArray(val) && val.length === 0)
    ) {
      if (f.type === "dateRange" && Array.isArray(val)) {
        values[f.name + "Start"] = val[0];
        values[f.name + "End"] = val[1];
      } else {
        values[f.name] = val;
      }
    }
  });
  emit("search", values);
}

function handleReset() {
  initForm();
  emit("reset");
}

function toggleExpand() {
  expanded.value = !expanded.value;
}
</script>

<template>
  <div class="s-search-bar">
    <a-row :gutter="[16, 16]">
      <a-col
        v-for="field in displayFields"
        :key="field.name"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
        :xl="6"
      >
        <div class="search-item">
          <label class="search-label">{{ field.label }}</label>
          <!-- input -->
          <a-input
            v-if="field.type === 'input'"
            v-model:value="formModel[field.name]"
            :placeholder="field.placeholder || '请输入' + field.label"
            allow-clear
            @press-enter="handleSearch"
          />
          <!-- select -->
          <a-select
            v-else-if="field.type === 'select'"
            v-model:value="formModel[field.name]"
            :placeholder="field.placeholder || '请选择' + field.label"
            allow-clear
            :options="field.options"
            style="width: 100%"
          />
          <!-- date -->
          <a-date-picker
            v-else-if="field.type === 'date'"
            v-model:value="formModel[field.name]"
            :placeholder="field.placeholder || '请选择日期'"
            style="width: 100%"
          />
          <!-- dateRange -->
          <a-range-picker
            v-else-if="field.type === 'dateRange'"
            v-model:value="formModel[field.name]"
            style="width: 100%"
          />
        </div>
      </a-col>
    </a-row>
    <div class="search-actions">
      <a-button type="primary" :loading="loading" @click="handleSearch"
        >查询</a-button
      >
      <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
      <a
        v-if="showExpand"
        style="margin-left: 12px; font-size: 13px"
        @click="toggleExpand"
      >
        {{ expanded ? "收起" : "展开" }}
        <component :is="expanded ? 'UpOutlined' : 'DownOutlined'" />
      </a>
    </div>
  </div>
</template>

<style scoped lang="less">
.s-search-bar {
  padding-bottom: 0px;

  .search-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .search-label {
    white-space: nowrap;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.65);
    min-width: fit-content;
  }

  .search-actions {
    margin-top: 160x;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
}
</style>
