<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { message } from "ant-design-vue";
import SForm from "@/components/SForm/index.vue";
import type { FormField } from "@/types";

defineOptions({ name: "SFormModal" });

const props = withDefaults(
  defineProps<{
    visible: boolean;
    title: string;
    fields: FormField[];
    api: (values: any) => Promise<any>;
    record?: Record<string, any> | null;
    width?: number;
  }>(),
  {
    record: null,
    width: 640,
  },
);

const emit = defineEmits<{
  (e: "update:visible", val: boolean): void;
  (e: "cancel"): void;
  (e: "success", data: any): void;
}>();

const sFormRef = ref<InstanceType<typeof SForm> | null>(null);
const submitLoading = ref(false);
const formModel = ref<Record<string, any>>({});

function initModel() {
  const model: Record<string, any> = {};
  props.fields.forEach((f) => {
    if (f.type === "switch") {
      model[f.name] = true;
    } else if (f.type === "checkbox" || f.type === "treeSelect") {
      model[f.name] = [];
    } else if (f.type === "imagePicker" && f.multiple) {
      model[f.name] = [];
    } else {
      model[f.name] = undefined;
    }
  });
  // Merge record data
  if (props.record) {
    Object.keys(props.record).forEach((key) => {
      if (key in model || props.fields.some((f) => f.name === key)) {
        const field = props.fields.find((f) => f.name === key);
        const raw = props.record![key];
        model[key] = field?.transformLoad ? field.transformLoad(raw) : raw;
      }
    });
  }
  formModel.value = model;
}

watch(
  () => [props.visible, props.record],
  () => {
    if (props.visible) {
      initModel();
      nextTick(() => {
        sFormRef.value?.resetFields();
      });
    }
  },
  { immediate: false },
);

async function handleSubmit() {
  if (!sFormRef.value) return;
  const valid = await sFormRef.value.validate();
  if (!valid) return;

  submitLoading.value = true;
  try {
    const values = sFormRef.value.getValues();
    // Apply transformSave before submit
    props.fields.forEach((f) => {
      if (f.transformSave && f.name in values) {
        values[f.name] = f.transformSave(values[f.name]);
      }
    });
    const res = await props.api(values);
    message.success(props.record ? "更新成功" : "创建成功");
    emit("success", res);
    handleCancel();
  } catch (err: any) {
    message.error(err?.message || "操作失败");
  } finally {
    submitLoading.value = false;
  }
}

function handleCancel() {
  emit("update:visible", false);
  emit("cancel");
}
</script>

<template>
  <a-modal
    :open="visible"
    :title="title"
    :width="width"
    :confirm-loading="submitLoading"
    :destroy-on-close="true"
    :mask-closable="false"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <SForm
      ref="sFormRef"
      :fields="fields"
      :model="formModel"
      @openImagePicker="(name: string) => emit('openImagePicker' as any, name)"
    >
      <template v-for="(_, name) in $slots" :key="name" #[name]="scope">
        <slot :name="name" v-bind="scope" />
      </template>
    </SForm>
  </a-modal>
</template>
