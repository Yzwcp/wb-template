<script setup lang="ts">
import { ref, shallowRef, onBeforeUnmount, watch } from "vue";
import { Boot } from "@wangeditor/editor";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import "@wangeditor/editor/dist/css/style.css";
import * as fileApi from "@/api/file";

defineOptions({ name: "SEditor" });

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    height?: number;
    placeholder?: string;
  }>(),
  {
    height: 300,
    placeholder: "请输入内容...",
  },
);
const emit = defineEmits<{ "update:modelValue": [val: string] }>();

const editorRef = shallowRef();

const html = ref(props.modelValue || "");

watch(
  () => props.modelValue,
  (val) => {
    if (val !== html.value) html.value = val || "";
  },
);

const mode = "default";

/** 自定义上传图片：OSS直传 */
const customUpload = async (file: File, insertFn: (url: string) => void) => {
  try {
    const { uploadUrl, fileUrl } = await fileApi.getUploadUrl(
      file.name,
      file.type,
    );
    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    await fileApi.saveFile({
      originalName: file.name,
      url: fileUrl,
      mimeType: file.type,
      size: file.size,
    });
    insertFn(fileUrl);
  } catch {
    // OSS 不可用时回退 base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      insertFn(base64);
      // 仍然保存到文件表
      fileApi
        .saveFile({
          originalName: file.name,
          url: base64.slice(0, 100),
          mimeType: file.type,
          size: file.size,
        })
        .catch(() => {});
    };
    reader.readAsDataURL(file);
  }
};

const editorConfig = {
  placeholder: props.placeholder,
  MENU_CONF: {
    uploadImage: {
      customUpload,
    },
  },
};

function handleCreated(editor: any) {
  editorRef.value = editor;
}

function handleChange(editor: any) {
  emit("update:modelValue", editor.getHtml());
}

onBeforeUnmount(() => {
  editorRef.value?.destroy();
  // toolbarRef.value?.destroy();
});
</script>

<template>
  <div
    class="s-editor"
    style="border: 1px solid #d9d9d9; border-radius: 6px; overflow: hidden"
  >
    <Toolbar
      :editor="editorRef"
      :default-config="{
        toolbarKeys: [
          'bold',
          'italic',
          'underline',
          'through',
          '|',
          'color',
          'bgColor',
          '|',
          'fontSize',
          'fontFamily',
          'lineHeight',
          '|',
          'bulletedList',
          'numberedList',
          '|',
          'justifyLeft',
          'justifyCenter',
          'justifyRight',
          '|',
          'insertImage',
          'uploadImage',
          'insertTable',
          '|',
          'undo',
          'redo',
        ],
      }"
      mode="default"
      style="border-bottom: 1px solid #f0f0f0"
    />
    <Editor
      :default-config="editorConfig"
      mode="default"
      v-model="html"
      :style="{ height: height + 'px' }"
      @onCreated="handleCreated"
      @onChange="handleChange"
    />
  </div>
</template>
