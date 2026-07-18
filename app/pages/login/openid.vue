<template>
  <view class="openid-page">
    <view class="loading-box">
      <!-- 加载状态 -->
      <wd-loading v-if="status === 'loading'" />
      <!-- 错误状态 -->
      <view v-if="status === 'error'" class="error-box">
        <text class="error-icon">!</text>
        <text class="error-text">授权登录失败</text>
        <text class="error-desc">{{ errorMsg }}</text>
      </view>
      <text class="loading-text">{{ statusText }}</text>
      <wd-button
        v-if="status === 'error'"
        type="primary"
        size="medium"
        custom-class="retry-btn"
        @click="redirectToOAuth"
      >
        重新授权
      </wd-button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from "vue";
import { onMounted } from "vue";
import { getOpenidByCode, getLoginUser, getUserMenu, login } from "@/api/auth";
import { useGlobalStore } from "@/store/global";
import { weworkConfig } from "@/utils/config";
import { onLoad } from "@dcloudio/uni-app";

const globalStore = useGlobalStore();

const status = ref("loading"); // loading | error
const errorMsg = ref("");
const statusText = computed(() => {
  if (status.value === "loading") return "正在获取授权信息...";
  return "请点击按钮重新授权";
});

/**
 * 从URL中获取指定参数值
 */
function getQueryParam(key) {
  // #ifdef H5
  const search = window.location.search;
  const params = new URLSearchParams(search);
  return params.get(key);
  // #endif
  // #ifndef H5
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  return currentPage?.options?.[key] || "";
  // #endif
}

/**
 * 构建企业微信OAuth授权URL
 */
function buildOAuthUrl() {
  const corpId = weworkConfig.corpId;
  if (!corpId) {
    throw new Error("请先在 utils/config.js 中配置企业微信 corpId");
  }
  // 当前页面地址作为回调地址
  const redirectUri = encodeURIComponent(window.location.href.split("?")[0]);
  const state = Date.now().toString();
  return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${corpId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_base&state=${state}#wechat_redirect`;
}

/**
 * 清理URL中的code参数，防止过期code被重复使用
 */
function cleanCodeFromUrl() {
  // #ifdef H5
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  window.history.replaceState({}, "", url.toString());
  // #endif
}

/**
 * 用code换取openid并登录
 */
async function handleOpenidLogin(code) {
  // 先把code从URL上清掉，防止失效后刷新页面再次触发
  // cleanCodeFromUrl();

  try {
    uni.showLoading({ title: "授权登录中...", mask: true });

    // 1. 用code换取token/openid
    const openid = await getOpenidByCode({
      code,
      state: "",
    });

    if (openid) {
      globalStore.setOpenid(openid);
      const { token } = await login({ wxCpOpenid: openid });
      if (token) globalStore.setToken(token);
      // 4. 并行获取用户信息和菜单
      const [userRes, menuRes] = await Promise.all([
        getLoginUser({}),
        getUserMenu({}),
      ]);

      // 5. 缓存用户信息
      globalStore.setUserInfo(userRes);

      // 6. 缓存菜单列表
      globalStore.setMenuList(menuRes);

      uni.hideLoading();

      // 7. 跳转首页
      uni.reLaunch({
        url: "/pages/tab/index",
      });
    }
  } catch (err) {
    uni.hideLoading();
    console.error("openid登录失败:", err);
    // 显示错误状态，由用户手动点击"重新授权"，避免无限循环
    status.value = "error";
    errorMsg.value = err?.msg || err?.message || "网络异常，请稍后重试";
  }
}

/**
 * 跳转到企业微信授权页面
 */
function redirectToOAuth() {
  // #ifdef H5
  try {
    const oauthUrl = buildOAuthUrl();
    window.location.replace(oauthUrl);
  } catch (e) {
    uni.showToast({ title: e.message || "OAuth配置错误", icon: "none" });
  }
  // #endif
}

onLoad(() => {
  const code = getQueryParam("code");
  alert(code);
  if (code) {
    // 携带code参数，说明是OAuth回调，直接登录
    handleOpenidLogin(code);
  } else {
    // 无code参数，跳转企业微信授权
    redirectToOAuth();
  }
});
</script>

<style scoped lang="scss">
.openid-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
}

.loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30rpx;

  .loading-text {
    font-size: 28rpx;
    color: #999999;
  }
}

.error-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;

  .error-icon {
    width: 80rpx;
    height: 80rpx;
    line-height: 80rpx;
    text-align: center;
    border-radius: 50%;
    background-color: #ff4d4f;
    color: #ffffff;
    font-size: 48rpx;
    font-weight: bold;
  }

  .error-text {
    font-size: 32rpx;
    color: #333333;
    font-weight: 500;
  }

  .error-desc {
    font-size: 24rpx;
    color: #999999;
  }
}

:deep(.retry-btn) {
  margin-top: 20rpx;
  border-radius: 12rpx;
}
</style>
