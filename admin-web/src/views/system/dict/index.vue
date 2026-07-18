<script setup lang="ts">
import { ref, h } from "vue";
import { message, Popconfirm } from "ant-design-vue";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons-vue";
import STable from "@/components/STable/index.vue";
import type { Column } from "@/types";
import * as dictApi from "@/api/dict";
import DictTypeFormModal from "./components/DictTypeFormModal.vue";
import DictDataFormModal from "./components/DictDataFormModal.vue";

defineOptions({ name: "SystemDict" });

// ============ 左侧：字典类型 ============
const typeList = ref<any[]>([]);
const typeLoading = ref(false);
const selectedType = ref<any>(null);
const typeModalVisible = ref(false);
const editingType = ref<any>(null);
const typeModalTitle = ref("新增字典类型");

async function loadTypes() {
  typeLoading.value = true;
  try {
    const res: any = await dictApi.getAll();
    typeList.value = res || [];
  } finally { typeLoading.value = false; }
}

function selectType(type: any) {
  selectedType.value = type;
  setTimeout(() => dataTableRef.value?.loadData(), 50);
}

function handleAddType() {
  editingType.value = null;
  typeModalTitle.value = "新增字典类型";
  typeModalVisible.value = true;
}

function handleEditType(record: any) {
  editingType.value = record;
  typeModalTitle.value = "编辑字典类型";
  typeModalVisible.value = true;
}

async function handleDeleteType(record: any) {
  try {
    await dictApi.removeType(record.id);
    message.success("删除成功");
    if (selectedType.value?.id === record.id) selectedType.value = null;
    loadTypes();
  } catch { }
}

function handleTypeSuccess() {
  typeModalVisible.value = false;
  loadTypes();
}

// ============ 右侧：字典数据 ============
const dataTableRef = ref<InstanceType<typeof STable> | null>(null);
const dataModalVisible = ref(false);
const editingData = ref<any>(null);
const dataModalTitle = ref("新增字典数据");

const dataColumns: Column[] = [
  { title: "标签", dataIndex: "label", width: 150 },
  { title: "值", dataIndex: "value", width: 150 },
  { title: "排序", dataIndex: "sort", width: 80 },
  { title: "状态", dataIndex: "status", width: 80,
    customRender: ({ text }: any) => h("a-tag", { color: text === 1 ? "green" : "red" }, text === 1 ? "启用" : "禁用") },
  { title: "元数据", dataIndex: "remark", width: 120, ellipsis: true },
  { title: "操作", dataIndex: "_action", key: "_action", width: 140, fixed: "right" },
];

const dataApi = (params: any) => {
  if (!selectedType.value?.id) return Promise.resolve({ list: [], total: 0, page: 1, pageSize: 10 });
  return dictApi.getDataList({ ...params, dictTypeId: selectedType.value.id });
};

function handleAddData() {
  if (!selectedType.value) { message.warning("请先选择字典类型"); return; }
  editingData.value = null;
  dataModalTitle.value = "新增字典数据";
  dataModalVisible.value = true;
}

function handleEditData(record: any) {
  editingData.value = { ...record, dictTypeId: selectedType.value?.id };
  dataModalTitle.value = "编辑字典数据";
  dataModalVisible.value = true;
}

async function handleDeleteData(record: any) {
  try {
    await dictApi.removeData(record.id);
    message.success("删除成功");
    dataTableRef.value?.refresh();
  } catch { }
}

function handleDataSuccess() {
  dataModalVisible.value = false;
  dataTableRef.value?.refresh();
  loadTypes();
}

loadTypes();
</script>

<template>
  <div class="dict-page">
    <a-card :bordered="false" :body-style="{ padding: 0 }">
      <div class="dict-layout">
        <div class="dict-left">
          <div class="left-header">
            <span class="left-title">字典类型</span>
            <a-button type="primary" size="small" @click="handleAddType"><PlusOutlined /></a-button>
          </div>
          <div class="left-list">
            <a-spin :spinning="typeLoading">
              <div v-if="typeList.length === 0" class="empty-tip">暂无字典类型</div>
              <div v-for="t in typeList" :key="t.code" class="type-item" :class="{ active: selectedType?.code === t.code }" @click="selectType(t)">
                <div class="type-info">
                  <div class="type-name">{{ t.name }}</div>
                  <div class="type-code">{{ t.code }}</div>
                </div>
                <div class="type-actions" @click.stop>
                  <a-button type="link" size="small" @click="handleEditType(t)"><EditOutlined /></a-button>
                  <Popconfirm title="确定删除？" @confirm="handleDeleteType(t)">
                    <a-button type="link" size="small" danger><DeleteOutlined /></a-button>
                  </Popconfirm>
                </div>
              </div>
            </a-spin>
          </div>
        </div>
        <div class="dict-right">
          <div v-if="!selectedType" class="empty-right">请选择左侧字典类型</div>
          <template v-else>
            <div class="right-header">
              <span class="right-title">{{ selectedType.name }}（{{ selectedType.code }}）</span>
              <a-tag color="blue" style="margin-left:8px">{{ selectedType.items?.length || 0 }} 项</a-tag>
            </div>
            <STable ref="dataTableRef" :columns="dataColumns" :api="dataApi" :show-index="true" :show-toolbar="true">
              <template #toolbar>
                <a-button type="primary" @click="handleAddData"><PlusOutlined /> 新增数据</a-button>
              </template>
              <template #action="{ record }">
                <a-space>
                  <a @click="handleEditData(record)">编辑</a>
                  <Popconfirm title="确定删除？" @confirm="handleDeleteData(record)">
                    <a style="color:#ff4d4f">删除</a>
                  </Popconfirm>
                </a-space>
              </template>
            </STable>
          </template>
        </div>
      </div>
    </a-card>
    <DictTypeFormModal v-model:visible="typeModalVisible" :title="typeModalTitle" :record="editingType" @success="handleTypeSuccess" />
    <DictDataFormModal v-model:visible="dataModalVisible" :title="dataModalTitle" :record="editingData" :dict-type-id="selectedType?.id" @success="handleDataSuccess" />
  </div>
</template>

<style scoped lang="less">
.dict-page { height: calc(100vh - 112px); }
.dict-layout { display: flex; height: 100%; }
.dict-left { width: 260px; min-width: 260px; border-right: 1px solid #f0f0f0; display: flex; flex-direction: column; }
.left-header, .right-header { display: flex; align-items: center; padding: 12px 16px; border-bottom: 1px solid #f0f0f0; font-weight: 600; }
.left-title { flex: 1; font-size: 14px; }
.left-list { flex: 1; overflow-y: auto; padding: 4px 0; }
.empty-tip { text-align: center; color: #999; padding: 24px; }
.type-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; cursor: pointer; transition: background .15s; border-left: 3px solid transparent; }
.type-item:hover { background: #f5f5f5; }
.type-item.active { background: #e6f4ff; border-left-color: #1677ff; }
.type-info { flex: 1; min-width: 0; }
.type-name { font-size: 14px; color: rgba(0,0,0,.85); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.type-code { font-size: 12px; color: #999; margin-top: 2px; }
.type-actions { display: none; }
.type-item:hover .type-actions { display: flex; gap: 2px; }
.dict-right { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.empty-right { flex: 1; display: flex; align-items: center; justify-content: center; color: #999; font-size: 14px; }
.right-header .right-title { font-size: 14px; }
</style>
