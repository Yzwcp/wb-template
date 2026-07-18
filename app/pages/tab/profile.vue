<template>
  <view class="page">
    <view class="user-section">
      <image class="avatar" :src="globalState.userInfo.avatar || '/static/default-avatar.png'" mode="aspectFill" />
      <text class="nickname">{{ globalState.userInfo.nickname || globalState.userInfo.username || '未登录' }}</text>
    </view>

    <view class="menu-list">
      <view class="menu-item" @click="goOrderList">
        <wd-icon name="order" size="22px" color="#666" />
        <text class="menu-label">我的订单</text>
        <wd-icon name="arrow-right" size="16px" color="#ccc" />
      </view>
      <view class="menu-item" @click="goProductList">
        <wd-icon name="shop" size="22px" color="#666" />
        <text class="menu-label">商品中心</text>
        <wd-icon name="arrow-right" size="16px" color="#ccc" />
      </view>
    </view>

    <view class="logout-section">
      <wd-button block plain type="error" @click="handleLogout">退出登录</wd-button>
    </view>
  </view>
</template>

<script setup>
import { useGlobalStore } from "@/store/global";
import { storeToRefs } from "pinia";
import { logout as logoutApi } from "@/api/auth";

const globalState = useGlobalStore();

function goProductList() {
  uni.navigateTo({ url: "/pages/product/list" });
}

function goOrderList() {
  uni.navigateTo({ url: "/pages/order/list" });
}

async function handleLogout() {
  uni.showModal({
    title: "提示",
    content: "确定要退出登录吗？",
    success: async ({ confirm }) => {
      if (confirm) {
        try {
          await logoutApi();
        } catch (e) {
          // 即使接口失败也清除本地状态
        }
        globalState.clearAll();
        uni.reLaunch({ url: "/pages/login/login" });
      }
    },
  });
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background-color: #f7f9fc;
  padding-bottom: 40rpx;
}

.user-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 32rpx 60rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  .avatar {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    border: 6rpx solid rgba(255,255,255,0.5);
    background: #fff;
  }

  .nickname {
    font-size: 34rpx;
    font-weight: 600;
    color: #fff;
    margin-top: 20rpx;
  }
}

.menu-list {
  background: #fff;
  margin: 20rpx 0;
  padding: 0 32rpx;

  .menu-item {
    display: flex;
    align-items: center;
    padding: 32rpx 0;

    & + .menu-item {
      border-top: 2rpx solid #f5f5f5;
    }

    .menu-label {
      flex: 1;
      font-size: 28rpx;
      color: #333;
      margin-left: 16rpx;
    }
  }
}

.logout-section {
  padding: 60rpx 32rpx;
}
</style>
