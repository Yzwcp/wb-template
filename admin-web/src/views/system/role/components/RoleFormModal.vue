<script setup lang="ts">
import SFormModal from '@/components/SFormModal/index.vue'
import type { FormField } from '@/types'
import * as roleApi from '@/api/role'
import { useDict } from '@/composables/useDict'

defineOptions({ name: 'RoleFormModal' })

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
  { label: '角色名称', name: 'name', type: 'input', required: true, span: 12 },
  { label: '角色编码', name: 'code', type: 'input', required: true, span: 12 },
  { label: '描述', name: 'description', type: 'textarea', span: 24 },
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
    await roleApi.update(props.record.id, values)
  } else {
    await roleApi.create(values)
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
