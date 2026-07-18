<template>
  <wd-upload
    :file-list="fileList"
    :action="uploadUrl"
    :limit="limit"
    :disabled="disabled"
    :accept="accept"
    reupload
    :upload-method="customUpload"
    @success="handleSuccess"
    @remove="handleRemove"
  >
  </wd-upload>
</template>

<script setup>
import { ref, watch } from "vue";
import { useGlobalStore } from "@/store/global";
import { baseUrl } from "../utils/config";

const props = defineProps({
  modelValue: { type: String, default: "" },
  category: { type: String, required: true },
  disabled: { type: Boolean, default: false },
  limit: { type: Number, default: 1 },
  accept: { type: String, default: "image" },
  action: { type: String, default: "/wjapp/wjMobile/file/upload" },
  urlKey: { type: String, default: "url" },
});

const emit = defineEmits(["update:modelValue", "extraData"]);

const globalStore = useGlobalStore();
const fileList = ref([]);

const uploadUrl = baseUrl + props.action;

// modelValue 变化时同步到 fileList
watch(
  () => props.modelValue,
  (val) => {
    fileList.value = val ? [{ url: val, status: "success" }] : [];
  },
  { immediate: true },
);

// 自定义上传方法
function customUpload(file, formData, options) {
  const task = uni.uploadFile({
    url: uploadUrl,
    filePath: file.url,
    name: "file",
    formData: { category: props.category },
    header: { Token: globalStore.token || "" },
    success: (res) => {
      try {
        const result = JSON.parse(res.data);
        console.log(result);

        if (result.code === 200) {
          options.onSuccess(result, file, formData);
        } else {
          uni.showModal({
            title: "上传失败",
            content: result.msg || "上传失败",
            showCancel: false,
          });
          options.onError(result, file, formData);
        }
      } catch {
        options.onError({ msg: "解析失败" }, file, formData);
      }
    },
    fail: (err) => {
      options.onError(err, file, formData);
    },
  });
  task.onProgressUpdate((res) => {
    options.onProgress(res, file);
  });
  return task;
}

// 上传成功：提取 URL 写入 v-model
function handleSuccess(result) {
  console.log(result);
  let response = result.file.response;
  if (response && typeof response === "object" && !Array.isArray(response)) {
    // emit("update:modelValue", response[props.urlKey || "url"]);
    emit("extraData", response);
  } else {
    emit("update:modelValue", response[1]);
  }
}

// 移除图片
function handleRemove() {
  emit("update:modelValue", "");
}
</script>
