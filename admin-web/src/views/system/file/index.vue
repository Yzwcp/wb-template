<script setup lang="ts">
import { ref } from 'vue'
import { message, Popconfirm } from 'ant-design-vue'
import { UploadOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import STable from '@/components/STable/index.vue'
import SFileSpace from '@/components/SFileSpace/index.vue'
import type { Column, SearchField } from '@/types'
import type { FileRecord } from '@/api/file'
import * as fileApi from '@/api/file'

defineOptions({ name: 'SystemFile' })

const tableRef = ref<InstanceType<typeof STable> | null>(null)
const fileSpaceVisible = ref(false)

const columns: Column[] = [
  { title: '原始文件名', dataIndex: 'originalName', width: 200, ellipsis: true },
  { title: 'URL', dataIndex: 'url', width: 250, ellipsis: true },
  { title: 'MIME类型', dataIndex: 'mimeType', width: 150 },
  {
    title: '大小', dataIndex: 'size', width: 100,
    customRender: ({ text }) => formatFileSize(text),
  },
  { title: '存储方式', dataIndex: 'storageType', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', width: 170 },
  { title: '操作', dataIndex: '_action', key: '_action', width: 180, fixed: 'right' },
]

const searchFields: SearchField[] = [
  { label: '文件名', name: 'keyword', type: 'input' },
]

function formatFileSize(bytes: number | string): string {
  if (!bytes || bytes === 0) return '0 B'
  const b = typeof bytes === 'string' ? parseInt(bytes) : bytes
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0, val = b
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++ }
  return val.toFixed(2) + ' ' + units[i]
}

/** 文件空间上传后刷新 */
function onFileSpaceConfirm(files: FileRecord | FileRecord[]) {
  fileSpaceVisible.value = false
  tableRef.value?.refresh()
}

function handleDownload(record: any) {
  window.open(record.url, '_blank')
}

async function handleDelete(record: any) {
  try {
    await fileApi.removeFile(record.id)
    message.success('删除成功')
    tableRef.value?.refresh()
  } catch (err: any) {
  }
}
</script>

<template>
  <div class="system-file">
    <STable
      ref="tableRef"
      title="文件管理"
      :columns="columns"
      :api="fileApi.getList"
      :search-fields="searchFields"
      :show-index="true"
    >
      <template #toolbar>
        <a-button type="primary" @click="fileSpaceVisible = true">
          <UploadOutlined /> 上传文件
        </a-button>
      </template>

      <template #action="{ record }">
        <a-space>
          <a @click="handleDownload(record)"><DownloadOutlined /> 下载</a>
          <Popconfirm
            title="确定要删除该文件吗？"
            ok-text="确定" cancel-text="取消"
            @confirm="handleDelete(record)"
          >
            <a style="color: #ff4d4f"><DeleteOutlined /> 删除</a>
          </Popconfirm>
        </a-space>
      </template>
    </STable>

    <SFileSpace
      v-model:visible="fileSpaceVisible"
      :multiple="true"
      @confirm="onFileSpaceConfirm"
    />
  </div>
</template>
