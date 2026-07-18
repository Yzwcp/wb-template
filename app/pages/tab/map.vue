<template>
    <view class="page">
        <!-- 页面滚动内容区域 -->
        <scroll-view scroll-y class="detail-scroll-view">
            <!-- 1. 头部核心业务卡片 -->
            <view class="main-info-card">
                <!-- 蓝色网吧名称栏 -->
                <view class="card-header-blue">
                    <view class="title-area">
                        <wd-icon name="home" size="20px" color="#ffffff" class="mgr-8" />
                        <text class="shop-name">星际网吧</text>
                    </view>
                    <view class="status-badge">待执行</view>
                </view>

                <!-- 地址与联系人信息 -->
                <view class="card-body">
                    <view class="label-text">地址</view>
                    <view class="address-row">
                        <text class="address-detail">浙江省杭州市东方地址商务园 17-504</text>
                        <wd-icon name="location" size="18px" color="#2979ff" class="loc-icon" />
                    </view>

                    <view class="contact-grid">
                        <view class="contact-cell">
                            <view class="label-text">联系人</view>
                            <view class="value-text font-bold">张老板</view>
                        </view>
                        <view class="contact-cell">
                            <view class="label-text">电话号码</view>
                            <view class="value-text phone-color font-bold">13754425621</view>
                        </view>
                    </view>

                    <view class="divider-line"></view>

                    <!-- 任务基础配置数据 -->
                    <view class="section-sub-title">
                        <wd-icon name="assignment" size="18px" color="#2979ff" class="mgr-6" />
                        <text>任务信息</text>
                    </view>
                    <view class="info-data-list">
                        <view class="data-row">
                            <text class="data-label">合同编号</text>
                            <text class="data-value">HT-20260627-0001</text>
                        </view>
                        <view class="data-row">
                            <text class="data-label">施工编号</text>
                            <text class="data-value">HT-20260627-0001</text>
                        </view>
                        <view class="data-row">
                            <text class="data-label">任务类型</text>
                            <text class="data-value">网络施工</text>
                        </view>
                        <view class="data-row">
                            <text class="data-label">计划时间</text>
                            <text class="data-value">06-27 09:00 ~ 18:00</text>
                        </view>
                    </view>

                    <view class="divider-line"></view>

                    <!-- 施工要求 -->
                    <view class="section-sub-title">
                        <wd-icon name="error-circle" size="18px" color="#2979ff" class="mgr-6" />
                        <text>施工要求</text>
                    </view>
                    <view class="requirement-box">
                        <view class="req-item">1. 更换核心交换机</view>
                        <view class="req-item">2. 调试无盘系统</view>
                    </view>
                </view>
            </view>

            <!-- 2. 子任务进度（自定义时间轴纵向排列） -->
            <view class="panel-card">
                <view class="panel-card-title">
                    <wd-icon name="error-circle" size="18px" color="#2979ff" class="mgr-6" />
                    <text>子任务进度</text>
                </view>

                <view class="timeline-container">
                    <!-- 步骤1: 已完成 -->
                    <view class="timeline-item line-green">
                        <view class="timeline-dot dot-green"></view>
                        <view class="timeline-content">
                            <view class="step-header">
                                <text class="step-status text-green">已完成</text>
                                <text class="step-name">现场勘查</text>
                            </view>
                            <view class="step-desc">完成时间：06-27 09:30 张工</view>
                        </view>
                    </view>

                    <!-- 步骤2: 设备安装（进行中） -->
                    <view class="timeline-item line-blue">
                        <view class="timeline-dot dot-blue"></view>
                        <view class="timeline-content">
                            <view class="step-header">
                                <text class="step-status text-blue">设备安装</text>
                                <text class="step-name">现场勘查</text>
                            </view>
                            <view class="step-desc">开始时间：06-27 09:30 张工</view>
                        </view>
                    </view>

                    <!-- 步骤3: 未开始 -->
                    <view class="timeline-item line-gray">
                        <view class="timeline-dot dot-gray"></view>
                        <view class="timeline-content">
                            <view class="step-header">
                                <text class="step-status text-gray">未开始</text>
                                <text class="step-name">系统调试</text>
                            </view>
                        </view>
                    </view>

                    <!-- 步骤4: 未开始末尾 -->
                    <view class="timeline-item">
                        <view class="timeline-dot dot-gray"></view>
                        <view class="timeline-content">
                            <view class="step-header">
                                <text class="step-status text-gray">未开始</text>
                                <text class="step-name">验收交付</text>
                            </view>
                        </view>
                    </view>
                </view>
            </view>

            <!-- 3. 施工记录模块（包含两种状态状态切换验证） -->
            <view class="panel-card section-margin-bottom">
                <view class="panel-card-title log-title">
                    <text>施工记录</text>
                    <!-- 测试用小切换开关，可在项目实际开发时删除 -->
                    <text class="mock-toggle" @click="hasRecords = !hasRecords">切换模拟[有/无]记录</text>
                </view>

                <!-- 状态 A：无上门记录 -->
                <view v-if="!hasRecords" class="empty-record-box">
                    <text class="empty-text">暂无记录</text>
                    <text class="link-btn" @click="handleAction('create')">去新建</text>
                </view>

                <!-- 状态 B：有上门记录 -->
                <view v-else class="record-timeline">
                    <!-- 记录一 -->
                    <view class="record-item line-gray">
                        <view class="record-icon-dot text-blue"><wd-icon name="check-circle" size="16px" /></view>
                        <view class="record-body-content">
                            <view class="record-header">
                                <text class="record-status text-blue">已完成</text>
                                <text class="record-action-link" @click="handleAction('view')">去查看</text>
                            </view>
                            <view class="record-text">已与张先生确认 10 点准时上门。</view>
                            <view class="record-time">2026-10-05 22:09:30</view>
                        </view>
                    </view>

                    <!-- 记录二 -->
                    <view class="record-item">
                        <view class="record-icon-dot text-gray"><wd-icon name="minus-circle" size="16px" /></view>
                        <view class="record-body-content">
                            <view class="record-header">
                                <text class="record-status text-gray">创建任务</text>
                                <text class="record-action-link link-edit" @click="handleAction('edit')">去编辑</text>
                            </view>
                            <view class="record-time mgt-8">2026-10-05 20:09:30</view>
                        </view>
                    </view>
                </view>
            </view>
        </scroll-view>

        <!-- 4. 吸底固定的全部完工操作栏 -->
        <view class="footer-action-bar">
            <button class="primary-action-btn" @click="handleAction('completeAll')">全部完工</button>
        </view>
    </view>
</template>

<script setup>
import { ref } from 'vue'

// 控制展现形式的核心逻辑开关：true 代表展示有记录，false 代表展示无记录
const hasRecords = ref(false)

const handleAction = (type) => {
    uni.showToast({
        title: `点击了操作: ${type}`,
        icon: 'none'
    })
}
</script>

<style scoped lang="scss">
.page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #f7f9fc;
}

/* 独立可滚动区域 */
.detail-scroll-view {
    flex: 1;
    padding: 24rpx 24rpx 0 24rpx;
    box-sizing: border-box;
    overflow-y: auto;
}

/* 基础通用卡片 */
.panel-card {
    background-color: #ffffff;
    border-radius: 16rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.01);
}
.panel-card-title {
    display: flex;
    align-items: center;
    font-size: 28rpx;
    font-weight: bold;
    color: #333333;
    margin-bottom: 32rpx;
}

/* 1. 头部蓝色核心特制卡片 */
.main-info-card {
    background-color: #ffffff;
    border-radius: 16rpx;
    overflow: hidden;
    margin-bottom: 24rpx;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.01);

    .card-header-blue {
        background-color: #2979ff;
        padding: 24rpx 32rpx;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .title-area {
            display: flex;
            align-items: center;
        }
        .shop-name {
            font-size: 34rpx;
            font-weight: bold;
            color: #ffffff;
        }
        .status-badge {
            background-color: rgba(255, 255, 255, 0.25);
            color: #ffffff;
            font-size: 24rpx;
            padding: 6rpx 20rpx;
            border-radius: 40rpx;
        }
    }

    .card-body {
        padding: 32rpx;
    }
}

/* 地址展现形态 */
.address-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-top: 8rpx;
    margin-bottom: 24rpx;

    .address-detail {
        font-size: 30rpx;
        color: #333333;
        font-weight: 500;
        flex: 1;
        line-height: 1.4;
    }
    .loc-icon {
        margin-left: 20rpx;
        margin-top: 4rpx;
    }
}

/* 联系人平行排版 */
.contact-grid {
    display: flex;
    margin-bottom: 12rpx;

    .contact-cell {
        flex: 1;
    }
}

/* 细体表单公用文本标签 */
.label-text {
    font-size: 24rpx;
    color: #999999;
}
.value-text {
    font-size: 28rpx;
    color: #333333;
    margin-top: 6rpx;
}
.phone-color {
    color: #2979ff;
}
.font-bold {
    font-weight: bold;
}

/* 分割线 */
.divider-line {
    height: 1rpx;
    background-color: #f1f3f7;
    margin: 28rpx 0;
}

/* 副标题小修饰 */
.section-sub-title {
    display: flex;
    align-items: center;
    font-size: 28rpx;
    font-weight: bold;
    color: #333333;
    margin-bottom: 20rpx;
}

/* 纯文本对齐信息组 */
.info-data-list {
    .data-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 16rpx;
        font-size: 26rpx;

        .data-label {
            color: #888888;
        }
        .data-value {
            color: #333333;
            font-weight: 500;
        }
    }
}

/* 施工要求灰色区域 */
.requirement-box {
    background-color: #f7f9fc;
    border-radius: 12rpx;
    padding: 24rpx;

    .req-item {
        font-size: 26rpx;
        color: #444444;
        line-height: 1.6;
    }
}

/* 2. 时间轴时间节点模块样式 */
.timeline-container {
    padding-left: 10rpx;
}
.timeline-item {
    position: relative;
    padding-left: 44rpx;
    padding-bottom: 40rpx;

    /* 模拟连贯时间轴线条 */
    &::before {
        content: '';
        position: absolute;
        left: 10rpx;
        top: 24rpx;
        bottom: -12rpx;
        width: 4rpx;
    }

    &.line-green::before {
        background-color: #2ecc71;
    }
    &.line-blue::before {
        background-color: #2979ff;
    }
    &.line-gray::before {
        background-color: #d8d8d8;
    }
    &:last-child::before {
        display: none;
    }
}

.timeline-dot {
    position: absolute;
    left: 0;
    top: 10rpx;
    width: 24rpx;
    height: 24rpx;
    border-radius: 50%;
    z-index: 2;

    &.dot-green {
        background-color: #2ecc71;
        box-shadow: 0 0 0 6rpx rgba(46, 204, 113, 0.2);
    }
    &.dot-blue {
        background-color: #2979ff;
        box-shadow: 0 0 0 6rpx rgba(41, 121, 255, 0.2);
    }
    &.dot-gray {
        background-color: #c8c8c8;
    }
}

.timeline-content {
    .step-header {
        display: flex;
        align-items: center;
        font-size: 28rpx;
        font-weight: bold;
    }
    .step-status {
        margin-right: 24rpx;
        min-width: 110rpx;
    }
    .step-name {
        color: #333333;
    }
    .step-desc {
        font-size: 24rpx;
        color: #999999;
        margin-top: 8rpx;
    }
}

/* 3. 施工记录专属样式 */
.log-title {
    justify-content: space-between;
}
.mock-toggle {
    font-size: 20rpx;
    color: #ff9800;
    font-weight: normal;
    text-decoration: underline;
}

/* 空白态样式 */
.empty-record-box {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 60rpx 0;
    font-size: 28rpx;

    .empty-text {
        color: #333333;
        font-weight: 500;
    }
    .link-btn {
        color: #2979ff;
        margin-left: 12rpx;
        font-weight: bold;
    }
}

/* 有数据时的时间轴样式 */
.record-timeline {
    padding-left: 10rpx;
}
.record-item {
    position: relative;
    padding-left: 44rpx;
    padding-bottom: 32rpx;

    &::before {
        content: '';
        position: absolute;
        left: 14rpx;
        top: 28rpx;
        bottom: -10rpx;
        width: 2rpx;
    }
    &.line-gray::before {
        background-color: #d8d8d8;
    }
    &:last-child::before {
        display: none;
    }
}

.record-icon-dot {
    position: absolute;
    left: 0;
    top: 2rpx;
    z-index: 2;
    background-color: #ffffff;
}

.record-body-content {
    .record-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .record-status {
        font-size: 28rpx;
        font-weight: bold;
    }
    .record-action-link {
        font-size: 26rpx;
        color: #2979ff;
        font-weight: 500;

        &.link-edit {
            color: #2979ff;
        }
    }
    .record-text {
        font-size: 26rpx;
        color: #444444;
        margin-top: 10rpx;
    }
    .record-time {
        font-size: 24rpx;
        color: #999999;
        margin-top: 6rpx;
    }
}

/* 文本公共状态颜色定义 */
.text-green {
    color: #2ecc71;
}
.text-blue {
    color: #2979ff;
}
.text-gray {
    color: #999999;
}
.mgr-6 {
    margin-right: 12rpx;
}
.mgr-8 {
    margin-right: 16rpx;
}
.mgt-8 {
    margin-top: 16rpx;
}
.section-margin-bottom {
    margin-bottom: 160rpx;
}

/* 4. 底部署名固定的操作安全区域 */
.footer-action-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    background-color: #ffffff;
    padding: 24rpx 32rpx;
    padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.04);
    z-index: 99;

    .primary-action-btn {
        background-color: #2979ff;
        color: #ffffff;
        font-size: 30rpx;
        font-weight: bold;
        height: 88rpx;
        line-height: 88rpx;
        border-radius: 16rpx;
        border: none;

        &::after {
            border: none;
        }
        &:active {
            background-color: #1a65eb;
        }
    }
}
</style>
