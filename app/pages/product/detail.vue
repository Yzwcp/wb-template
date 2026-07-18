<template>
  <view class="page">
    <view class="cover-wrap" v-if="product.coverImage">
      <image class="cover" :src="product.coverImage" mode="widthFix" />
    </view>

    <view class="body">
      <text class="name">{{ product.name }}</text>
      <text class="price">¥{{ (product.price / 100).toFixed(2) }}</text>

      <view class="info-row">
        <text class="label">库存</text>
        <text class="value">{{ product.stock > 0 ? product.stock + ' 件' : '暂时缺货' }}</text>
      </view>

      <view class="desc-section" v-if="product.description">
        <text class="section-title">商品描述</text>
        <text class="desc">{{ product.description }}</text>
      </view>
    </view>

    <view class="bottom-bar">
      <view class="total">
        <text class="total-price">¥{{ (product.price / 100).toFixed(2) }}</text>
      </view>
      <wd-button
        type="primary"
        size="large"
        :disabled="product.stock <= 0"
        :loading="buying"
        @click="handleBuy"
      >
        {{ product.stock > 0 ? '立即购买' : '暂时缺货' }}
      </wd-button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getProductById } from "@/api/product";
import { createOrder } from "@/api/order";

const product = ref({});
const buying = ref(false);
let productId = null;

onLoad((options) => {
  productId = parseInt(options.id);
  if (productId) loadProduct();
});

async function loadProduct() {
  try {
    product.value = await getProductById(productId);
  } catch (err) {
    uni.showToast({ title: "商品不存在", icon: "none" });
  }
}

async function handleBuy() {
  buying.value = true;
  try {
    const order = await createOrder({ productId, quantity: 1 });
    uni.showToast({ title: "订单创建成功", icon: "success" });
    setTimeout(() => {
      uni.navigateTo({ url: "/pages/order/detail?id=" + order.id });
    }, 800);
  } catch (err) {
    uni.showToast({ title: err?.message || "创建订单失败", icon: "none" });
  } finally {
    buying.value = false;
  }
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background-color: #f7f9fc;
  padding-bottom: 120rpx;
}

.cover-wrap {
  width: 100%;
  .cover {
    width: 100%;
    display: block;
    background-color: #f0f0f0;
  }
}

.body {
  background: #fff;
  padding: 32rpx;
  margin: 0 0 20rpx;

  .name {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }

  .price {
    display: inline-block;
    font-size: 48rpx;
    font-weight: bold;
    color: #ff4444;
    margin-top: 16rpx;
  }

  .info-row {
    display: flex;
    align-items: center;
    margin-top: 24rpx;
    padding-top: 24rpx;
    border-top: 2rpx solid #f5f5f5;

    .label {
      font-size: 26rpx;
      color: #999;
      width: 100rpx;
    }
    .value {
      font-size: 26rpx;
      color: #666;
    }
  }

  .desc-section {
    margin-top: 32rpx;

    .section-title {
      font-size: 28rpx;
      font-weight: 600;
      color: #333;
      margin-bottom: 12rpx;
      display: block;
    }

    .desc {
      font-size: 26rpx;
      color: #666;
      line-height: 1.6;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.04);

  .total {
    .total-price {
      font-size: 40rpx;
      font-weight: bold;
      color: #ff4444;
    }
  }
}
</style>
