import type { VNode } from "vue";

/** 表格列定义 */
export interface Column {
  title: string;
  dataIndex: string;
  key?: string;
  width?: number;
  align?: "left" | "center" | "right";
  fixed?: "left" | "right";
  ellipsis?: boolean;
  slots?: { customRender: string };
  customRender?: (args: {
    text: any;
    record: any;
    index: number;
  }) => VNode | string;
  /** 字典编码，自动用 getLabel 渲染（与 customRender 互斥） */
  dictCode?: string;
  /** 导出时的列标题（默认取 title） */
  exportTitle?: string;
  /** 导出时取值函数，(record) => string。不设时自动尝试 text/dictCode，无法提取的列跳过 */
  exportFormatter?: (record: any) => string;
}

/** 搜索栏字段定义 */
export interface SearchField {
  label: string;
  name: string;
  type: "input" | "select" | "date" | "dateRange" | "switch";
  options?: { label: string; value: any }[];
  placeholder?: string;
  span?: number;
}

/** 表单字段定义 */
export interface FormField {
  label: string;
  name: string;
  type:
    | "input"
    | "password"
    | "select"
    | "switch"
    | "date"
    | "dateRange"
    | "textarea"
    | "treeSelect"
    | "inputNumber"
    | "radio"
    | "checkbox"
    | "upload"
    | "imagePicker"
    | "editor"
    | "custom"
    | "number";
  required?: boolean;
  rules?: any[];
  options?: { label: string; value: any }[];
  treeData?: TreeNode[];
  placeholder?: string;
  span?: number; // 1-24
  hidden?: (model: any) => boolean;
  disabled?: (model: any) => boolean;
  props?: Record<string, any>;
  allowClear?: boolean;
  /** for inputNumber */
  min?: number;
  max?: number;
  /** For imagePicker: allow multiple images (default: false = single) */
  multiple?: boolean;
  /** For imagePicker multi mode: max image count */
  maxCount?: number;
  /** 前置转换：从服务器数据转为表单展示数据（回显时调用） */
  transformLoad?: (value: any) => any;
  /** 保存前转换：表单数据转为提交数据（提交前调用） */
  transformSave?: (value: any) => any;
  /** For editor: 编辑器高度（默认 300） */
  editorHeight?: number;
  /** For editor: placeholder 文本 */
  editorPlaceholder?: string;
}

/** 树节点 */
export interface TreeNode {
  id: number;
  label: string;
  value: number | string;
  children?: TreeNode[];
  disabled?: boolean;
}

/** 详情字段定义 */
export interface DetailField {
  label: string;
  name: string;
  type?: 'text' | 'image' | 'dict' | 'html' | 'custom';
  /** dict 类型时需要，指定字典编码 */
  dictCode?: string;
  span?: number; // 1-24, default 12
  /** 自定义渲染 */
  customRender?: (value: any, record: any) => any;
}

/** 文件信息 */
export interface FileInfo {
  id: number;
  url: string;
  originalName: string;
  name?: string;
}
