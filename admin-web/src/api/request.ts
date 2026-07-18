import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { notification } from "ant-design-vue";
import {
  getToken,
  getRefreshToken,
  setTokens,
  removeToken,
} from "@/utils/token";
import type { ApiResponse, RefreshTokenResult } from "@/types/menu";

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

async function doRefreshToken(): Promise<string> {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error("无 refreshToken");
    const { data } = await axios.post<ApiResponse<RefreshTokenResult>>(
      (import.meta.env.VITE_API_BASE || "") + "/api/auth/refresh",
      { refreshToken },
    );
    if (data.code === 200) {
      const { token, refreshToken: newRefreshToken } = data.data;
      setTokens(token, newRefreshToken);
      return token;
    }
    throw new Error("刷新 Token 失败");
  } catch (err) {
    removeToken();
    window.location.href = "/login";
    throw err;
  }
}

/** 全局错误通知 */
function notifyError(msg: string) {
  notification.error({
    message: "请求失败",
    description: msg,
    duration: 3,
    placement: "topRight",
  });
}

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

request.interceptors.response.use(
  (response) => {
    if (response.config.responseType === "blob") return response;
    const res = response.data as ApiResponse;
    if (res.code === 200) return res.data;
    // 业务错误 → 全局通知
    const msg = res.message || "请求失败";
    notifyError(msg);
    return Promise.reject(new Error(msg));
  },
  async (error: AxiosError<ApiResponse>) => {
    const { response, config } = error;

    if (response?.status === 401 && config) {
      const url = config.url || "";
      if (url.includes("/auth/login") || url.includes("/auth/refresh"))
        return Promise.reject(error);
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await doRefreshToken();
          refreshQueue.forEach((item) => item.resolve(newToken));
          refreshQueue = [];
          if (config.headers) config.headers.Authorization = `Bearer ${newToken}`;
          return request(config);
        } catch (err) {
          refreshQueue.forEach((item) => item.reject(err));
          refreshQueue = [];
          removeToken();
          window.location.href = "/login";
          return Promise.reject(err);
        } finally { isRefreshing = false; }
      }
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (token: string) => {
            if (config.headers) config.headers.Authorization = `Bearer ${token}`;
            resolve(request(config));
          },
          reject,
        });
      });
    }

    // HTTP 错误（400+）→ 全局通知
    const backendMsg = (response?.data as any)?.message;
    const errorMsg = backendMsg || error.message || "网络错误";
    console.error("[API Error]", errorMsg, response?.status, response?.data);
    notifyError(errorMsg);
    return Promise.reject(new Error(errorMsg));
  },
);

export default request;
