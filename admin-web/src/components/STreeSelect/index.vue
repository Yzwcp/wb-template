<script setup lang="ts">
import { ref, watch } from 'vue'
import type { TreeNode } from '@/types'

defineOptions({ name: 'STreeSelect' })

const props = withDefaults(
  defineProps<{
    treeData: TreeNode[]
    multiple?: boolean
    modelValue?: any
    placeholder?: string
    disabled?: boolean
    allowClear?: boolean
  }>(),
  {
    multiple: false,
    modelValue: undefined,
    placeholder: '请选择',
    disabled: false,
    allowClear: true,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: any): void
}>()

const innerValue = ref(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    innerValue.value = val
  },
)

watch(innerValue, (val) => {
  emit('update:modelValue', val)
})

function convertTreeData(data: TreeNode[]): any[] {
  return data.map((item) => ({
    title: item.label,
    value: item.value,
    key: item.value,
    disabled: item.disabled,
    children: item.children ? convertTreeData(item.children) : undefined,
  }))
}

const antTreeData = ref(convertTreeData(props.treeData))

watch(
  () => props.treeData,
  (data) => {
    antTreeData.value = convertTreeData(data)
  },
  { deep: true },
)
</script>

<template>
  <a-tree-select
    v-model:value="innerValue"
    :tree-data="antTreeData"
    :multiple="multiple"
    :placeholder="placeholder"
    :disabled="disabled"
    :allow-clear="allowClear"
    style="width: 100%"
    tree-node-filter-prop="title"
    show-search
  />
</template>
