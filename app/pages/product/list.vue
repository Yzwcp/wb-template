<template>
  <view class="page">
    <view class="header">
      <text class="title">商品中心</text>
    </view>

    <view class="product-list" v-if="list.length > 0">
      <view
        class="product-card"
        v-for="item in list"
        :key="item.id"
        @click="goDetail(item.id)"
      >
        <image class="cover" :src="item.coverImage || '/static/placeholder.png'" mode="aspectFill" />
        <view class="info">
          <text class="name">{{ item.name }}</text>
          <text class="desc" v-if="item.description">{{ item.description }}</text>
          <view class="price-row">
            <text class="price">¥{{ (item.price / 100).toFixed(2) }}</text>
            <text class="stock" v-if="item.stock > 0">库存 {{ item.stock }}</text>
            <text class="sold-out" v-else>已售罄</text>
          </view>
        </view>
      </view>
    </view>

    <wd-empty v-else description="暂无商品" />

    <view class="loading-more" v-if="loading">
      <wd-loading />
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getProductList } from "@/api/product";

const list = ref([]);
const loading = ref(false);

async function loadData() {
  loading.value = true;
  try {
    const res = await getProductList({ pageSize: 100 });
    list.value = res.list || [];
  } catch (err) {
    console.error("获取商品列表失败:", err);
  } finally {
    loading.value = false;
  }
}

function goDetail(id) {
  uni.navigateTo({ url: "/pages/product/detail?id=" + id });
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

.product-list {
  padding: 0 32rpx;
}

.product-card {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .cover {
    width: 200rpx;
    height: 200rpx;
    border-radius: 12rpx;
    flex-shrink: 0;
    background-color: #f0f0f0;
  }

  .info {
    flex: 1;
    margin-left: 24rpx;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .name {
      font-size: 30rpx;
      font-weight: 600;
      color: #333;
      lines: 2;
    }

    .desc {
      font-size: 24rpx;
      color: #999;
      margin-top: 8rpx;
      lines: 1;
    }

    .price-row {
      display: flex;
      align-items: center;
      margin-top: 12rpx;

      .price {
        font-size: 36rpx;
        font-weight: bold;
        color: #ff4444;
      }

      .stock {
        font-size: 24rpx;
        color: #999;
        margin-left: 16rpx;
      }

      .sold-out {
        font-size: 24rpx;
        color: #ccc;
        margin-left: 16rpx;
      }
    }
  }
}

.loading-more {
  display: flex;
  justify-content: center;
  padding: 40rpx;
}
</style>
