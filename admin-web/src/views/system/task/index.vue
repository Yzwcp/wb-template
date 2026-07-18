<script setup lang="ts">
import { ref, h } from 'vue'
import { message, Popconfirm } from 'ant-design-vue'
import { PlusOutlined, PlayCircleOutlined, PauseCircleOutlined, CaretRightOutlined } from '@ant-design/icons-vue'
import STable from '@/components/STable/index.vue'
import type { Column, SearchField } from '@/types'
import * as taskApi from '@/api/task'
import TaskFormModal from './components/TaskFormModal.vue'

defineOptions({ name: 'SystemTask' })

const tableRef = ref<InstanceType<typeof STable> | null>(null)
const modalVisible = ref(false)
const editingRecord = ref<any>(null)
const modalTitle = ref('新增任务')

const columns: Column[] = [
  { title: '任务名称', dataIndex: 'name', width: 150 },
  { title: 'Cron表达式', dataIndex: 'cronExpression', width: 150 },
  { title: '处理器', dataIndex: 'handler', width: 200, ellipsis: true },
  {
    title: '状态',
    dataIndex: 'status',
    width: 80,
    customRender: ({ text }) => {
      const statusMap: Record<number, { color: string; label: string }> = {
        0: { color: 'default', label: '停止' },
        1: { color: 'green', label: '运行中' },
        2: { color: 'orange', label: '暂停' },
      }
      const s = statusMap[text] || { color: 'default', label: '未知' }
      return h('a-tag', { color: s.color }, s.label)
    },
  },
  { title: '上次执行', dataIndex: 'lastRunTime', width: 170 },
  { title: '下次执行', dataIndex: 'nextRunTime', width: 170 },
  { title: '操作', dataIndex: '_action', key: '_action', width: 280, fixed: 'right' },
]

const searchFields: SearchField[] = [
  { label: '任务名称', name: 'name', type: 'input' },
  {
    label: '状态',
    name: 'status',
    type: 'select',
    options: [
      { label: '停止', value: 0 },
      { label: '运行中', value: 1 },
      { label: '暂停', value: 2 },
    ],
  },
]

function handleAdd() {
  editingRecord.value = null
  modalTitle.value = '新增任务'
  modalVisible.value = true
}

function handleEdit(record: any) {
  editingRecord.value = { ...record }
  modalTitle.value = '编辑任务'
  modalVisible.value = true
}

async function handleDelete(record: any) {
  try {
    await taskApi.remove(record.id)
    message.success('删除成功')
    tableRef.value?.refresh()
  } catch (err: any) {
  }
}

async function handleExecute(record: any) {
  try {
    await taskApi.execute(record.id)
    message.success('任务已执行')
    tableRef.value?.refresh()
  } catch (err: any) {
  }
}

async function handlePause(record: any) {
  try {
    await taskApi.pause(record.id)
    message.success('任务已暂停')
    tableRef.value?.refresh()
  } catch (err: any) {
  }
}

async function handleResume(record: any) {
  try {
    await taskApi.resume(record.id)
    message.success('任务已恢复')
    tableRef.value?.refresh()
  } catch (err: any) {
  }
}

function handleModalSuccess() {
  modalVisible.value = false
  tableRef.value?.refresh()
}
</script>

<template>
  <div class="system-task">
    <STable
      ref="tableRef"
      title="定时任务管理"
      :columns="columns"
      :api="taskApi.getList"
      :search-fields="searchFields"
      :show-index="true"
    >
      <template #toolbar>
        <a-button type="primary" @click="handleAdd">
          <PlusOutlined />
          新增任务
        </a-button>
      </template>

      <template #action="{ record }">
        <a-space>
          <a @click="handleEdit(record)">编辑</a>
          <a @click="handleExecute(record)"><PlayCircleOutlined /> 执行</a>
          <a v-if="record.status === 1" @click="handlePause(record)"><PauseCircleOutlined /> 暂停</a>
          <a v-if="record.status !== 1" @click="handleResume(record)"><CaretRightOutlined /> 恢复</a>
          <Popconfirm
            title="确定要删除该任务吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleDelete(record)"
          >
            <a style="color: #ff4d4f">删除</a>
          </Popconfirm>
        </a-space>
      </template>
    </STable>

    <TaskFormModal
      v-model:visible="modalVisible"
      :title="modalTitle"
      :record="editingRecord"
      @success="handleModalSuccess"
    />
  </div>
</template>
