<script setup lang="ts">
import { ref, onMounted, h, computed } from "vue";
import { message } from "ant-design-vue";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons-vue";
import STable from "@/components/STable/index.vue";
import SFormModal from "@/components/SFormModal/index.vue";
import SFileSpace from "@/components/SFileSpace/index.vue";
import type { Column, SearchField, FormField } from "@/types";
import type { FileRecord } from "@/api/file";
import * as productApi from "@/api/product";
import { useDict } from "@/composables/useDict";

defineOptions({ name: "ProductList" });

const { loadDict, getLabel, getOptions } = useDict();

const tableRef = ref<InstanceType<typeof STable> | null>(null);
const modalVisible = ref(false);
const modalTitle = ref("新增商品");
const editingRecord = ref<any>(null);
const filePickerVisible = ref(false);

const columns: Column[] = [
  { title: "名称", dataIndex: "name", width: 50, ellipsis: true },
  {
    title: "封面图片",
    dataIndex: "coverImage",
    width: 100,
    customRender: ({ text }: any) =>
      h("img", { src: text, alt: "封面图片", width: 30, height: 30 }),
  },
  {
    title: "价格(元)",
    dataIndex: "price",
    width: 100,
    customRender: ({ text }: any) => (text / 100).toFixed(2),
  },
  { title: "库存", dataIndex: "stock", width: 80 },
  {
    title: "状态",
    dataIndex: "status",
    width: 80,
    customRender: ({ text }: any) =>
      h(
        "a-tag",
        { color: text === 1 ? "green" : "red" },
        getLabel("SYS_ENABLE", text),
      ),
  },
  { title: "创建时间", dataIndex: "createdAt", width: 170 },
  { title: "操作", dataIndex: "_action", key: "_action", width: 180 },
];

const searchFields = computed<SearchField[]>(() => [
  { label: "名称", name: "keyword", type: "input" },
  {
    label: "状态",
    name: "status",
    type: "select",
    options: getOptions("SYS_ENABLE"),
  },
]);

const fields = computed<FormField[]>(() => [
  { label: "名称", name: "name", type: "input", required: true, span: 12 },
  {
    label: "封面图片",
    name: "coverImage",
    type: "imagePicker",
    multiple: false,
    maxCount: 1,
  },
  {
    label: "图片",
    name: "images",
    type: "imagePicker",
    multiple: true,
    maxCount: 9,
    transformLoad: (val) => (val ? JSON.parse(val) : []), // '["a","b"]' → ["a","b"]
    transformSave: (val) => JSON.stringify(val), // ["a","b"] → '["a","b"]'
  },
  {
    label: "价格",
    name: "price",
    type: "inputNumber",
    required: true,
    min: 0.01,
    transformSave: (val) => val * 100,
    transformLoad: (val) => val / 100,
    span: 12,
  },
  {
    label: "库存",
    name: "stock",
    type: "inputNumber",
    min: 1,
    span: 12,
  },
  {
    label: "排序",
    name: "sort",
    type: "inputNumber",
    min: 0,
    span: 12,
  },
  {
    label: "描述",
    name: "description",
    type: "editor",
    span: 24,
    editorHeight: 300,
    editorPlaceholder: "请输入商品描述...",
  },
  {
    label: "状态",
    name: "status",
    type: "radio",
    span: 12,
    required: true,
    options: getOptions("SYS_ENABLE"),
    transformLoad(value) {
      return value.toString();
    },
  },
]);

async function submitApi(values: any) {
  if (editingRecord.value?.id) {
    await productApi.update(editingRecord.value.id, values);
  } else {
    await productApi.create(values);
  }
}

function handleAdd() {
  editingRecord.value = null;
  modalTitle.value = "新增商品";
  modalVisible.value = true;
}
function handleEdit(record: any) {
  editingRecord.value = record;
  modalTitle.value = "编辑商品";
  modalVisible.value = true;
}
async function handleDelete(record: any) {
  try {
    await productApi.remove(record.id);
    message.success("删除成功");
    tableRef.value?.refresh();
  } catch (e: any) {}
}
function handleCoverSelected(files: FileRecord | FileRecord[]) {
  const f = Array.isArray(files) ? files[0] : files;
  if (editingRecord.value) editingRecord.value.coverImage = f.url;
  filePickerVisible.value = false;
}

onMounted(async () => {
  await loadDict("SYS_ENABLE");
});
</script>

<template>
  <div>
    <STable
      show-export
      ref="tableRef"
      title="商品管理"
      :columns="columns"
      :api="productApi.getList"
      :search-fields="searchFields"
      :show-index="true"
    >
      <template #toolbar>
        <a-button type="primary" @click="handleAdd"
          ><PlusOutlined /> 新增商品</a-button
        >
      </template>
      <template #action="{ record }">
        <a-space>
          <a @click="handleEdit(record)"><EditOutlined /> 编辑</a>
          <a-popconfirm title="确认删除？" @confirm="handleDelete(record)">
            <a style="color: #ff4d4f"><DeleteOutlined /> 删除</a>
          </a-popconfirm>
        </a-space>
      </template>
    </STable>

    <SFormModal
      :visible="modalVisible"
      :title="modalTitle"
      :fields="fields"
      :api="submitApi"
      :width="1000"
      :record="editingRecord"
      @update:visible="(v) => (modalVisible = v)"
      @success="
        tableRef?.refresh();
        modalVisible = false;
      "
    />
  </div>
</template>
