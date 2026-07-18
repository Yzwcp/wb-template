<template>
  <view class="page">
    <view class="loading-box" v-if="loading">
      <wd-loading />
    </view>

    <template v-else-if="order.id">
      <view class="status-banner" :class="'banner-' + order.status">
        <text class="status-icon">
          {{ order.status === 'PAID' ? '✓' : order.status === 'CLOSED' || order.status === 'REFUNDED' ? '✕' : '⏳' }}
        </text>
        <text class="status-text">{{ statusMap[order.status] || order.status }}</text>
      </view>

      <view class="section">
        <view class="row">
          <text class="label">订单编号</text>
          <text class="value">{{ order.orderNo }}</text>
        </view>
        <view class="row">
          <text class="label">商品信息</text>
          <text class="value">{{ order.body }}</text>
        </view>
        <view class="row">
          <text class="label">订单金额</text>
          <text class="value price">¥{{ (order.totalFee / 100).toFixed(2) }}</text>
        </view>
        <view class="row" v-if="order.payTime">
          <text class="label">支付时间</text>
          <text class="value">{{ order.payTime }}</text>
        </view>
        <view class="row">
          <text class="label">创建时间</text>
          <text class="value">{{ order.createdAt }}</text>
        </view>
      </view>

      <view class="bottom-bar" v-if="order.status === 'PENDING'">
        <wd-button type="primary" size="large" block :loading="paying" @click="handlePay">
          去支付 ¥{{ (order.totalFee / 100).toFixed(2) }}
        </wd-button>
      </view>
    </template>

    <wd-empty v-else description="订单不存在" />
  </view>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getOrderById, payOrder } from "@/api/order";

const order = ref({});
const loading = ref(true);
const paying = ref(false);
let orderId = null;

const statusMap = {
  PENDING: "待支付",
  PAID: "已支付",
  CLOSED: "已关闭",
  REFUNDING: "退款中",
  REFUNDED: "已退款",
  PARTIAL_REFUND: "部分退款",
};

onLoad((options) => {
  orderId = parseInt(options.id);
  if (orderId) loadOrder();
  else loading.value = false;
});

async function loadOrder() {
  try {
    order.value = await getOrderById(orderId);
  } catch (err) {
    console.error("获取订单详情失败:", err);
  } finally {
    loading.value = false;
  }
}

async function handlePay() {
  paying.value = true;
  try {
    // 调用 wx.login 获取临时 code，用于后端换取 openid
    const { code } = await uni.login({ provider: "weixin" });
    if (!code) {
      uni.showToast({ title: "获取授权失败", icon: "none" });
      paying.value = false;
      return;
    }

    // 后端统一下单并返回支付参数
    const res = await payOrder({ orderId: orderId, code });
    if (!res.payParams) {
      uni.showToast({ title: "获取支付参数失败", icon: "none" });
      return;
    }

    // 调起微信支付
    const payResult = await uni.requestPayment({
      provider: "wxpay",
      timeStamp: res.payParams.timeStamp,
      nonceStr: res.payParams.nonceStr,
      package: res.payParams.package,
      signType: res.payParams.signType || 'MD5',
      paySign: res.payParams.paySign,
    });

    // 支付成功
    uni.showToast({ title: "支付成功", icon: "success" });
    loadOrder(); // 刷新订单状态
  } catch (err) {
    if (err.errMsg && err.errMsg.includes("cancel")) {
      uni.showToast({ title: "已取消支付", icon: "none" });
    } else {
      uni.showToast({
        title: err?.message || "支付失败，请重试",
        icon: "none",
      });
    }
  } finally {
    paying.value = false;
  }
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background-color: #f7f9fc;
  padding-bottom: 120rpx;
}

.loading-box {
  display: flex;
  justify-content: center;
  padding-top: 200rpx;
}

.status-banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
  color: #fff;

  &.banner-PENDING { background: linear-gradient(135deg, #ff9800, #ffb74d); }
  &.banner-PAID { background: linear-gradient(135deg, #4caf50, #81c784); }
  &.banner-CLOSED { background: linear-gradient(135deg, #999, #bbb); }
  &.banner-REFUNDING { background: linear-gradient(135deg, #ff9800, #ffb74d); }
  &.banner-REFUNDED { background: linear-gradient(135deg, #999, #bbb); }
  &.banner-PARTIAL_REFUND { background: linear-gradient(135deg, #999, #bbb); }

  .status-icon {
    font-size: 64rpx;
    margin-bottom: 12rpx;
  }

  .status-text {
    font-size: 36rpx;
    font-weight: 600;
  }
}

.section {
  background: #fff;
  margin: 20rpx 0;
  padding: 32rpx;

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20rpx 0;

    & + .row {
      border-top: 2rpx solid #f5f5f5;
    }

    .label {
      font-size: 26rpx;
      color: #999;
    }

    .value {
      font-size: 26rpx;
      color: #333;
      text-align: right;
      max-width: 60%;

      &.price {
        font-size: 32rpx;
        font-weight: bold;
        color: #ff4444;
      }
    }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 32rpx;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.04);
}
</style>


