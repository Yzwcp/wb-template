<template>
    <view class="page">
        <!-- 自定义导航栏（如果需要配合你的 useNavbarHeight） -->
        <view class="custom-navbar">
            <wd-icon name="arrow-left" size="24px" class="back-icon" @click="goBack" />
            <text class="navbar-title">我的施工任务</text>
        </view>

        <!-- 顶部状态切换 Tabs -->
        <view class="tabs-container">
            <wd-tabs v-model="currentTab" sticky animated @change="handleTabChange">
                <wd-tab title="全部" name="all"></wd-tab>
                <wd-tab title="待执行" name="pending"></wd-tab>
                <wd-tab title="执行中" name="progress"></wd-tab>
                <wd-tab title="待审核" name="audit"></wd-tab>
                <wd-tab title="已完成" name="completed"></wd-tab>
            </wd-tabs>
        </view>

        <!-- 任务列表区域 -->
        <scroll-view scroll-y class="list-container">
            <view v-for="(item, index) in taskList" :key="index" :class="['task-card', `status-border-${item.status}`]">
                <!-- 右上角状态切角标签 -->
                <view :class="['status-badge', `status-bg-${item.status}`]">
                    {{ getStatusText(item.status) }}
                </view>

                <!-- 施工编号 -->
                <view class="task-no">施工编号：{{ item.no }}</view>

                <!-- 客户姓名（带状态圆点） -->
                <view class="customer-info">
                    <view :class="['dot', `status-dot-${item.status}`]"></view>
                    <text class="customer-name">客户：{{ item.customerName }}</text>
                </view>

                <!-- 详情字段布局 -->
                <view class="info-row">
                    <view class="field-label">地址</view>
                    <view class="field-value address-value">{{ item.address }}</view>
                </view>

                <view class="grid-info-row">
                    <view class="info-cell">
                        <view class="field-label">类型</view>
                        <view class="field-value type-value">{{ item.type }}</view>
                    </view>
                    <view class="info-cell">
                        <view class="field-label">计划时间</view>
                        <view class="field-value time-value">{{ item.planTime }}</view>
                    </view>
                </view>

                <!-- 底部操作按钮 -->
                <view class="action-bar">
                    <button class="btn btn-outline" @click="handleAction('supplement', item)">补充资料</button>
                    <button class="btn btn-primary" @click="handleAction('detail', item)">查看详情</button>
                </view>
            </view>

            <!-- 占位底部隔离 -->
            <view class="safe-bottom"></view>
        </scroll-view>
    </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const currentTab = ref('all')

// 模拟 UI 设计稿中的数据
const taskList = ref([
    {
        no: '15648615316463',
        customerName: '王先生',
        address: '浙江省杭州市东方地址商务园 17-504',
        type: '现场维护',
        planTime: '2026-04-22 10:20',
        status: 'pending' // 待执行
    },
    {
        no: '15648615316463',
        customerName: '王孝良',
        address: '浙江省杭州市东方地址商务园 17-504',
        type: '现场维护',
        planTime: '2026-04-22 10:20',
        status: 'progress' // 执行中
    },
    {
        no: '15648615316463',
        customerName: '王孝良',
        address: '浙江省杭州市东方地址商务园 17-504',
        type: '现场维护',
        planTime: '2026-04-22 10:20',
        status: 'completed' // 已完成
    }
])

// 状态文字映射
const getStatusText = (status) => {
    const dict = {
        pending: '待执行',
        progress: '执行中',
        audit: '待审核',
        completed: '已完成'
    }
    return dict[status] || ''
}

const handleTabChange = (e) => {
    console.log('当前切换至：', e.name)
    // 这里可以编写筛选或重新请求接口的逻辑
}

const handleAction = (actionType, item) => {
    console.log(`触发了 ${actionType} 操作，数据为：`, item)
}

const goBack = () => {
    uni.navigateBack()
}

onLoad(() => {
    // 页面初始化逻辑
})
</script>

<style scoped lang="scss">
/* 基础页面容器 */
.page {
    min-height: 100vh;
    background-color: #f7f9fc;
    display: flex;
    flex-direction: column;
}

/* 自定义导航栏样式 */
.custom-navbar {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    height: 88rpx;
    background-color: #ffffff;
    padding-top: var(--status-bar-height); /* 适配状态栏高度 */

    .back-icon {
        position: absolute;
        left: 32rpx;
        bottom: 22rpx;
        color: #333333;
    }

    .navbar-title {
        font-size: 34rpx;
        font-weight: bold;
        color: #111111;
    }
}

/* 选项卡容器微调，使其符合设计稿平铺轻盈感 */
.tabs-container {
    background-color: #ffffff;
    :deep(.wd-tabs__nav) {
        background-color: #ffffff;
    }
    :deep(.wd-tabs__slider) {
        width: 40rpx !important;
        height: 6rpx !important;
        border-radius: 4rpx;
        background-color: #2979ff !important;
    }
}

/* 列表滚动容器 */
.list-container {
    flex: 1;
    padding: 32rpx;
    box-sizing: border-box;
}

/* 施工任务卡片基类 */
.task-card {
    position: relative;
    background-color: #ffffff;
    border-radius: 24rpx;
    padding: 32rpx;
    margin-bottom: 32rpx;
    border: 2rpx solid transparent;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.02);
    overflow: hidden; /* 用于切角裁剪 */
}

/* 动态状态边框色适配 */
.status-border-pending {
    border-color: #d6e4ff;
}
.status-border-progress {
    border-color: #ffe8d6;
}
.status-border-completed {
    border-color: #d2f4e8;
}

/* 右上角切角状态标签 */
.status-badge {
    position: absolute;
    top: 0;
    right: 0;
    padding: 10rpx 40rpx;
    font-size: 24rpx;
    color: #ffffff;
    font-weight: 500;
    border-bottom-left-radius: 24rpx; /* 实现圆润切角 */
}
.status-bg-pending {
    background: #2979ff;
}
.status-bg-progress {
    background: #f2825b;
}
.status-bg-completed {
    background: #2ecc71;
}

/* 施工编号说明 */
.task-no {
    font-size: 26rpx;
    color: #888888;
    margin-bottom: 28rpx;
}

/* 客户信息与左侧小圆点 */
.customer-info {
    display: flex;
    align-items: center;
    margin-bottom: 28rpx;

    .dot {
        width: 16rpx;
        height: 16rpx;
        border-radius: 50%;
        margin-right: 16rpx;
    }
    .status-dot-pending {
        background-color: #2979ff;
        box-shadow: 0 0 8rpx rgba(41, 121, 255, 0.5);
    }
    .status-dot-progress {
        background-color: #f2825b;
        box-shadow: 0 0 8rpx rgba(242, 130, 91, 0.5);
    }
    .status-dot-completed {
        background-color: #2ecc71;
        box-shadow: 0 0 8rpx rgba(46, 204, 113, 0.5);
    }

    .customer-name {
        font-size: 34rpx;
        font-weight: bold;
        color: #333333;
    }
}

/* 通用标签与值样式 */
.field-label {
    font-size: 24rpx;
    color: #999999;
    margin-bottom: 10rpx;
}
.field-value {
    font-size: 28rpx;
    color: #333333;
    line-height: 1.4;
}

/* 单行纵向排列（如地址） */
.info-row {
    margin-bottom: 24rpx;
    .address-value {
        font-weight: 500;
    }
}

/* 左右分栏排列（类型和计划时间） */
.grid-info-row {
    display: flex;
    margin-bottom: 32rpx;

    .info-cell {
        flex: 1;

        .type-value {
            color: #2979ff;
            font-weight: 600;
        }
        .time-value {
            font-weight: 500;
        }
    }
}

/* 底部按钮栏布局 */
.action-bar {
    display: flex;
    justify-content: flex-end;
    gap: 20rpx;
    border-top: 1rpx solid #f0f3f7;
    padding-top: 28rpx;

    .btn {
        margin: 0;
        padding: 0 36rpx;
        height: 64rpx;
        line-height: 60rpx;
        font-size: 26rpx;
        border-radius: 12rpx;
        box-sizing: border-box;
        font-weight: 500;

        &::after {
            border: none;
        }
    }

    /* 补充资料按钮（橙红空心） */
    .btn-outline {
        background-color: #ffffff;
        color: #ff6b6b;
        border: 2rpx solid #ff6b6b;

        &:active {
            background-color: #fff55;
        }
    }

    /* 查看详情按钮（实心蓝） */
    .btn-primary {
        background-color: #2979ff;
        color: #ffffff;

        &:active {
            background-color: #1a65eb;
        }
    }
}

.safe-bottom {
    height: 60rpx;
}
</style>
