<script setup lang="ts">
import { ref } from 'vue'
import { message, Popconfirm } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import STable from '@/components/STable/index.vue'
import SFormModal from '@/components/SFormModal/index.vue'
import type { Column, FormField, SearchField } from '@/types'
import * as permissionApi from '@/api/permission'

defineOptions({ name: 'SystemPermission' })

const tableRef = ref<InstanceType<typeof STable> | null>(null)
const modalVisible = ref(false)
const editingRecord = ref<any>(null)
const modalTitle = ref('新增权限')

const columns: Column[] = [
  { title: '权限名称', dataIndex: 'name', width: 150 },
  { title: '权限编码', dataIndex: 'code', width: 200 },
  { title: '描述', dataIndex: 'description', width: 300, ellipsis: true },
  { title: '操作', dataIndex: '_action', key: '_action', width: 150, fixed: 'right' },
]

const searchFields: SearchField[] = [
  { label: '权限名称', name: 'name', type: 'input' },
  { label: '权限编码', name: 'code', type: 'input' },
]

const formFields: FormField[] = [
  { label: '权限名称', name: 'name', type: 'input', required: true, span: 12 },
  { label: '权限编码', name: 'code', type: 'input', required: true, span: 12 },
  { label: '描述', name: 'description', type: 'textarea', span: 24 },
]

function handleAdd() {
  editingRecord.value = null
  modalTitle.value = '新增权限'
  modalVisible.value = true
}

function handleEdit(record: any) {
  editingRecord.value = { ...record }
  modalTitle.value = '编辑权限'
  modalVisible.value = true
}

async function handleDelete(record: any) {
  try {
    await permissionApi.remove(record.id)
    message.success('删除成功')
    tableRef.value?.refresh()
  } catch (err: any) {
  }
}

async function submitApi(values: any) {
  if (editingRecord.value) {
    await permissionApi.update(editingRecord.value.id, values)
  } else {
    await permissionApi.create(values)
  }
}

function handleSuccess() {
  modalVisible.value = false
  tableRef.value?.refresh()
}
</script>

<template>
  <div class="system-permission">
    <STable
      ref="tableRef"
      title="权限管理"
      :columns="columns"
      :api="permissionApi.getList"
      :search-fields="searchFields"
      :show-index="true"
    >
      <template #toolbar>
        <a-button type="primary" @click="handleAdd">
          <PlusOutlined />
          新增权限
        </a-button>
      </template>

      <template #action="{ record }">
        <a-space>
          <a @click="handleEdit(record)">编辑</a>
          <Popconfirm
            title="确定要删除该权限吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleDelete(record)"
          >
            <a style="color: #ff4d4f">删除</a>
          </Popconfirm>
        </a-space>
      </template>
    </STable>

    <SFormModal
      :visible="modalVisible"
      :title="modalTitle"
      :fields="formFields"
      :api="submitApi"
      :record="editingRecord"
      @update:visible="modalVisible = $event"
      @success="handleSuccess"
    />
  </div>
</template>
