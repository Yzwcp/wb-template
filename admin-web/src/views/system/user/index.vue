<script setup lang="ts">
import { ref, onMounted, h, computed } from "vue";
import { message, Popconfirm } from "ant-design-vue";
import { PlusOutlined } from "@ant-design/icons-vue";
import STable from "@/components/STable/index.vue";
import type { Column, SearchField } from "@/types";
import * as userApi from "@/api/user";
import dayjs from "dayjs";
import UserFormModal from "./components/UserFormModal.vue";
import { useDict } from "@/composables/useDict";

defineOptions({ name: "SystemUser" });

const { loadDict, getLabel, getOptions } = useDict();

const tableRef = ref<InstanceType<typeof STable> | null>(null);
const modalVisible = ref(false);
const editingRecord = ref<any>(null);
const modalTitle = ref("新增用户");

const columns: Column[] = [
  {
    title: "头像",
    dataIndex: "avatar",
    width: 60,
    customRender: ({ text }) =>
      text
        ? h("img", {
            src: text,
            style: "width:32px;height:32px;border-radius:50%;object-fit:cover",
          })
        : h("span", { style: "color:#ccc" }, "-"),
  },
  { title: "用户名", dataIndex: "username", width: 120 },
  { title: "昵称", dataIndex: "nickname", width: 120 },
  { title: "邮箱", dataIndex: "email", width: 180, ellipsis: true },
  { title: "手机号", dataIndex: "phone", width: 130 },
  {
    title: "状态",
    dataIndex: "status",
    width: 80,
    dictCode: "SYS_ENABLE",
  },
  {
    title: "创建时间",
    dataIndex: "createdAt",
    width: 170,
  },
  {
    title: "操作",
    dataIndex: "_action",
    key: "_action",
    width: 220,
    fixed: "right",
  },
];

const searchFields = computed<SearchField[]>(() => [
  { label: "用户名", name: "username", type: "input" },
  {
    label: "状态",
    name: "status",
    type: "select",
    options: getOptions("SYS_ENABLE"),
  },
  { label: "日期", name: "dateRange", type: "dateRange" },
]);

function handleAdd() {
  editingRecord.value = null;
  modalTitle.value = "新增用户";
  modalVisible.value = true;
}

function handleEdit(record: any) {
  editingRecord.value = { ...record };
  modalTitle.value = "编辑用户";
  modalVisible.value = true;
}

async function handleToggleStatus(record: any) {
  try {
    const newStatus = record.status === "1" ? "2" : "1";
    await userApi.updateStatus(record.id, newStatus);
    message.success("状态更新成功");
    tableRef.value?.refresh();
  } catch (err: any) {
  }
}

async function handleDelete(record: any) {
  try {
    await userApi.remove(record.id);
    message.success("删除成功");
    tableRef.value?.refresh();
  } catch (err: any) {
  }
}

function handleModalSuccess() {
  modalVisible.value = false;
  tableRef.value?.refresh();
}

onMounted(async () => {
  await loadDict("SYS_ENABLE");
});
</script>

<template>
  <div class="system-user">
    <STable
      ref="tableRef"
      title="用户管理"
      :columns="columns"
      :api="userApi.getList"
      :search-fields="searchFields"
      :show-index="true"
    >
      <template #toolbar>
        <a-button type="primary" @click="handleAdd">
          <PlusOutlined />
          新增用户
        </a-button>
      </template>

      <template #action="{ record }">
        <a-space>
          <a @click="handleEdit(record)">编辑</a>
          <a @click="handleToggleStatus(record)">
            {{ getLabel("SYS_ENABLE", record.status === "1" ? "2" : "1") }}
          </a>
          <Popconfirm
            title="确定要删除该用户吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleDelete(record)"
          >
            <a style="color: #ff4d4f">删除</a>
          </Popconfirm>
        </a-space>
      </template>
    </STable>

    <UserFormModal
      v-model:visible="modalVisible"
      :title="modalTitle"
      :record="editingRecord"
      @success="handleModalSuccess"
    />
  </div>
</template>
