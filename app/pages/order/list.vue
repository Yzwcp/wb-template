<template>
  <view class="page">
    <view class="header">
      <text class="title">我的订单</text>
    </view>

    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab"
        :class="{ active: activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </view>
    </view>

    <view class="order-list" v-if="list.length > 0">
      <view
        class="order-card"
        v-for="item in list"
        :key="item.id"
        @click="goDetail(item.id)"
      >
        <view class="order-header">
          <text class="order-no">订单号: {{ item.orderNo }}</text>
          <text class="status" :class="'status-' + item.status">{{ statusMap[item.status] || item.status }}</text>
        </view>
        <view class="order-body">
          <text class="body-text">{{ item.body }}</text>
        </view>
        <view class="order-footer">
          <text class="amount">¥{{ (item.totalFee / 100).toFixed(2) }}</text>
          <text class="time">{{ item.createdAt }}</text>
        </view>
      </view>
    </view>

    <wd-empty v-else-if="!loading" description="暂无订单" />

    <view class="loading-more" v-if="loading">
      <wd-loading />
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getOrderList } from "@/api/order";

const list = ref([]);
const loading = ref(false);
const activeTab = ref("ALL");

const tabs = [
  { key: "ALL", label: "全部" },
  { key: "PENDING", label: "待支付" },
  { key: "PAID", label: "已支付" },
  { key: "CLOSED", label: "已关闭" },
];

const statusMap = {
  PENDING: "待支付",
  PAID: "已支付",
  CLOSED: "已关闭",
  REFUNDING: "退款中",
  REFUNDED: "已退款",
  PARTIAL_REFUND: "部分退款",
};

async function loadData() {
  loading.value = true;
  try {
    const params = { pageSize: 50 };
    if (activeTab.value !== "ALL") params.status = activeTab.value;
    const res = await getOrderList(params);
    list.value = res.list || [];
  } catch (err) {
    console.error("获取订单列表失败:", err);
  } finally {
    loading.value = false;
  }
}

function switchTab(key) {
  activeTab.value = key;
  loadData();
}

function goDetail(id) {
  uni.navigateTo({ url: "/pages/order/detail?id=" + id });
}

onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background-color: #f7f9fc;
  padding-bottom: 40rpx;
}

.header {
  padding: 40rpx 32rpx 20rpx;
  .title {
    font-size: 40rpx;
    font-weight: bold;
    color: #333;
  }
}

.tabs {
  display: flex;
  padding: 0 32rpx 20rpx;
  gap: 16rpx;

  .tab {
    padding: 12rpx 32rpx;
    border-radius: 40rpx;
    font-size: 26rpx;
    color: #666;
    background: #f0f0f0;

    &.active {
      color: #fff;
      background: #0066ff;
    }
  }
}

.order-list {
  padding: 0 32rpx;
}

.order-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .order-no {
      font-size: 24rpx;
      color: #999;
    }

    .status {
      font-size: 26rpx;
      font-weight: 500;
    }

    .status-PENDING { color: #ff9800; }
    .status-PAID { color: #4caf50; }
    .status-CLOSED { color: #999; }
    .status-REFUNDING { color: #ff9800; }
    .status-REFUNDED { color: #999; }
    .status-PARTIAL_REFUND { color: #999; }
  }

  .order-body {
    margin-top: 16rpx;
    padding-bottom: 16rpx;
    border-bottom: 2rpx solid #f5f5f5;

    .body-text {
      font-size: 28rpx;
      color: #333;
      font-weight: 500;
    }
  }

  .order-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16rpx;

    .amount {
      font-size: 32rpx;
      font-weight: bold;
      color: #ff4444;
    }

    .time {
      font-size: 22rpx;
      color: #ccc;
    }
  }
}

.loading-more {
  display: flex;
  justify-content: center;
  padding: 40rpx;
}
</style>
