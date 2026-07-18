import { defineStore } from "pinia";
import { ref } from "vue";
import { getDeviceInfo } from "../utils/tools.js";
import { mpLogin, refreshToken } from "@/api/auth";

export const useGlobalStore = defineStore(
  "global",
  () => {
    const userInfo = ref({});
    const token = ref("");
    const systemInfo = ref({});

    const setToken = (val) => {
      token.value = val;
    };

    const setUserInfo = (info) => {
      userInfo.value = info;
    };

    const clearAll = () => {
      token.value = "";
      userInfo.value = {};
    };

    const login = async () => {
      if (token.value) return true;
      try {
        const { code } = await uni.login({ provider: "weixin" });
        if (!code) {
          console.error("[Store] wx.login 获取 code 失败");
          return false;
        }
        const res = await mpLogin({ code });
        if (res.token) {
          setToken(res.token);
          if (res.userInfo) setUserInfo(res.userInfo);
          return true;
        }
        return false;
      } catch (err) {
        console.error("[Store] 小程序登录失败:", err);
        return false;
      }
    };

    const doRefreshToken = async () => {
      try {
        const res = await refreshToken({ refreshToken: token.value });
        if (res.token) {
          setToken(res.token);
          return true;
        }
        return false;
      } catch {
        clearAll();
        return false;
      }
    };

    const initSystemInfo = async () => {
      try {
        const res = getDeviceInfo();
        if (res.success) {
          systemInfo.value = res.data;
        } else {
          console.error("获取设备信息失败：", res.message);
          systemInfo.value = { screenWidth: 0, screenHeight: 0 };
        }
      } catch (error) {
        console.error("初始化设备信息异常：", error);
        systemInfo.value = { screenWidth: 0, screenHeight: 0 };
      }
    };

    return {
      userInfo, token, systemInfo,
      setToken, setUserInfo, clearAll,
      login, doRefreshToken, initSystemInfo,
    };
  },
  {
    persist: {
      key: "global-store",
      storage: {
        getItem: (key) => uni.getStorageSync(key),
        setItem: (key, value) => uni.setStorageSync(key, value),
        removeItem: (key) => uni.removeStorageSync(key),
      },
      paths: ["userInfo", "token"],
    },
  },
);
