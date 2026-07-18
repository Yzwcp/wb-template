<template>
    <view class="custom-tabbar">
        <!-- 左侧三个按钮 -->
        <view v-for="(item, index) in tabList.slice(0, 2)" :key="item.id" class="tabbar-item" @click="switchTab(item.id, item.pagePath)">
            <view class="tabbar-icon">
                <image :src="activeId === item.id ? item.activeIcon : item.icon" mode="aspectFit" />
            </view>
            <text class="tabbar-text" :class="{ active: activeId === item.id }">
                {{ item.text }}
            </text>
        </view>

        <!-- 中间突出按钮 -->
        <view class="tabbar-item center-item" @click="switchTab(tabList[2].id, tabList[2].pagePath)">
            <view class="center-icon-wrapper">
                <image :src="activeId === tabList[2].id ? tabList[2].activeIcon : tabList[2].icon" mode="aspectFit" class="center-icon" />
            </view>
            <text class="tabbar-text center-text" :class="{ active: activeId === tabList[2].id }">
                {{ tabList[2].text }}
            </text>
        </view>

        <!-- 右侧两个按钮 -->
        <view v-for="(item, index) in tabList.slice(3)" :key="item.id" class="tabbar-item" @click="switchTab(item.id, item.pagePath)">
            <view class="tabbar-icon">
                <image :src="activeId === item.id ? item.activeIcon : item.icon" mode="aspectFit" />
            </view>
            <text class="tabbar-text" :class="{ active: activeId === item.id }">
                {{ item.text }}
            </text>
        </view>
    </view>
</template>

<script setup>
import { ref } from 'vue'

// 接收父组件传递的高亮ID
const props = defineProps({
    activeId: {
        type: [String, Number],
        required: true
    }
})

// 定义TabBar数据
const tabList = ref([
    {
        id: 'home',
        text: '首页',
        icon: '/static/tabbar/home.png',
        activeIcon: '/static/tabbar/home-active.png',
        pagePath: '/pages/index/index'
    },
    {
        id: 'shop',
        text: '商城',
        icon: '/static/tabbar/shop.png',
        activeIcon: '/static/tabbar/shop-active.png',
        pagePath: '/pages/shop/shop'
    },
    {
        id: 'scan',
        text: '扫一扫',
        icon: '/static/tabbar/scan.png',
        activeIcon: '/static/tabbar/scan-active.png',
        pagePath: '/pages/scan/scan'
    },
    {
        id: 'wallet',
        text: '钱包',
        icon: '/static/tabbar/wallet.png',
        activeIcon: '/static/tabbar/wallet-active.png',
        pagePath: '/pages/wallet/wallet'
    },
    {
        id: 'mine',
        text: '我的',
        icon: '/static/tabbar/mine.png',
        activeIcon: '/static/tabbar/mine-active.png',
        pagePath: '/pages/mine/mine'
    }
])

// 切换Tab
const switchTab = (id, pagePath) => {
    // 触发父组件事件，更新高亮ID
    defineEmits(['update:activeId', 'tabClick'])(id, pagePath)
    // UniApp页面跳转
    uni.switchTab({
        url: pagePath
    })
}
</script>

<style scoped>
.custom-tabbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 110rpx;
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-around;
    box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
    z-index: 999;
}

.tabbar-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
}

.tabbar-icon {
    width: 48rpx;
    height: 48rpx;
    margin-bottom: 8rpx;
}

.tabbar-icon image {
    width: 100%;
    height: 100%;
}

.tabbar-text {
    font-size: 22rpx;
    color: #999;
}

.tabbar-text.active {
    color: #007aff;
}

/* 中间突出按钮样式 */
.center-item {
    position: relative;
    top: -30rpx;
    background-color: #fff;
    border-radius: 50%;
    width: 100rpx;
    height: 100rpx;
    box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.center-icon-wrapper {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #007aff;
    border-radius: 50%;
}

.center-icon {
    width: 40rpx;
    height: 40rpx;
}

.center-text {
    position: absolute;
    bottom: -30rpx;
}
</style>
