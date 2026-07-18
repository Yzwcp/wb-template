<script setup lang="ts">
import { ref, h } from "vue";
import { message, Modal } from "ant-design-vue";
import { DeleteOutlined } from "@ant-design/icons-vue";
import STable from "@/components/STable/index.vue";
import type { Column, SearchField } from "@/types";
import * as logApi from "@/api/log";
import dayjs from "dayjs";

defineOptions({ name: "SystemLog" });

const activeTab = ref("operation");
const opTableRef = ref<InstanceType<typeof STable> | null>(null);
const loginTableRef = ref<InstanceType<typeof STable> | null>(null);

// Operation Log columns
const opColumns: Column[] = [
  { title: "操作用户", dataIndex: "username", width: 120 },
  { title: "url", dataIndex: "url", width: 150 },
  { title: "请求方法", dataIndex: "method", width: 80 },
  {
    title: "请求参数",
    dataIndex: "params",
    width: 100,
    ellipsis: true,
  },
  { title: "IP地址", dataIndex: "ip", width: 140 },
  {
    title: "耗时(ms)",
    dataIndex: "duration",
    width: 90,
  },
  {
    title: "状态",
    dataIndex: "status",
    width: 80,
    customRender: ({ record }) => {
      return h(
        "a-tag",
        { color: record.result === "200" ? "green" : "red" },
        record.result,
      );
    },
  },
  {
    title: "操作时间",
    dataIndex: "createdAt",
    width: 170,
    customRender: ({ text }) =>
      text ? dayjs(text).format("YYYY-MM-DD HH:mm:ss") : "-",
  },
];

// Login Log columns
const loginColumns: Column[] = [
  { title: "用户名", dataIndex: "username", width: 120 },
  { title: "IP地址", dataIndex: "ip", width: 140 },
  { title: "浏览器", dataIndex: "browser", width: 150 },
  { title: "操作系统", dataIndex: "os", width: 120 },
  {
    title: "状态",
    dataIndex: "status",
    width: 80,
    customRender: ({ text }) => {
      return h(
        "a-tag",
        { color: text === 1 ? "green" : "red" },
        text === 1 ? "成功" : "失败",
      );
    },
  },
  { title: "消息", dataIndex: "message", width: 200, ellipsis: true },
  {
    title: "登录时间",
    dataIndex: "loginTime",
    width: 170,
    customRender: ({ text }) =>
      text ? dayjs(text).format("YYYY-MM-DD HH:mm:ss") : "-",
  },
];

const searchFields: SearchField[] = [
  { label: "用户名", name: "username", type: "input" },
  { label: "日期", name: "dateRange", type: "dateRange" },
];

async function handleClearOpLogs() {
  Modal.confirm({
    title: "确认清空",
    content: "确定要清空所有操作日志吗？",
    okText: "确定",
    cancelText: "取消",
    async onOk() {
      try {
        await logApi.clearOperationLogs();
        message.success("操作日志已清空");
        opTableRef.value?.refresh();
      } catch (err: any) {
      }
    },
  });
}

async function handleClearLoginLogs() {
  Modal.confirm({
    title: "确认清空",
    content: "确定要清空所有登录日志吗？",
    okText: "确定",
    cancelText: "取消",
    async onOk() {
      try {
        await logApi.clearLoginLogs();
        message.success("登录日志已清空");
        loginTableRef.value?.refresh();
      } catch (err: any) {
      }
    },
  });
}
</script>

<template>
  <div class="system-log">
    <a-card :bordered="false">
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="operation" tab="操作日志">
          <STable
            ref="opTableRef"
            :columns="opColumns"
            :api="logApi.getOperationLogs"
            :search-fields="searchFields"
            :show-index="true"
            :show-toolbar="true"
          >
            <template #toolbar-right>
              <a-button danger @click="handleClearOpLogs">
                <DeleteOutlined />
                清空日志
              </a-button>
            </template>
          </STable>
        </a-tab-pane>

        <a-tab-pane key="login" tab="登录日志">
          <STable
            ref="loginTableRef"
            :columns="loginColumns"
            :api="logApi.getLoginLogs"
            :search-fields="searchFields"
            :show-index="true"
            :show-toolbar="true"
          >
            <template #toolbar-right>
              <a-button danger @click="handleClearLoginLogs">
                <DeleteOutlined />
                清空日志
              </a-button>
            </template>
          </STable>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>
