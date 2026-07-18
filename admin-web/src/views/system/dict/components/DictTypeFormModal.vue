<script setup lang="ts">
import SFormModal from '@/components/SFormModal/index.vue'
import type { FormField } from '@/types'
import * as dictApi from '@/api/dict'
import { useDict } from '@/composables/useDict'

defineOptions({ name: 'DictTypeFormModal' })

const { getOptions } = useDict()

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
  { label: '字典名称', name: 'name', type: 'input', required: true, span: 12 },
  { label: '字典编码', name: 'code', type: 'input', required: true, span: 12 },
  {
    label: '状态',
    name: 'status',
    type: 'radio',
    required: true,
    span: 12,
    options: getOptions('SYS_ENABLE'),
  },
]

async function submitApi(values: any) {
  if (props.record) {
    await dictApi.updateType(props.record.id, values)
  } else {
    await dictApi.createType(values)
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
