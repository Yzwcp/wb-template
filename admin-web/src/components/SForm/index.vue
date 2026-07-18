<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue";
import type { FormField, TreeNode } from "@/types";
import type { FileRecord } from "@/api/file";
import {
  UploadOutlined,
  PlusOutlined,
  EditOutlined,
  CloseOutlined,
} from "@ant-design/icons-vue";
import SFileSpace from "@/components/SFileSpace/index.vue";
import SEditor from "@/components/SEditor/index.vue";

defineOptions({ name: "SForm" });

const props = withDefaults(
  defineProps<{
    fields: FormField[];
    model: Record<string, any>;
    labelWidth?: number;
    cols?: number;
    disabled?: boolean;
  }>(),
  {
    labelWidth: 100,
    cols: 2,
    disabled: false,
  },
);

const formRef = ref<any>(null);
const localModel = reactive<Record<string, any>>({ ...props.model });

// Sync external model changes into local model
watch(
  () => props.model,
  (newVal) => {
    Object.assign(localModel, newVal);
  },
  { deep: true, immediate: true },
);

// --- imagePicker state ---
const activePickerField = ref<string>("");
const filePickerVisible = computed({
  get: () => activePickerField.value !== "",
  set: (v: boolean) => {
    if (!v) activePickerField.value = "";
  },
});

function openFilePicker(field: FormField) {
  activePickerField.value = field.name;
}

function getCurrentField(): FormField | undefined {
  return props.fields.find((f) => f.name === activePickerField.value);
}

function getImageUrl(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value.url) return value.url;
  return "";
}

function handleImageConfirm(files: FileRecord | FileRecord[]) {
  const field = getCurrentField();
  if (!field) return;

  if (field.multiple) {
    const newItems = (Array.isArray(files) ? files : [files]).map((f) => f.url);
    const existing: string[] = localModel[field.name] || [];
    const max = field.maxCount || 99;
    const merged = [...existing, ...newItems].slice(0, max);
    localModel[field.name] = merged;
  } else {
    const f = Array.isArray(files) ? files[0] : files;
    localModel[field.name] = f.url;
  }
  activePickerField.value = "";
}

function removeImage(field: FormField, index: number) {
  const arr: string[] = [...(localModel[field.name] || [])];
  arr.splice(index, 1);
  localModel[field.name] = arr;
}

function replaceImage(field: FormField) {
  openFilePicker(field);
}

// --- end imagePicker state ---

// Check if a field is visible
function isVisible(field: FormField): boolean {
  if (field.hidden) return !field.hidden(localModel);
  return true;
}

function isDisabled(field: FormField): boolean {
  if (props.disabled) return true;
  if (field.disabled) return field.disabled(localModel);
  return false;
}

function getColSpan(field: FormField): number {
  return field.span || 24 / props.cols;
}

const rulesMap = computed(() => {
  const map: Record<string, any[]> = {};
  props.fields.forEach((f) => {
    map[f.name] =
      f.rules ||
      (f.required ? [{ required: true, message: `请输入${f.label}` }] : []);
  });
  return map;
});

async function validate(): Promise<boolean> {
  try {
    await formRef.value?.validate();
    return true;
  } catch {
    return false;
  }
}

function resetFields() {
  formRef.value?.resetFields();
}

function getValues(): Record<string, any> {
  return { ...localModel };
}

function setValues(values: Record<string, any>) {
  Object.assign(localModel, values);
}

defineExpose({ validate, resetFields, getValues, setValues, formRef });
</script>

<template>
  <div class="s-form">
    <a-form
      ref="formRef"
      :model="localModel"
      :label-col="{ style: { width: labelWidth + 'px' } }"
      :rules="rulesMap"
    >
      <a-row :gutter="[16, 0]">
        <a-col
          v-for="field in fields"
          v-show="isVisible(field)"
          :key="field.name"
          :span="getColSpan(field)"
        >
          <a-form-item :name="field.name" :label="field.label">
            <!-- input -->
            <a-input
              v-if="field.type === 'input'"
              v-model:value="localModel[field.name]"
              :placeholder="field.placeholder || '请输入' + field.label"
              :disabled="isDisabled(field)"
              :allow-clear="field.allowClear !== false"
              v-bind="field.props"
            />
            <!-- password -->
            <a-input-password
              v-else-if="field.type === 'password'"
              v-model:value="localModel[field.name]"
              :placeholder="field.placeholder || '请输入' + field.label"
              :disabled="isDisabled(field)"
              :allow-clear="field.allowClear !== false"
              v-bind="field.props"
            />
            <!-- textarea -->
            <a-textarea
              v-else-if="field.type === 'textarea'"
              v-model:value="localModel[field.name]"
              :placeholder="field.placeholder || '请输入' + field.label"
              :disabled="isDisabled(field)"
              :rows="4"
              v-bind="field.props"
            />
            <!-- select -->
            <a-select
              v-else-if="field.type === 'select'"
              v-model:value="localModel[field.name]"
              :placeholder="field.placeholder || '请选择' + field.label"
              :disabled="isDisabled(field)"
              :options="field.options"
              :allow-clear="field.allowClear !== false"
              style="width: 100%"
              v-bind="field.props"
            />
            <!-- radio -->
            <a-radio-group
              v-else-if="field.type === 'radio'"
              v-model:value="localModel[field.name]"
              :disabled="isDisabled(field)"
              v-bind="field.props"
            >
              <a-radio
                v-for="opt in field.options"
                :key="opt.value"
                :value="opt.value"
                >{{ opt.label }}</a-radio
              >
            </a-radio-group>
            <!-- checkbox -->
            <a-checkbox-group
              v-else-if="field.type === 'checkbox'"
              v-model:value="localModel[field.name]"
              :disabled="isDisabled(field)"
              :options="field.options"
              v-bind="field.props"
            />
            <!-- switch -->
            <a-switch
              v-else-if="field.type === 'switch'"
              v-model:checked="localModel[field.name]"
              :disabled="isDisabled(field)"
              v-bind="field.props"
            />
            <!-- datePicker -->
            <a-date-picker
              v-else-if="field.type === 'date'"
              v-model:value="localModel[field.name]"
              :placeholder="field.placeholder || '请选择日期'"
              :disabled="isDisabled(field)"
              style="width: 100%"
              v-bind="field.props"
            />
            <!-- dateRange -->
            <a-range-picker
              v-else-if="field.type === 'dateRange'"
              v-model:value="localModel[field.name]"
              :disabled="isDisabled(field)"
              style="width: 100%"
              v-bind="field.props"
            />
            <!-- inputNumber -->
            <a-input-number
              v-else-if="field.type === 'inputNumber'"
              v-model:value="localModel[field.name]"
              :placeholder="field.placeholder || '请输入' + field.label"
              :disabled="isDisabled(field)"
              :min="field.min"
              :max="field.max"
              style="width: 100%"
              v-bind="field.props"
            />
            <!-- treeSelect -->
            <a-tree-select
              v-else-if="field.type === 'treeSelect'"
              v-model:value="localModel[field.name]"
              :placeholder="field.placeholder || '请选择' + field.label"
              :disabled="isDisabled(field)"
              :tree-data="field.treeData"
              :allow-clear="field.allowClear !== false"
              tree-node-label-prop="label"
              tree-node-value-prop="value"
              tree-node-filter-prop="label"
              :field-names="{
                children: 'children',
                label: 'label',
                value: 'value',
              }"
              style="width: 100%"
              v-bind="field.props"
            />
            <!-- upload -->
            <a-upload
              v-else-if="field.type === 'upload'"
              v-bind="field.props"
              :disabled="isDisabled(field)"
            >
              <a-button :disabled="isDisabled(field)">
                <UploadOutlined />
                点击上传
              </a-button>
            </a-upload>

            <!-- imagePicker — single mode -->
            <div
              v-else-if="field.type === 'imagePicker' && !field.multiple"
              class="s-form-image-picker"
            >
              <div
                v-if="localModel[field.name]"
                class="image-picker-thumb has-image"
                @click="openFilePicker(field)"
              >
                <img :src="getImageUrl(localModel[field.name])" alt="" />
                <div class="image-picker-mask">
                  <EditOutlined />
                </div>
              </div>
              <div
                v-else
                class="image-picker-thumb empty"
                @click="openFilePicker(field)"
              >
                <PlusOutlined />
                <!-- <span class="tip-text">上传图片</span> -->
              </div>
            </div>

            <!-- imagePicker — multi mode -->
            <div
              v-else-if="field.type === 'imagePicker' && field.multiple"
              class="s-form-image-picker-multi"
            >
              <div
                v-for="(img, idx) in localModel[field.name] || []"
                :key="idx"
                class="image-picker-thumb has-image"
              >
                <img :src="getImageUrl(img)" alt="" />
                <div
                  class="image-picker-remove"
                  @click="removeImage(field, idx as number)"
                >
                  <CloseOutlined />
                </div>
              </div>
              <div
                v-if="
                  !localModel[field.name] ||
                  localModel[field.name].length < (field.maxCount || 99)
                "
                class="image-picker-thumb empty"
                @click="openFilePicker(field)"
              >
                <PlusOutlined />
                <!-- <span class="tip-text">添加图片</span> -->
              </div>
            </div>

            <!-- editor (wangEditor) -->
            <SEditor
              v-else-if="field.type === 'editor'"
              v-model="localModel[field.name]"
              :height="field.editorHeight ?? 300"
              :placeholder="field.editorPlaceholder ?? '请输入内容...'"
            />

            <!-- custom slot -->
            <slot
              v-else-if="field.type === 'custom'"
              :name="field.name"
              :field="field"
              :value="localModel[field.name]"
              :model="localModel"
            />
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>

    <!-- SFileSpace modal (shared by all imagePicker fields) -->
    <SFileSpace
      :visible="filePickerVisible"
      :multiple="getCurrentField()?.multiple ?? false"
      file-type="image"
      @update:visible="filePickerVisible = $event"
      @confirm="handleImageConfirm"
    />
  </div>
</template>

<style scoped lang="less">
.s-form {
  :deep(.ant-form-item) {
    margin-bottom: 16px;
  }
}

.s-form-image-picker,
.s-form-image-picker-multi {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.image-picker-thumb {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s;

  &.empty {
    border: 1px dashed #d9d9d9;
    background: #fafafa;
    color: #999;
    font-size: 13px;

    &:hover {
      border-color: #1677ff;
      color: #1677ff;
    }
  }

  &.has-image {
    border: 1px solid #e8e8e8;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .tip-text {
    font-size: 12px;
    margin-top: 4px;
  }

  .image-picker-mask {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 22px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &.has-image:hover .image-picker-mask {
    opacity: 1;
  }

  .image-picker-remove {
    position: absolute;
    top: -1px;
    right: -1px;
    width: 20px;
    height: 20px;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    border-radius: 0 6px 0 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    opacity: 0;
    transition: opacity 0.2s;

    &:hover {
      background: #ff4d4f;
    }
  }

  &.has-image:hover .image-picker-remove {
    opacity: 1;
  }
}
</style>
