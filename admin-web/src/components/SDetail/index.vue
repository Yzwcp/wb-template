<script setup lang="ts">
import { useDict } from "@/composables/useDict";
import type { DetailField } from "@/types";

defineOptions({ name: "SDetail" });

const props = withDefaults(
  defineProps<{
    visible: boolean;
    title?: string;
    fields: DetailField[];
    record: Record<string, any> | null;
    width?: number;
    column?: number;
    size?: "default" | "middle" | "small";
    bordered?: boolean;
  }>(),
  { title: "详情", width: 920, column: 2, size: "small", bordered: true },
);

const emit = defineEmits<{
  "update:visible": [val: boolean];
}>();

const { getLabel } = useDict();

function getSpan(field: DetailField): number {
  return field.span || 1;
}
</script>

<template>
  <a-modal
    :open="visible"
    :title="title"
    :width="width"
    :footer="null"
    destroy-on-close
    @cancel="emit('update:visible', false)"
  >
    <a-descriptions
      v-if="record"
      :column="column"
      :size="size"
      :bordered="bordered"
    >
      <a-descriptions-item
        v-for="field in fields"
        :key="field.name"
        :label="field.label"
        :span="getSpan(field)"
      >
        <!-- image -->
        <template v-if="field.type === 'image'">
          <a-image
            v-if="record[field.name]"
            :src="record[field.name]"
            :width="60"
            :height="60"
            style="object-fit: cover; border-radius: 4px"
          />
          <span v-else>-</span>
        </template>

        <!-- html -->
        <div
          v-else-if="field.type === 'html'"
          v-html="record[field.name] || '-'"
          class="detail-html"
        />

        <!-- dict -->
        <template v-else-if="field.type === 'dict'">
          {{ getLabel(field.dictCode || "", record[field.name]) }}
        </template>

        <!-- custom -->
        <template v-else-if="field.type === 'custom'">
          {{
            field.customRender
              ? field.customRender(record[field.name], record)
              : record[field.name] || "-"
          }}
        </template>

        <!-- default -->
        <template v-else>
          {{
            record[field.name] !== undefined &&
            record[field.name] !== null &&
            record[field.name] !== ""
              ? record[field.name]
              : "-"
          }}
        </template>
      </a-descriptions-item>
    </a-descriptions>
    <a-empty v-else description="暂无数据" />
  </a-modal>
</template>

<style scoped lang="less">
.detail-html {
  :deep(img) {
    max-width: 200px;
    max-height: 100px;
    border-radius: 4px;
    margin: 2px;
  }
}
</style>
