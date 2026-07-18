<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { UploadOutlined, InboxOutlined } from '@ant-design/icons-vue'
import type { UploadFile, UploadChangeParam } from 'ant-design-vue'
import axios from 'axios'
import { getToken } from '@/utils/token'

defineOptions({ name: 'SUpload' })

const props = withDefaults(
  defineProps<{
    maxCount?: number
    maxSize?: number // bytes
    accept?: string
    uploadUrl?: string
    multiple?: boolean
  }>(),
  {
    maxCount: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: '*',
    uploadUrl: '/api/file/upload',
    multiple: false,
  },
)

const emit = defineEmits<{
  (e: 'success', fileInfo: any): void
}>()

const fileList = ref<UploadFile[]>([])
const uploading = ref(false)

const headers = {
  Authorization: `Bearer ${getToken()}`,
}

function beforeUpload(file: File) {
  // Size validation
  const isLt = file.size <= props.maxSize
  if (!isLt) {
    message.error(`文件大小不能超过 ${(props.maxSize / 1024 / 1024).toFixed(0)}MB`)
    return false
  }

  // Type validation
  if (props.accept !== '*') {
    const acceptTypes = props.accept.split(',').map((t) => t.trim())
    const isAccepted = acceptTypes.some((type) => {
      if (type.startsWith('.')) return file.name.endsWith(type)
      if (type.includes('*')) {
        const [prefix] = type.split('/')
        return file.type.startsWith(prefix + '/')
      }
      return file.type === type
    })
    if (!isAccepted) {
      message.error(`不支持的文件类型，支持的类型：${props.accept}`)
      return false
    }
  }
  return true
}

function customRequest(options: any) {
  const formData = new FormData()
  formData.append('file', options.file)

  uploading.value = true
  axios
    .post(props.uploadUrl, formData, { headers })
    .then((res) => {
      const data = res.data
      // The interceptor unwraps data if code === 200
      const fileInfo = data?.data || data
      options.onSuccess(fileInfo, options.file)
      emit('success', fileInfo)
    })
    .catch((err) => {
      options.onError(err)
      message.error('上传失败')
    })
    .finally(() => {
      uploading.value = false
    })
}

function handleChange(info: UploadChangeParam) {
  fileList.value = info.fileList.slice(-props.maxCount)
}

function getAcceptString(): string {
  return props.accept || undefined as any
}
</script>

<template>
  <div class="s-upload">
    <a-upload-dragger
      v-if="maxCount > 1"
      v-model:file-list="fileList"
      :max-count="maxCount"
      :multiple="multiple"
      :accept="getAcceptString()"
      :before-upload="beforeUpload"
      :custom-request="customRequest"
      @change="handleChange"
    >
      <p class="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
      <p class="ant-upload-hint">
        支持单个或批量上传，单文件不超过{{ (maxSize / 1024 / 1024).toFixed(0) }}MB
      </p>
    </a-upload-dragger>

    <a-upload
      v-else
      v-model:file-list="fileList"
      :max-count="maxCount"
      :accept="getAcceptString()"
      :before-upload="beforeUpload"
      :custom-request="customRequest"
      @change="handleChange"
    >
      <a-button :loading="uploading">
        <UploadOutlined />
        点击上传
      </a-button>
      <template #itemRender="{ file }">
        <div v-if="file.status === 'done'" style="margin-top: 8px">
          <a-tag color="success">{{ file.name }}</a-tag>
        </div>
      </template>
    </a-upload>
  </div>
</template>
