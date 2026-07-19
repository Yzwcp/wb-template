<script setup lang="ts">
import { ref, computed, onMounted, h } from "vue";
import { message } from "ant-design-vue";
import {
  DollarOutlined,
  FileSearchOutlined,
  SyncOutlined,
  HistoryOutlined,
} from "@ant-design/icons-vue";
import STable from "@/components/STable/index.vue";
import SDetail from "@/components/SDetail/index.vue";
import type { Column, SearchField, DetailField } from "@/types";
import type { RefundRecordItem } from "@/api/order";
import * as orderApi from "@/api/order";
import { useUserStore } from "@/stores/user";
import { useDict } from "@/composables/useDict";
import { OrderStatus, RefundStatus } from "@/types/order.d";
import { hasPerm } from "@/utils/perm";

defineOptions({ name: "SystemOrder" });

const { loadDict, getLabel, getOptions, getMeta } = useDict();
const userStore = useUserStore();

const tableRef = ref<InstanceType<typeof STable> | null>(null);
const refundVisible = ref(false);
const refundOrder = ref<any>(null);
const refundAmount = ref(0);
const refundDesc = ref("");
const detailVisible = ref(false);
const detailRecord = ref<any>(null);
const recordVisible = ref(false);
const recordOrder = ref<any>(null);
const refundRecords = ref<RefundRecordItem[]>([]);
const confirmLoading = ref(false);
const selectedRows = computed(() => tableRef.value?.selectedRows || []);
const columns: Column[] = [
  { title: "订单号", dataIndex: "orderNo", width: 140, ellipsis: true },

  { title: "下单用户", dataIndex: "user.nickname", width: 100 },
  { title: "手机号", dataIndex: "user.phone", width: 100 },
  { title: "商品描述", dataIndex: "body", width: 150, ellipsis: true },
  {
    title: "金额(元)",
    dataIndex: "totalFee",
    width: 90,
    customRender: ({ text }: any) => (text ? (text / 100).toFixed(2) : "-"),
  },
  {
    title: "状态",
    dataIndex: "status",
    width: 100,
  },
  {
    title: "退款状态",
    dataIndex: "refundStatus",
    width: 150,
  },
  {
    title: "退款金额",
    dataIndex: "refundFee",
    width: 90,
    customRender: ({ text }: any) => (text ? (text / 100).toFixed(2) : "-"),
  },
  { title: "支付时间", dataIndex: "payTime", width: 170 },
  { title: "创建时间", dataIndex: "createdAt", width: 170 },

  {
    title: "操作",
    dataIndex: "_action",
    key: "_action",
    width: 310,
    fixed: "right",
  },
];

const searchFields = computed<SearchField[]>(() => [
  { label: "订单号", name: "orderNo", type: "input" },
  {
    label: "状态",
    name: "status",
    type: "select",
    options: getOptions("ORDER_STATUS"),
  },
]);

const detailFields: DetailField[] = [
  { label: "订单号", name: "orderNo", span: 2 },
  { label: "商户订单号", name: "outTradeNo" },
  { label: "微信交易号", name: "transactionId" },
  { label: "商品描述", name: "body", span: 2 },
  {
    label: "金额",
    name: "totalFee",
    type: "custom",
    customRender: (v: number) => `¥${(v / 100).toFixed(2)}`,
  },
  {
    label: "退款金额",
    name: "refundFee",
    type: "custom",
    customRender: (v: number) => (v ? `¥${(v / 100).toFixed(2)}` : "-"),
  },
  { label: "状态", name: "status", type: "dict", dictCode: "ORDER_STATUS" },
  {
    label: "退款状态",
    name: "refundStatus",
    type: "dict",
    dictCode: "ORDER_REFUND_STATUS",
  },
  { label: "退款单号", name: "refundNo", span: 2 },
  { label: "支付时间", name: "payTime" },
  { label: "创建时间", name: "createdAt" },
];

onMounted(async () => {
  await loadDict("ORDER_STATUS");
});

async function handleQuerySync(record: any) {
  try {
    await orderApi.queryAndSync(record.outTradeNo || record.orderNo);
    message.success("同步成功");
    tableRef.value?.refresh();
  } catch (err: any) {}
}

async function handleSyncRefund(record: any) {
  try {
    await orderApi.syncRefund(record.id);
    message.success("退款同步完成");
    tableRef.value?.refresh();
  } catch (err: any) {}
}

async function handleDetail(record: any) {
  detailRecord.value = record;
  detailVisible.value = true;
}

async function handleRefundRecords(record: any) {
  recordOrder.value = record;
  recordVisible.value = true;
  try {
    refundRecords.value = (await orderApi.getRefundRecords(record.id)) || [];
  } catch {
    refundRecords.value = [];
  }
}

function handleRefund(record: any) {
  refundOrder.value = record;
  refundAmount.value = (record.totalFee - (record.refundFee || 0)) / 100;
  refundDesc.value = "";
  refundVisible.value = true;
}

async function handleSubmitRefund() {
  if (refundAmount.value <= 0) {
    message.warning("退款金额必须大于0");
    return;
  }
  confirmLoading.value = true;
  try {
    await orderApi.refund(
      refundOrder.value.id,
      Math.round(refundAmount.value * 100),
      refundDesc.value,
    );
    message.success("退款申请已提交");
    refundVisible.value = false;
    tableRef.value?.refresh();
  } catch (err: any) {
  } finally {
    confirmLoading.value = false;
  }
}

function refundStatusLabel(status: string) {
  const map: Record<string, string> = {
    PROCESSING: "处理中",
    SUCCESS: "成功",
    FAIL: "失败",
  };
  return map[status] || status;
}
</script>

<template>
  <div>
    <STable
      show-export
      ref="tableRef"
      title="订单管理"
      :columns="columns"
      :api="orderApi.getList"
      :search-fields="searchFields"
      :show-index="true"
      :showToolbar="true"
      row-key="id"
      selectable
    >
      <template #toolbar> </template>
      <!-- 操作列 -->
      <template #action="{ record }">
        <a-space>
          <a-button size="small" @click="handleDetail(record)">
            <FileSearchOutlined /> 详情
          </a-button>
          <a-button
            size="small"
            v-if="record.refundStatus"
            @click="handleRefundRecords(record)"
          >
            <HistoryOutlined /> 退款记录
          </a-button>

          <a-button
            v-if="['PAID', 'PARTIAL_REFUND'].includes(record.status)"
            v-has="['order:refund']"
            size="small"
            @click="handleRefund(record)"
          >
            <DollarOutlined /> 退款
          </a-button>
        </a-space>
      </template>
      <!-- 状态列 -->
      <template #body:status="{ record }">
        <a-tag
          :color="getMeta('ORDER_STATUS', record.status).color || 'default'"
        >
          {{ getLabel("ORDER_STATUS", record.status) }}
        </a-tag>
        <a-button
          v-if="record.status === OrderStatus.PENDING"
          size="small"
          type="link"
          @click="handleQuerySync(record)"
        >
          <SyncOutlined />
        </a-button>
      </template>
      <!-- 退款状态列 -->
      <template #body:refundStatus="{ record }">
        <a-tag :color="'default'" v-if="record.refundStatus">
          {{ getLabel("ORDER_REFUND_STATUS", record.refundStatus) }}
          <SyncOutlined
            style="cursor: pointer"
            @click="handleSyncRefund(record)"
            v-if="record.refundStatus === RefundStatus.PROCESSING"
          />
        </a-tag>
      </template>
    </STable>

    <!-- 详情弹窗 -->
    <SDetail
      v-model:visible="detailVisible"
      title="订单详情"
      :fields="detailFields"
      :record="detailRecord"
    />

    <!-- 退款记录弹窗（独立） -->
    <a-modal
      v-model:open="recordVisible"
      title="退款记录"
      :width="750"
      :footer="null"
      destroy-on-close
    >
      <a-table
        v-if="refundRecords.length"
        :data-source="refundRecords"
        :pagination="false"
        row-key="id"
        size="small"
        bordered
      >
        <!-- <a-table-column title="退款单号" data-index="refundNo" :width="180" /> -->
        <a-table-column title="金额" data-index="refundFee" :width="80">
          <template #default="{ text }"
            >¥{{ (text / 100).toFixed(2) }}</template
          >
        </a-table-column>
        <a-table-column title="状态" data-index="status" :width="80">
          <template #default="{ text }">
            <a-tag
              :color="
                text === 'SUCCESS' ? 'green' : text === 'FAIL' ? 'red' : 'blue'
              "
            >
              {{ getLabel("ORDER_REFUND_STATUS", text) }}
            </a-tag>
          </template>
        </a-table-column>
        <a-table-column title="退款原因" data-index="refundDesc" ellipsis />
        <a-table-column title="时间" data-index="createdAt" :width="160" />
        <a-table-column title="退款人" data-index="operator" ellipsis />
      </a-table>
      <a-empty v-else description="暂无退款记录" />
    </a-modal>

    <!-- 退款弹窗 -->
    <a-modal
      v-model:open="refundVisible"
      title="发起退款"
      :confirmLoading="confirmLoading"
      @ok="handleSubmitRefund"
    >
      <a-form-item label="退款金额(元)">
        <a-input-number
          v-model:value="refundAmount"
          :min="0.01"
          :max="
            refundOrder?.totalFee
              ? (refundOrder.totalFee - (refundOrder.refundFee || 0)) / 100
              : 0
          "
          style="width: 100%"
          :step="0.01"
        />
      </a-form-item>
      <p style="color: #999">
        可退金额：{{
          refundOrder
            ? (
                (refundOrder.totalFee - (refundOrder.refundFee || 0)) /
                100
              ).toFixed(2)
            : 0
        }}
        元
      </p>
      <a-form-item label="退款原因">
        <a-textarea
          v-model:value="refundDesc"
          placeholder="请输入退款原因"
          :rows="2"
        />
      </a-form-item>
    </a-modal>
  </div>
</template>
