<script setup lang="ts">
import { ref, computed, h, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons-vue";
import { useUserStore } from "@/stores/user";
import { useAppStore } from "@/stores/app";
import type { MenuItem } from "@/types/menu";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const appStore = useAppStore();

/** 当前选中的菜单项 */
const selectedKeys = ref<string[]>([route.path]);

/** 根据当前路由计算上级展开的菜单 key */
const openKeys = computed(() => {
  const path = route.path;
  const parts = path.split("/").filter(Boolean); // ['system', 'user']
  const open: string[] = [];
  let accumulated = "";
  for (const part of parts) {
    accumulated += "/" + part;
    open.push(accumulated);
  }
  // 去掉最后一个（当前页面本身），只展开父级
  open.pop();
  return open;
});

watch(
  () => route.path,
  (path) => {
    selectedKeys.value = [path];
  },
);

/** 将菜单列表转换为 Ant Design Menu 的 items 格式 */
function convertMenuItems(menus: any[]): any[] {
  return menus
    .filter((m) => !m.hidden && m.type !== "F") // 过滤隐藏项和按钮(F)
    .map((item) => {
      const menuItem: any = {
        key: item.path?.startsWith("/") ? item.path : `/${item.path}`,
        label: item.name,
        title: item.name,
      };

      if (item.icon) {
        menuItem.icon = () =>
          h("span", { class: `anticon anticon-${item.icon}` });
      }

      // 目录类型(M)或菜单类型(C)有子节点时递归
      const visibleChildren = item.children?.filter(
        (c: any) => !c.hidden && c.type !== "F",
      );
      if (visibleChildren && visibleChildren.length > 0) {
        menuItem.children = convertMenuItems(item.children);
      } else if (item.children?.length) {
        // 子菜单全是按钮(F)时父级仍显示
        menuItem.children = [];
      }

      return menuItem;
    })
    .filter((item) => {
      // 过滤掉没有 path、没有 children 的空节点
      return item.key !== "/" || item.children?.length > 0;
    });
}

const menuItems = computed(() => convertMenuItems(userStore.menus));

/** 点击菜单项 */
function handleMenuClick({ key }: { key: string }) {
  router.push(key);
}

/** 退出登录 */
async function handleLogout() {
  await userStore.logout();
  router.push("/login");
}

/** 侧边栏折叠/展开 */
function toggleCollapsed() {
  appStore.toggleSidebar();
}
</script>

<template>
  <a-layout class="default-layout">
    <!-- 侧边栏 -->
    <a-layout-sider
      v-model:collapsed="appStore.sidebarCollapsed"
      :trigger="null"
      collapsible
      class="layout-sider"
    >
      <div class="logo">
        <span v-if="!appStore.sidebarCollapsed">管理后台</span>
        <span v-else class="logo-collapsed">后台</span>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        v-model:openKeys="openKeys"
        mode="inline"
        theme="dark"
        :items="menuItems"
        @click="handleMenuClick"
      />
    </a-layout-sider>

    <!-- 右侧区域 -->
    <a-layout>
      <!-- 顶栏 -->
      <a-layout-header class="layout-header">
        <div class="header-left">
          <span class="trigger" @click="toggleCollapsed">
            <MenuUnfoldOutlined v-if="appStore.sidebarCollapsed" />
            <MenuFoldOutlined v-else />
          </span>
          <span class="page-title">{{ route.meta?.title || "" }}</span>
        </div>
        <div class="header-right">
          <a-dropdown>
            <span class="user-info">
              <a-avatar size="small" :src="userStore.userInfo?.avatar">
                <template #icon>
                  <UserOutlined />
                </template>
              </a-avatar>
              <span class="nickname">{{
                userStore.userInfo?.nickname ||
                userStore.userInfo?.username ||
                "用户"
              }}</span>
            </span>
            <template #overlay>
              <a-menu>
                <a-menu-item key="logout" @click="handleLogout">
                  <LogoutOutlined />
                  退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <!-- 内容区 -->
      <a-layout-content class="layout-content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style lang="less" scoped>
.default-layout {
  height: 100vh;
}

.layout-sider {
  overflow: auto;
}

.logo {
  height: 64px;
  line-height: 64px;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.08);
  white-space: nowrap;
  overflow: hidden;

  .logo-collapsed {
    font-size: 14px;
  }
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  z-index: 1;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;

  .trigger {
    font-size: 18px;
    cursor: pointer;
    transition: color 0.3s;

    &:hover {
      color: #1890ff;
    }
  }

  .page-title {
    font-size: 16px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.85);
    padding-left: 16px;
    border-left: 1px solid #e8e8e8;
  }
}

.header-right {
  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background 0.2s;

    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }
  }

  .nickname {
    font-size: 14px;
  }
}

.layout-content {
  // margin: 10px;
  padding: 14px;
  background: #fffcfc;
  border-radius: 4px;
  min-height: 280px;
  overflow: auto;
}
</style>
