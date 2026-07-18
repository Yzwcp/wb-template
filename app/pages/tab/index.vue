<template>
    <view class="page">
        <!-- 顶部蓝色渐变背景与用户信息区 -->
        <view class="header-section">
            <!-- 用户资料卡片 -->
            <view class="user-info-box">
                <image class="avatar" src="https://img.yzcdn.cn/vant/cat.jpeg" mode="aspectFill"></image>
                <view class="user-details">
                    <text class="username">{{ userInfo.name }}</text>
                    <text class="role">{{ userInfo.positionName }}</text>
                    <!-- <text class="date">2026-07-20 周三</text> -->
                </view>
            </view>
        </view>

        <!-- 内容主体区域（向上负外边距实现叠加效果） -->
        <view class="content-container">
            <!-- 常用功能模块 -->
            <view class="card-panel">
                <view class="panel-title">常用功能</view>
                <view class="grid-two-columns">
                    <!-- 我的客户 -->
                    <view class="feature-item client-bg" @click="go('/pages/customer/list')">
                        <view class="icon-wrapper client-icon-box">
                            <wd-icon name="user" size="22px" color="#1976d2" />
                        </view>
                        <view class="info-wrapper">
                            <view class="item-label text-blue">我的客户</view>
                            <view class="item-value text-blue">
                                <wd-count-to :end-val="workData.customerCount" color="#0d47a1" font-size="24px" bold />
                                <text class="unit">位客户</text>
                            </view>
                        </view>
                    </view>

                    <!-- 消息中心 -->
                    <view class="feature-item message-bg">
                        <view class="icon-wrapper message-icon-box">
                            <wd-icon name="chat" size="22px" color="#2e7d32" />
                        </view>
                        <view class="info-wrapper">
                            <view class="item-label text-green" @click="go('/pages/message/message')">消息中心</view>
                            <view class="item-value text-green">
                                <wd-count-to :end-val="workData.unreadMessageCount" color="#1b5e20" font-size="24px" bold />
                                <text class="unit">条新消息</text>
                            </view>
                        </view>
                    </view>
                </view>
            </view>

            <!-- 快捷操作模块 -->
            <view class="shortcut-section">
                <view class="panel-title">快捷操作</view>
                <view class="grid-two-columns">
                    <!-- 今日拜访 -->
                    <view class="shortcut-card bg-orange-light">
                        <wd-icon name="edit-outline" size="32px" color="#ff7043" />
                        <text class="shortcut-label">今日拜访</text>
                    </view>
                    <!-- 回访列表 -->
                    <view class="shortcut-card bg-yellow-light" @click="go('/pages/visit/visit')">
                        <wd-icon name="heart" size="32px" color="#ffa726" />
                        <text class="shortcut-label">回访列表</text>
                    </view>
                    <!-- 施工列表 -->
                    <view class="shortcut-card bg-blue-light" @click="go('/pages/construction/list')">
                        <wd-icon name="list" size="32px" color="#29b6f6" />
                        <text class="shortcut-label">施工列表</text>
                    </view>
                    <!-- 合同列表 -->
                    <view class="shortcut-card bg-purple-light" @click="go('/pages/contract/contract')">
                        <wd-icon name="certificate" size="32px" color="#ab47bc" />
                        <text class="shortcut-label">合同列表</text>
                    </view>
                    <view class="shortcut-card bg-purple-light" @click="go1('/pages/login/openid')">
                        <wd-icon name="certificate" size="32px" color="#ab47bc" />
                        <text class="shortcut-label">合同列表</text>
                    </view>
                    <!-- 商品中心 -->
                    <view class="shortcut-card bg-green-light" @click="go('/pages/product/list')">
                        <wd-icon name="shop" size="32px" color="#4caf50" />
                        <text class="shortcut-label">商品中心</text>
                    </view>
                    <!-- 我的订单 -->
                    <view class="shortcut-card bg-pink-light" @click="go('/pages/order/list')">
                        <wd-icon name="order" size="32px" color="#e91e63" />
                        <text class="shortcut-label">我的订单</text>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { onLoad, onLaunch } from '@dcloudio/uni-app'
import { workHome } from '@/api/auth'
import { useGlobalStore } from '@/store/global'
import { toRefs, ref } from 'vue'
const globalState = useGlobalStore()
const { userInfo } = toRefs(globalState)

const workData = ref({})
async function init() {
    const data = await workHome({})
    workData.value = data
}

function go(url) {
    uni.$router.push({
        url: url
    })
}
function go1(url) {
    uni.navigateTo({
        url: '/pages/login/openid'
    })
    return
    window.location.href =
        'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxe7e2fa35ea164594&redirect_uri=https%3A%2F%2Fyzw.lanke8.cc%2Fpages%2Fbind%2Findex&response_type=code&scope=snsapi_base&state=2076570178819235842:1784109915480:9520244512a69c2b93351a349677ea7a#wechat_redirect'
}
onLoad(() => {
    init()
})
</script>

<style scoped lang="scss">
:deep(.wd-tabbar) {
    background: transparent !important;
}

.page {
    min-height: 100vh;
    background-color: #f7f9fc;
    padding-bottom: 40rpx;
    box-sizing: border-box;
}

/* 顶部蓝色渐变背景 */
.header-section {
    background: linear-gradient(to bottom, #2998ff 0%, #94cfff 70%, #f7f9fc 100%);
    padding: 80rpx 40rpx 120rpx 40rpx;

    .page-title {
        text-align: center;
        font-size: 36rpx;
        color: #ffffff;
        font-weight: 600;
        margin-bottom: 40rpx;
    }
}

/* 用户信息 */
.user-info-box {
    display: flex;
    align-items: center;

    .avatar {
        width: 130rpx;
        height: 130rpx;
        border-radius: 50%;
        border: 4rpx solid rgba(255, 255, 255, 0.6);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .user-details {
        display: flex;
        flex-direction: column;
        margin-left: 24rpx;
        color: #ffffff;

        .username {
            font-size: 38rpx;
            font-weight: bold;
            letter-spacing: 1rpx;
        }

        .role {
            font-size: 28rpx;
            font-weight: 600;
            margin-top: 6rpx;
            opacity: 0.9;
        }

        .date {
            font-size: 24rpx;
            margin-top: 6rpx;
            opacity: 0.7;
        }
    }
}

/* 主体内容包裹 */
.content-container {
    margin-top: -60rpx;
    padding: 0 32rpx;
}

/* 通用面板标题 */
.panel-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #333333;
    margin-bottom: 24rpx;
}

/* 白底卡片面板 */
.card-panel {
    background-color: #ffffff;
    border-radius: 20rpx;
    padding: 30rpx 24rpx;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
    margin-bottom: 36rpx;
}

/* 两列网格通用布局 */
.grid-two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20rpx;
}

/* 常用功能卡片单项 */
.feature-item {
    display: flex;
    align-items: center;
    padding: 24rpx 16rpx;
    border-radius: 16rpx;

    &.client-bg {
        background-color: #e3f2fd;
    }
    &.message-bg {
        background-color: #e8f5e9;
    }

    .icon-wrapper {
        width: 76rpx;
        height: 76rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #ffffff;
        flex-shrink: 0;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }

    .info-wrapper {
        margin-left: 16rpx;
        overflow: hidden;

        .item-label {
            font-size: 26rpx;
            font-weight: 600;
        }

        .item-value {
            display: flex;
            align-items: baseline;
            margin-top: 4rpx;

            .unit {
                font-size: 20rpx;
                margin-left: 6rpx;
                opacity: 0.8;
            }
        }
    }
}

/* 文本与主题色匹配细节 */
.text-blue {
    color: #1565c0;
}
.text-green {
    color: #2e7d32;
}

/* 快捷操作模块 */
.shortcut-section {
    .shortcut-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 180rpx;
        border-radius: 16rpx;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
        transition: transform 0.1s ease;

        &:active {
            transform: scale(0.98);
        }

        .shortcut-label {
            font-size: 26rpx;
            color: #444444;
            font-weight: 500;
            margin-top: 16rpx;
        }
    }

    /* 快捷卡片背景色微调 */
    .bg-orange-light {
        background-color: #fff3e0;
    }
    .bg-yellow-light {
        background-color: #fffde7;
    }
    .bg-blue-light {
        background-color: #e1f5fe;
    }
   .bg-purple-light {
       background-color: #f3e5f5;
   }
    .bg-green-light {
        background-color: #e8f5e9;
    }
    .bg-pink-light {
        background-color: #fce4ec;
    }
}
</style>
