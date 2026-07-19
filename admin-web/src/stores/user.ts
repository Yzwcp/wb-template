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

// ===== localStorage 持久化工具 =====
const PREFIX = "persist:";
function loadStr(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}
function saveStr(key: string, val: string) {
  try {
    localStorage.setItem(PREFIX + key, val);
  } catch {}
}
function removeKey(key: string) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {}
}
function loadJSON<T>(key: string, fallback: T): T {
  const raw = loadStr(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function saveJSON(key: string, val: any) {
  saveStr(key, JSON.stringify(val));
}

// ===== Store keys =====
const K_USER_INFO = "user_info";
const K_PERMS = "permissions";
const K_MENUS = "menus";

export const useUserStore = defineStore("user", () => {
  const token = ref<string>(getToken() || "");
  const refreshToken = ref<string>("");
  // 从 localStorage 恢复，刷新后立即有数据
  const userInfo = ref<UserInfo | null>(loadJSON(K_USER_INFO, null));
  const permissions = ref<string[]>(loadJSON(K_PERMS, []));
  const menus = ref<any[]>(loadJSON(K_MENUS, []));
  // menusLoaded 保持 false，路由守卫仍会调用 fetchUserInfo 获取最新数据
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
    // 持久化登录返回的基础信息（完整信息在 fetchUserInfo 后覆盖）
    saveJSON(K_USER_INFO, res.userInfo);
    // 登录后立即拉取完整信息（菜单+权限）
    await fetchUserInfo();
  }

  /** 获取用户信息 */
  async function fetchUserInfo() {
    const res = await authApi.getUserInfo();
    userInfo.value = res.userInfo;
    permissions.value = res.permissions || [];
    menus.value = res.menus || [];
    menusLoaded.value = true;
    // 持久化
    saveJSON(K_USER_INFO, res.userInfo);
    saveJSON(K_PERMS, res.permissions || []);
    saveJSON(K_MENUS, res.menus || []);
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
    // 清除持久化
    removeKey(K_USER_INFO);
    removeKey(K_PERMS);
    removeKey(K_MENUS);

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
});
