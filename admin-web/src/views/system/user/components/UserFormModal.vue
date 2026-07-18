<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message } from "ant-design-vue";
import { PlusOutlined } from "@ant-design/icons-vue";
import SForm from "@/components/SForm/index.vue";
import SFileSpace from "@/components/SFileSpace/index.vue";
import type { FormField, TreeNode } from "@/types";
import type { FileRecord } from "@/api/file";
import * as userApi from "@/api/user";
import * as roleApi from "@/api/role";
import { useDict } from "@/composables/useDict";

defineOptions({ name: "UserFormModal" });

const { getOptions } = useDict();

const props = defineProps<{
  visible: boolean;
  title: string;
  record: any | null;
}>();

const emit = defineEmits<{
  "update:visible": [val: boolean];
  success: [];
}>();

const formRef = ref<InstanceType<typeof SForm> | null>(null);
const submitting = ref(false);
const roleTreeData = ref<TreeNode[]>([]);
const filePickerVisible = ref(false);
const avatar = ref("");

const formModel = ref<Record<string, any>>({
  username: "",
  nickname: "",
  email: "",
  phone: "",
  password: "",
  roleIds: [],
  status: "1",
});

const isEdit = computed(() => !!props.record?.id);

async function loadRoles() {
  try {
    const roles = await roleApi.getAll();
    roleTreeData.value = (roles || []).map((r: any) => ({
      id: r.id,
      label: r.name,
      value: r.id,
    }));
  } catch {
    /* ignore */
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      loadRoles();
      if (props.record) {
        formModel.value = {
          username: props.record.username || "",
          nickname: props.record.nickname || "",
          email: props.record.email || "",
          phone: props.record.phone || "",
          password: "",
          roleIds: props.record.roles?.map((r: any) => r.id) || [],
          status: props.record.status ?? "1",
          avatar: props.record.avatar || "",
        };
        avatar.value = props.record.avatar || "";
      } else {
        formModel.value = {
          username: "",
          nickname: "",
          email: "",
          phone: "",
          password: "",
          roleIds: [],
          status: "1",
        };
        avatar.value = "";
      }
    }
  },
);

const fields = computed<FormField[]>(() => [
  {
    label: "用户名",
    name: "username",
    type: "input",
    required: true,
    span: 12,
  },
  {
    name: "avatar",
    type: "imagePicker",
    label: "头像",
    span: 12,
  },
  { label: "昵称", name: "nickname", type: "input", required: true, span: 12 },
  { label: "邮箱", name: "email", type: "input", span: 12 },
  { label: "手机号", name: "phone", type: "input", span: 12 },
  {
    label: "密码",
    name: "password",
    type: "password",
    span: 12,
    hidden: () => isEdit.value,
  },
  {
    label: "角色",
    name: "roleIds",
    type: "treeSelect",
    span: 12,
    props: {
      multiple: true,
      treeCheckable: true,
      showCheckedStrategy: "SHOW_PARENT",
    },
    treeData: roleTreeData.value,
  },
  {
    label: "状态",
    name: "status",
    type: "radio",
    required: true,
    span: 12,
    options: getOptions("SYS_ENABLE"),
  },
]);

function onAvatarSelected(files: FileRecord | FileRecord[]) {
  const file = Array.isArray(files) ? files[0] : files;
  if (file) {
    avatar.value = file.url;
  }
  filePickerVisible.value = false;
}

async function handleSubmit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate();
  if (!valid) return;

  submitting.value = true;
  try {
    const values = formRef.value.getValues();
    const payload = { ...values };
    if (payload.roleIds) payload.roleIds = payload.roleIds.map(Number);
    if (isEdit.value) {
      await userApi.update(props.record.id, payload);
    } else {
      await userApi.create(payload);
    }
    message.success(isEdit.value ? "更新成功" : "创建成功");
    emit("success");
    emit("update:visible", false);
  } catch (err: any) {
  } finally {
    submitting.value = false;
  }
}

function handleCancel() {
  emit("update:visible", false);
}
</script>

<template>
  <a-modal
    :open="visible"
    :title="title"
    :width="840"
    :confirm-loading="submitting"
    @ok="handleSubmit"
    @cancel="handleCancel"
    destroy-on-close
  >
    <!-- 表单 -->
    <SForm ref="formRef" :fields="fields" :model="formModel" :cols="2" />
  </a-modal>
</template>

<style scoped lang="less">
.avatar-section {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;

  .avatar-label {
    width: 100px;
    text-align: right;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.85);
    flex-shrink: 0;
  }

  .avatar-picker {
    width: 80px;
    height: 80px;
    border: 1px dashed #d9d9d9;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: border-color 0.3s;

    &:hover {
      border-color: #1677ff;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #999;
    }
  }
}
</style>
