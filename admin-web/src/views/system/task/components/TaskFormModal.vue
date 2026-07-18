<script setup lang="ts">
import SFormModal from '@/components/SFormModal/index.vue'
import type { FormField } from '@/types'
import * as taskApi from '@/api/task'

defineOptions({ name: 'TaskFormModal' })

const props = defineProps<{
  visible: boolean
  title: string
  record: any | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'success'): void
}>()

const fields: FormField[] = [
  { label: '任务名称', name: 'name', type: 'input', required: true, span: 12 },
  { label: 'Cron表达式', name: 'cronExpression', type: 'input', required: true, span: 12, placeholder: '如：0 0 * * *' },
  { label: '处理器', name: 'handler', type: 'input', required: true, span: 24 },
  {
    label: '状态',
    name: 'status',
    type: 'radio',
    required: true,
    span: 12,
    options: [
      { label: '停止', value: 0 },
      { label: '运行中', value: 1 },
    ],
  },
  { label: '参数(JSON)', name: 'params', type: 'textarea', span: 24, placeholder: 'JSON格式参数' },
]

async function submitApi(values: any) {
  if (props.record) {
    await taskApi.update(props.record.id, values)
  } else {
    await taskApi.create(values)
  }
}

function handleSuccess() {
  emit('success')
}
</script>

<template>
  <SFormModal
    :visible="visible"
    :title="title"
    :fields="fields"
    :api="submitApi"
    :record="record"
    @update:visible="(val: boolean) => emit('update:visible', val)"
    @success="handleSuccess"
  />
</template>
