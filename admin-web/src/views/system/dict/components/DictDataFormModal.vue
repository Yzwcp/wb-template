<script setup lang="ts">
import SFormModal from '@/components/SFormModal/index.vue'
import type { FormField } from '@/types'
import * as dictApi from '@/api/dict'
import { useDict } from '@/composables/useDict'

defineOptions({ name: 'DictDataFormModal' })

const { getOptions } = useDict()

const props = defineProps<{
  visible: boolean
  title: string
  record: any | null
  dictTypeId?: number
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'success'): void
}>()

const fields: FormField[] = [
  { label: '标签', name: 'label', type: 'input', required: true, span: 12 },
  { label: '值', name: 'value', type: 'input', required: true, span: 12 },
  { label: '排序', name: 'sort', type: 'inputNumber', span: 6, min: 0 },
  {
    label: '状态', name: 'status', type: 'radio', required: true, span: 12,
    options: getOptions('SYS_ENABLE'),
  },
]

async function submitApi(values: any) {
  const typeId = props.record?.dictTypeId || props.dictTypeId
  const payload = { ...values, typeId }
  if (props.record?.id) {
    await dictApi.updateData(props.record.id, payload)
  } else {
    await dictApi.createData(payload)
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
