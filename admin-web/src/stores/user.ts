import { defineStore } from "pinia";
import { ref } from "vue";
import {
  getToken,
  setToken,
  setRefreshToken,
  removeToken,
} from "@/utils/token";
import * as authApi from "@/api/auth";
import { useDictStore } from "@/stores/dict";
import type { LoginParams, UserInfo } from "@/types/menu";

export const useUserStore = defineStore(
  "user",
  () => {
    const token = ref<string>(getToken() || "");
    const refreshToken = ref<string>("");
    const userInfo = ref<UserInfo | null>(null);
    const permissions = ref<string[]>([]);
    const menus = ref<any[]>([]);
    const menusLoaded = ref(false);

    /** 登录 */
    async function login(credentials: LoginParams) {
      const res = await authApi.login(
        credentials.username,
        credentials.password
      );
      token.value = res.token;
      refreshToken.value = res.refreshToken;
      userInfo.value = res.userInfo;
      setToken(res.token);
      setRefreshToken(res.refreshToken);
      // 登录后立即拉取完整信息（菜单+权限），此时 persist 自动保存到 localStorage
      await fetchUserInfo();
    }

    /** 获取用户信息 */
    async function fetchUserInfo() {
      const res = await authApi.getUserInfo();
      userInfo.value = res.userInfo;
      permissions.value = res.permissions || [];
      menus.value = res.menus || [];
      menusLoaded.value = true;
      // pinia-plugin-persistedstate 自动保存 userInfo/permissions/menus
    }

    /** 刷新 Token */
    async function doRefreshToken() {
      const res = await authApi.refreshToken(refreshToken.value);
      token.value = res.token;
      refreshToken.value = res.refreshToken;
      setToken(res.token);
      setRefreshToken(res.refreshToken);
    }

    /** 退出登录 */
    async function logout() {
      try {
        await authApi.logout();
      } catch {
        // 即使接口失败也要清除本地状态
      }
      token.value = "";
      refreshToken.value = "";
      userInfo.value = null;
      permissions.value = [];
      menus.value = [];
      menusLoaded.value = false;
      removeToken();
      // 清空字典缓存
      useDictStore().reset();
    }

    return {
      token,
      refreshToken,
      userInfo,
      permissions,
      menus,
      menusLoaded,
      login,
      fetchUserInfo,
      doRefreshToken,
      logout,
    };
  },
  {
    persist: {
      key: "persist:user",
      storage: localStorage,
      pick: ["userInfo", "permissions", "menus"],
    },
  }
);
