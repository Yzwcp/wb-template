<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import type { UploadFile, UploadChangeParam } from 'ant-design-vue'
import axios from 'axios'
import { getToken } from '@/utils/token'

defineOptions({ name: 'SImageUpload' })

const props = withDefaults(
  defineProps<{
    maxCount?: number
    maxSize?: number // bytes
    accept?: string
    uploadUrl?: string
    fileList?: UploadFile[]
  }>(),
  {
    maxCount: 8,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: 'image/*',
    uploadUrl: '/api/file/upload',
    fileList: () => [],
  },
)

const emit = defineEmits<{
  (e: 'update:fileList', list: UploadFile[]): void
  (e: 'success', fileInfo: any): void
}>()

const innerFileList = ref<UploadFile[]>([...props.fileList])
const uploading = ref(false)

const headers = {
  Authorization: `Bearer ${getToken()}`,
}

function beforeUpload(file: File) {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    message.error('只能上传图片文件')
    return false
  }
  const isLt = file.size <= props.maxSize
  if (!isLt) {
    message.error(`图片大小不能超过 ${(props.maxSize / 1024 / 1024).toFixed(0)}MB`)
    return false
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
  innerFileList.value = info.fileList.slice(-props.maxCount)
  emit('update:fileList', innerFileList.value)
}

function handleRemove(file: UploadFile) {
  innerFileList.value = innerFileList.value.filter((f) => f.uid !== file.uid)
  emit('update:fileList', innerFileList.value)
}
</script>

<template>
  <div class="s-image-upload">
    <a-upload
      v-model:file-list="innerFileList"
      list-type="picture-card"
      :max-count="maxCount"
      :accept="accept"
      :before-upload="beforeUpload"
      :custom-request="customRequest"
      @change="handleChange"
      @remove="handleRemove"
    >
      <div v-if="innerFileList.length < maxCount">
        <PlusOutlined />
        <div style="margin-top: 8px">上传图片</div>
      </div>
    </a-upload>
    <div class="upload-tip">
      支持 jpg/png/gif/webp 格式，单张不超过{{ (maxSize / 1024 / 1024).toFixed(0) }}MB
    </div>
  </div>
</template>

<style scoped lang="less">
.s-image-upload {
  .upload-tip {
    margin-top: 8px;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
  }
}
</style>
