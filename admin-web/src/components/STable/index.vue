<script setup lang="ts">
import {
  ref,
  reactive,
  onMounted,
  onUnmounted,
  computed,
  watch,
  useSlots,
} from "vue";
import { message } from "ant-design-vue";
import { DownloadOutlined } from "@ant-design/icons-vue";
import type { Column, SearchField } from "@/types";
import type { Dayjs } from "dayjs";
import SSearchBar from "@/components/SSearchBar/index.vue";
import { useDict } from "@/composables/useDict";
import { useDictStore } from "@/stores/dict";

defineOptions({ name: "STable" });

interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

const props = withDefaults(
  defineProps<{
    columns: Column[];
    api: (params: any) => Promise<PageResult<any>>;
    searchFields?: SearchField[];
    title?: string;
    rowKey?: string;
    showIndex?: boolean;
    showToolbar?: boolean;
    showExport?: boolean;
    pageSize?: number;
    resizable?: boolean;
    selectable?: boolean;
  }>(),
  {
    searchFields: () => [],
    title: "",
    rowKey: "id",
    showIndex: true,
    showToolbar: true,
    showExport: true,
    pageSize: 10,
    resizable: true,
    selectable: false,
  },
);

const emit = defineEmits<{
  (e: "search", values: Record<string, any>): void;
  (e: "select", keys: (string | number)[], rows: any[]): void;
}>();

const slots = useSlots();

const loading = ref(false);
const dataSource = ref<any[]>([]);
const currentSearchParams = ref<Record<string, any>>({});

// 行选择
const selectedRowKeys = ref<(string | number)[]>([]);
const selectedRows = ref<any[]>([]);

const rowSelection = computed(() => {
  if (!props.selectable) return undefined;
  return {
    type: "checkbox",
    selectedRowKeys: selectedRowKeys.value,
    onChange: (keys: (string | number)[], rows: any[]) => {
      selectedRowKeys.value = keys;
      selectedRows.value = rows;
      emit("select", keys, rows);
    },
  };
});

function clearSelection() {
  selectedRowKeys.value = [];
  selectedRows.value = [];
}

// ========== 导出 ==========
const { getLabel: getDictLabel } = useDict();
const dictStore = useDictStore();
const exporting = ref(false);

/** 解析嵌套路径，如 "user.nickname" → record.user?.nickname */
function getValueByPath(obj: any, path: string): any {
  if (!path || !obj) return obj;
  const parts = path.split(".");
  let val: any = obj;
  for (const p of parts) {
    if (val == null) return undefined;
    val = val[p];
  }
  return val;
}

/** 遍历所有已加载的字典，按 value 反向查找 label */
function tryFindDictLabel(value: any): string | null {
  if (value == null || value === "") return null;
  const strVal = String(value);
  for (const items of Object.values(dictStore.dictMap)) {
    if (!Array.isArray(items)) continue;
    const item = items.find((i: any) => String(i.value) === strVal);
    if (item) return item.label;
  }
  return null;
}

/** 从 Vue VNode 树中递归提取纯文本（支持图片、a-tag 等组件、函数子节点、插槽等） */
function extractVNodeText(vnode: any): string | null {
  if (vnode == null) return null;
  if (typeof vnode === "string") return vnode;
  if (typeof vnode === "number" || typeof vnode === "boolean")
    return String(vnode);
  if (Array.isArray(vnode)) {
    const parts: string[] = [];
    for (const child of vnode) {
      const t = extractVNodeText(child);
      if (t) parts.push(t);
    }
    return parts.length ? parts.join("") : null;
  }
  if (typeof vnode === "object") {
    // 1) 图片元素：跳过，不导出
    if (
      vnode.type === "img" ||
      (vnode.props && (vnode.props.src || vnode.props.alt))
    ) {
      return null;
    }

    const children = vnode.children;

    // 2) 字符串/数字子节点
    if (typeof children === "string") return children;
    if (typeof children === "number") return String(children);

    // 3) 函数子节点（如 h(Comp, props, () => '文本')、render 函数）
    if (typeof children === "function") {
      try {
        const result = extractVNodeText(children());
        if (result) return result;
      } catch {
        /* ignore */
      }
    }

    // 4) 数组子节点
    if (Array.isArray(children)) {
      return extractVNodeText(children);
    }

    // 5) 插槽对象 { default: fn, title: fn, ... }
    if (children && typeof children === "object") {
      for (const key of ["default", "title", "label", "text", "content"]) {
        if (typeof children[key] === "function") {
          try {
            const result = extractVNodeText(children[key]());
            if (result) return result;
          } catch {
            /* ignore */
          }
        }
      }
      // 也可能是单个 VNode
      const nested = extractVNodeText(children);
      if (nested) return nested;
    }

    // 6) 直接 text / innerHTML 属性
    if (typeof vnode.text === "string") return vnode.text;
    if (typeof vnode.innerHTML === "string") return vnode.innerHTML;

    // 7) 从 props 中提取文本属性（适配 a-tag 等组件的常见 prop）
    if (vnode.props) {
      for (const key of ["title", "label", "text", "content", "value"]) {
        if (typeof vnode.props[key] === "string") return vnode.props[key];
      }
    }
  }
  return null;
}

/** 获取单个单元格的导出文本 */
function getCellExportText(col: Column, record: any): string {
  // 1. exportFormatter — 手动指定
  if (col.exportFormatter) {
    return col.exportFormatter(record) ?? "";
  }

  const raw = getValueByPath(record, col.dataIndex);

  // 2. dictCode — 自动字典解析
  if (col.dictCode) {
    return raw != null ? getDictLabel(col.dictCode, raw) : "";
  }

  // 3. customRender — 渲染 VNode 并提取文本
  if (col.customRender) {
    try {
      const result = col.customRender({ text: raw, record, index: 0 });
      if (typeof result === "string") return result;
      if (typeof result === "number") return String(result);
      const extracted = extractVNodeText(result);
      if (extracted) return extracted;
    } catch {
      /* ignore */
    }
  }

  // 4. 反向字典匹配（无论是否有 customRender，兜底尝试字典映射）
  const dictMatch = tryFindDictLabel(raw);
  if (dictMatch) return dictMatch;

  // 5. 兜底：原始值
  if (raw == null || raw === "") return "";
  if (typeof raw === "number" || typeof raw === "string") return String(raw);
  if (typeof raw === "boolean") return raw ? "是" : "否";
  return JSON.stringify(raw);
}

/** 导出列（判定哪些列参与导出） */
const exportColumns = computed(() =>
  props.columns.filter((col) => {
    // 跳过操作列
    if (col.key === "_action") return false;
    // 跳过 # 序号列（内部自动添加的）
    if (col.dataIndex === "_index") return false;
    return true;
  }),
);

async function handleExport() {
  exporting.value = true;
  try {
    // 拉取全量数据（带上当前筛选条件）
    const res = await props.api({
      page: 1,
      pageSize: 99999,
      ...currentSearchParams.value,
    });
    const list = res.list || [];

    if (list.length === 0) {
      message.warning("没有可导出的数据");
      return;
    }

    const cols = exportColumns.value;
    // 表头
    const header = cols.map((c) => c.exportTitle || c.title);
    // 数据行
    const rows = list.map((record: any) =>
      cols.map((c) => escapeCsvField(getCellExportText(c, record))),
    );

    // 生成 CSV（BOM 保证 Excel 正确打开中文）
    const bom = "\uFEFF";
    const csvContent =
      bom +
      [header.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");

    // 触发下载
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filename = `${props.title || "导出"}_${new Date().toLocaleDateString("zh-CN").replace(/\//g, "-")}.csv`;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    message.success(`导出成功，共 ${list.length} 条`);
  } catch (err: any) {
    message.error(err?.message || "导出失败");
  } finally {
    exporting.value = false;
  }
}

function escapeCsvField(value: string): string {
  // 如果包含逗号、双引号、换行，需要用双引号包裹并转义内部双引号
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
const pagination = reactive({
  current: 1,
  pageSize: props.pageSize,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const mergedColumns = computed(() => {
  let cols = [...props.columns];
  if (props.showIndex) {
    cols.unshift({
      title: "#",
      dataIndex: "_index",
      key: "_index",
      width: 60,
      align: "center",
      customRender: ({ index }: any) =>
        index + 1 + (pagination.current - 1) * pagination.pageSize,
    });
  }
  return cols;
});

// 列宽响应式管理
const columnWidths = ref<Record<string, number>>({});

watch(
  mergedColumns,
  (cols) => {
    const widths: Record<string, number> = {};
    cols.forEach((col: any) => {
      widths[col.dataIndex] =
        columnWidths.value[col.dataIndex] ?? col.width ?? 100;
    });
    columnWidths.value = widths;
  },
  { immediate: true },
);

// 列拖拽缩放
const resizing = ref(false);
const resizingColumn = ref("");
const resizeStartX = ref(0);
const resizeStartWidth = ref(0);

function handleResizeStart(e: MouseEvent, dataIndex: string) {
  e.preventDefault();
  resizing.value = true;
  resizingColumn.value = dataIndex;
  resizeStartX.value = e.clientX;
  resizeStartWidth.value = columnWidths.value[dataIndex] ?? 100;
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
  document.addEventListener("mousemove", handleResizeMove);
  document.addEventListener("mouseup", handleResizeEnd);
}

function handleResizeMove(e: MouseEvent) {
  if (!resizing.value) return;
  const diff = e.clientX - resizeStartX.value;
  const newWidth = Math.max(50, resizeStartWidth.value + diff);
  columnWidths.value = {
    ...columnWidths.value,
    [resizingColumn.value]: newWidth,
  };
}

function handleResizeEnd() {
  resizing.value = false;
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
  document.removeEventListener("mousemove", handleResizeMove);
  document.removeEventListener("mouseup", handleResizeEnd);
}

onUnmounted(() => {
  document.removeEventListener("mousemove", handleResizeMove);
  document.removeEventListener("mouseup", handleResizeEnd);
});

function getColumnProps(col: Column): any {
  const base: any = {
    title: col.title,
    dataIndex: col.dataIndex,
    key: col.key || col.dataIndex,
    width: columnWidths.value[col.dataIndex] ?? col.width ?? 100,
    align: col.align || "center",
    fixed: col.fixed,
    ellipsis: col.ellipsis ?? true,
  };
  if (col.slots) {
    base.slots = col.slots;
  }
  if (col.customRender) {
    base.customRender = col.customRender;
  } else if (col.dictCode) {
    const { getLabel } = useDict();
    base.customRender = ({ text }: any) => getLabel(col.dictCode!, text);
  }
  return base;
}

async function loadData(params?: Record<string, any>) {
  loading.value = true;
  try {
    const queryParams = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      ...params,
    };
    const res = await props.api(queryParams);
    dataSource.value = res.list || [];
    pagination.total = res.total || 0;
    pagination.current = res.page || pagination.current;
    pagination.pageSize = res.pageSize || pagination.pageSize;
  } catch (err: any) {
    dataSource.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch(values: Record<string, any>) {
  const params: Record<string, any> = {};
  for (const key of Object.keys(values)) {
    const val = values[key];
    if (
      val instanceof Date ||
      (typeof val === "object" && val !== null && "format" in val)
    ) {
      params[key] = (val as Dayjs).format("YYYY-MM-DD");
    } else {
      params[key] = val;
    }
  }
  pagination.current = 1;
  currentSearchParams.value = params;
  loadData(params);
  emit("search", params);
}

function handleReset() {
  pagination.current = 1;
  currentSearchParams.value = {};
  loadData();
}

function handlePageChange(page: number, size: number) {
  pagination.current = page;
  pagination.pageSize = size;
  loadData();
}

function refresh() {
  loadData();
}

defineExpose({
  refresh,
  loadData,
  selectedRowKeys,
  selectedRows,
  clearSelection,
});

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="s-table">
    <div v-if="searchFields && searchFields.length > 0" class="table-search">
      <SSearchBar
        :fields="searchFields"
        :loading="loading"
        collapsed
        @search="handleSearch"
        @reset="handleReset"
      />
    </div>
    <a-card>
      <div v-if="showToolbar" class="table-toolbar">
        <div class="toolbar-left">
          <slot name="toolbar-left" />
          <slot name="toolbar" />
        </div>
        <div class="toolbar-right">
          <slot name="toolbar-right" />
          <a-button
            v-if="showExport"
            @click="handleExport"
            :loading="exporting"
          >
            <DownloadOutlined /> 导出
          </a-button>
        </div>
      </div>

      <a-table
        :columns="mergedColumns.map(getColumnProps)"
        :data-source="dataSource"
        :row-key="rowKey || 'id'"
        :row-selection="rowSelection"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: '100%' }"
        :bordered="false"
        size="middle"
        @change="(pg: any) => handlePageChange(pg.current, pg.pageSize)"
      >
        <template #headerCell="{ column }">
          <div class="s-table-header-cell">
            <span class="s-table-header-title">{{ column.title }}</span>
            <span
              v-if="resizable && column.dataIndex !== '_index'"
              class="s-table-resize-handle"
              @mousedown.prevent="
                (e: MouseEvent) => handleResizeStart(e, column.dataIndex)
              "
            />
          </div>
        </template>
        <template #bodyCell="{ column, text, record, index }">
          <!-- Action column -->
          <template v-if="column.key === '_action' && slots.action">
            <slot name="action" :record="record" :index="index" />
          </template>
          <!-- Custom body cell by dataIndex -->
          <template v-else-if="slots['body:' + column.dataIndex]">
            <slot
              :name="'body:' + column.dataIndex"
              :record="record"
              :index="index"
              :value="text"
            />
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<style scoped lang="less">
.s-table {
  .table-title {
    font-size: 16px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.85);
    &::before {
      content: "";
      display: inline-block;
      width: 4px;
      height: 16px;
      background: #1677ff;
      border-radius: 2px;
      margin-right: 8px;
      vertical-align: middle;
    }
  }

  .table-search {
    margin-bottom: 16px;
    padding: 16px 16px 4px;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  }

  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    flex-wrap: wrap;
    gap: 12px;

    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  // 表格
  :deep(.ant-table) {
    border-radius: 8px;
    overflow: hidden;

    .ant-table-container {
      border: 1px solid #e8e8e8;
      border-radius: 8px;
    }

    .ant-table-thead > tr > th {
      background: #fafafa;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.65);
      font-size: 13px;
      padding: 10px 12px;
      &::before {
        display: none;
      }
    }

    .ant-table-tbody > tr > td {
      padding: 10px 12px;
      font-size: 13px;
    }

    // hover 高亮（无斑马纹）
    .ant-table-tbody > tr:hover > td {
      background: #e6f1fc !important;
    }
  }

  :deep(.ant-pagination) {
    margin-top: 16px;
  }
}

.s-table-header-cell {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;

  .s-table-header-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .s-table-resize-handle {
    position: absolute;
    right: -8px;
    top: 0;
    bottom: 0;
    width: 16px;
    cursor: col-resize;
    z-index: 1;

    &::after {
      content: "";
      position: absolute;
      right: 6px;
      top: 20%;
      bottom: 20%;
      width: 4px;
      border-radius: 2px;
      background: transparent;
      transition: background 0.2s;
    }

    &:hover::after,
    &:active::after {
      background: #1890ff;
    }
  }
}
</style>
