<template>
  <view class="login-page">
    <!-- 顶部状态栏占位，防止内容顶格 -->
    <view class="status-bar"></view>

    <!-- 欢迎头部区域 -->
    <view class="welcome-header">
      <text class="title">欢迎登录</text>
      <text class="subtitle">智能合同与客户管理系统</text>
    </view>

    <!-- 登录表单核心区 -->
    <view class="login-form">
      <!-- 账号输入 -->
      <view class="input-item">
        <view class="input-label">账号</view>
        <wd-input
          v-model="account"
          placeholder="请输入手机号或用户名"
          clearable
          no-border
          prefix-icon="user"
          custom-class="custom-login-input"
        />
      </view>

      <!-- 密码输入 -->
      <view class="input-item">
        <view class="input-label">密码</view>
        <wd-input
          v-model="password"
          placeholder="请输入登录密码"
          show-password
          clearable
          no-border
          prefix-icon="lock"
          custom-class="custom-login-input"
        />
      </view>

      <!-- 辅助操作行 -->
      <view class="action-row">
        <view class="remember-me">
          <wd-checkbox
            v-model="isRemember"
            shape="square"
            checked-color="#0066ff"
          >
            <text class="protocol-text">记住密码</text>
          </wd-checkbox>
        </view>
        <!-- <text class="forget-pwd-btn" @click="handleForgetPassword">忘记密码？</text> -->
      </view>

      <!-- 登录按钮 -->
      <view class="btn-box">
        <wd-button
          type="primary"
          block
          size="large"
          :loading="loading"
          custom-class="submit-login-btn"
          @click="handleLogin"
          >立即登录</wd-button
        >
      </view>
    </view>

    <!-- 底部协议声明 -->
    <view class="protocol-footer">
      <text class="gray-txt">登录即代表您已同意</text>
      <text class="blue-link" @click="viewProtocol('service')"
        >《服务协议》</text
      >
      <text class="gray-txt">与</text>
      <text class="blue-link" @click="viewProtocol('privacy')"
        >《隐私政策》</text
      >
    </view>
  </view>
</template>

<script setup>
import { ref } from "vue";
import { login, getLoginUser, getUserMenu } from "@/api/auth";
import { useGlobalStore } from "@/store/global";
import { doSm2Encrypt } from "@/utils/tools";
const account = ref("");
const password = ref("");
const isRemember = ref(false);
const loading = ref(false);

const globalStore = useGlobalStore();

function toggleRemember() {
  isRemember.value = !isRemember.value;
  console.log(isRemember.value);
}

function handleForgetPassword() {
  uni.showToast({ title: "请联系系统管理员重置密码", icon: "none" });
}

function viewProtocol(type) {
  uni.showToast({
    title: `查看${type === "service" ? "服务协议" : "隐私政策"}`,
    icon: "none",
  });
}

// 登录逻辑处理
async function handleLogin() {
  if (!account.value.trim()) {
    uni.showToast({ title: "请输入账号", icon: "none" });
    return;
  }
  if (!password.value.trim()) {
    uni.showToast({ title: "请输入密码", icon: "none" });
    return;
  }

  // 2. 加密密码
  const encryptedPassword = doSm2Encrypt(password.value.trim());

  loading.value = true;

  try {
    // 1. 调用登录接口，获取 token
    const loginRes = await login({
      account: account.value.trim(),
      password: encryptedPassword,
    });
    console.log(loginRes);

    const token = loginRes;
    globalStore.setToken(token);

    // 2. 并行获取用户信息和菜单
    const [userRes, menuRes] = await Promise.all([
      getLoginUser({}),
      getUserMenu({}),
    ]);

    // 3. 缓存用户信息
    globalStore.setUserInfo(userRes);

    // 4. 缓存菜单列表
    globalStore.setMenuList(menuRes);

    loading.value = false;

    uni.showToast({
      title: "登录成功",
      icon: "success",
      success: () => {
        setTimeout(() => {
          uni.reLaunch({
            url: "/pages/tab/index",
          });
        }, 1200);
      },
    });
  } catch (err) {
    loading.value = false;
    uni.showToast({ title: err?.message || "登录失败", icon: "none" });
  }
}
</script>

<style scoped lang="scss">
.login-page {
  width: 100%;
  min-height: 100vh;
  background-color: #ffffff;
  padding: 0 60rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.status-bar {
  height: var(--status-bar-height);
  width: 100%;
}

/* 头部欢迎语 */
.welcome-header {
  margin-top: 120rpx;
  margin-bottom: 80rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;

  .title {
    font-size: 56rpx;
    font-weight: bold;
    color: #333333;
    letter-spacing: 2rpx;
  }
  .subtitle {
    font-size: 28rpx;
    color: #999999;
  }
}

/* 表单录入项 */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
}

.input-item {
  display: flex;
  flex-direction: column;
  gap: 16rpx;

  .input-label {
    font-size: 28rpx;
    font-weight: bold;
    color: #444444;
    padding-left: 8rpx;
  }
}

/* 覆盖 Wot UI 输入框底层背景颜色，贴合视觉 */
:deep(.custom-login-input) {
  background-color: #f7f8fa !important;
  border-radius: 16rpx;
  padding: 24rpx 28rpx;
  font-size: 30rpx;

  .wd-input__icon {
    color: #999999;
    font-size: 36rpx;
    margin-right: 12rpx;
  }
}

/* 记住密码与忘记密码 */
.action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10rpx;
  padding: 0 4rpx;

  .protocol-text {
    font-size: 26rpx;
    color: #666666;
  }
  .forget-pwd-btn {
    font-size: 26rpx;
    color: #999999;
  }
}

/* 登录按钮盒子 */
.btn-box {
  margin-top: 50rpx;

  :deep(.submit-login-btn) {
    background-color: #0066ff !important;
    border-radius: 16rpx;
    height: 96rpx;
    font-size: 32rpx;
    font-weight: bold;
    box-shadow: 0 8rpx 20rpx rgba(0, 102, 255, 0.15);
  }
}

/* 底部协议声明 */
.protocol-footer {
  margin-top: auto;
  margin-bottom: 60rpx;
  text-align: center;
  font-size: 24rpx;
  line-height: 1.5;

  .gray-txt {
    color: #999999;
  }
  .blue-link {
    color: #0066ff;
    font-weight: 500;
  }
}
</style>
