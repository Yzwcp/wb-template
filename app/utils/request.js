import { baseUrl } from "./config";
import { useGlobalStore } from "../store/global";

const DEFAULT_CONFIG = {
  baseURL: baseUrl,
  timeout: 15000,
  header: {
    "Content-Type": "application/json",
  },
};

let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

/** 统一跳转登录页 */
function redirectToLogin(message) {
  const store = useGlobalStore();
  store.clearAll();
  uni.showModal({
    title: "提示",
    content: message || "登录已过期，请重新登录",
    success({ confirm }) {
      if (confirm) {
        uni.reLaunch({ url: "/pages/login/login" });
      }
    },
  });
}

async function handleTokenExpired() {
  const store = useGlobalStore();
  const refreshTok = store.token;
  if (!refreshTok) {
    redirectToLogin("未登录，请先登录");
    return false;
  }

  if (!isRefreshing) {
    isRefreshing = true;
    try {
      const res = await uni.request({
        url: baseUrl + "/api/auth/refresh",
        method: "POST",
        header: { "Content-Type": "application/json" },
        data: { refreshToken: refreshTok },
        timeout: 10000,
      });
      if (res.data && res.data.code === 200 && res.data.data?.token) {
        const newToken = res.data.data.token;
        store.setToken(newToken);
        isRefreshing = false;
        onRefreshed(newToken);
        return true;
      }
      isRefreshing = false;
      refreshSubscribers = [];
      redirectToLogin("登录已过期，请重新登录");
      return false;
    } catch {
      isRefreshing = false;
      refreshSubscribers = [];
      redirectToLogin("登录已过期，请重新登录");
      return false;
    }
  }

  // 等待刷新完成
  return new Promise((resolve) => {
    addRefreshSubscriber((newToken) => {
      resolve(!!newToken);
    });
  });
}

export const request = (config) => {
  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    header: { ...DEFAULT_CONFIG.header, ...config.header },
  };

  const store = useGlobalStore();
  if (store.token) {
    mergedConfig.header["Authorization"] = `Bearer ${store.token}`;
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: mergedConfig.baseURL + mergedConfig.url,
      method: mergedConfig.method || "GET",
      data: mergedConfig.data,
      header: mergedConfig.header,
      timeout: mergedConfig.timeout,
      success: async (res) => {
        uni.hideLoading();
        // 401 需要刷新 token 或重新登录
        if (res.statusCode === 401 || (res.data && res.data.code === 401)) {
          const refreshed = await handleTokenExpired();
          if (refreshed) {
            // 用新 token 重试原请求
            const newStore = useGlobalStore();
            mergedConfig.header["Authorization"] = `Bearer ${newStore.token}`;
            uni.request({
              url: mergedConfig.baseURL + mergedConfig.url,
              method: mergedConfig.method || "GET",
              data: mergedConfig.data,
              header: mergedConfig.header,
              timeout: mergedConfig.timeout,
              success: (retryRes) => {
                if (retryRes.statusCode === 200 && retryRes.data?.code === 200) {
                  resolve(retryRes.data.data);
                } else {
                  const msg = retryRes.data?.message || "请求失败";
                  uni.showToast({ title: msg, icon: "none" });
                  reject(retryRes.data);
                }
              },
              fail: (err) => {
                uni.showToast({ title: "网络异常", icon: "none" });
                reject(err);
              },
            });
          } else {
            reject(res.data);
          }
          return;
        }

        if (res.statusCode !== 200 || res.data?.code !== 200) {
          const msg = res.data?.message || "请求失败";
          uni.showToast({ title: msg, icon: "none" });
          reject(res.data);
        } else {
          resolve(res.data.data);
        }
      },
      fail: (err) => {
        uni.hideLoading();
        uni.showToast({ title: "网络异常，请检查网络连接", icon: "none" });
        reject(err);
      },
    });
  });
};

export const get = (url, data = {}, config = {}) => {
  return request({ ...config, url, method: "GET", data });
};

export const post = (url, data = {}, config = {}) => {
  return request({ ...config, url, method: "POST", data });
};

export const put = (url, data = {}, config = {}) => {
  return request({ ...config, url, method: "PUT", data });
};

export const del = (url, config = {}) => {
  return request({ ...config, url, method: "DELETE" });
};
