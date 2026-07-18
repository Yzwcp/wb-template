<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { UserOutlined, ClockCircleOutlined } from '@ant-design/icons-vue'

const userStore = useUserStore()
</script>

<template>
  <div class="dashboard">
    <div class="welcome-card">
      <a-card>
        <template #title>
          <span class="welcome-title">欢迎回来</span>
        </template>
        <div class="user-info-section">
          <a-avatar :size="80" :src="userStore.userInfo?.avatar">
            <template #icon>
              <UserOutlined />
            </template>
          </a-avatar>
          <div class="user-detail">
            <h2>{{ userStore.userInfo?.nickname || userStore.userInfo?.username || '用户' }}</h2>
            <p class="user-role">系统管理员</p>
          </div>
        </div>
      </a-card>
    </div>

    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="8">
        <a-card>
          <template #title>
            <UserOutlined style="margin-right: 8px" />
            用户信息
          </template>
          <div class="info-item">
            <span class="label">用户名：</span>
            <span>{{ userStore.userInfo?.username || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">昵称：</span>
            <span>{{ userStore.userInfo?.nickname || '-' }}</span>
          </div>
        </a-card>
      </a-col>

      <a-col :span="8">
        <a-card>
          <template #title>
            <ClockCircleOutlined style="margin-right: 8px" />
            快捷入口
          </template>
          <p>欢迎使用管理后台系统</p>
        </a-card>
      </a-col>

      <a-col :span="8">
        <a-card>
          <template #title>
            <ClockCircleOutlined style="margin-right: 8px" />
            系统信息
          </template>
          <p>当前版本：v1.0.0</p>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<style lang="less" scoped>
.dashboard {
  .welcome-card {
    margin-bottom: 16px;
  }

  .welcome-title {
    font-size: 18px;
    font-weight: 600;
  }

  .user-info-section {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 16px 0;
  }

  .user-detail {
    h2 {
      margin: 0 0 8px 0;
      font-size: 22px;
    }

    .user-role {
      margin: 0;
      color: #999;
      font-size: 14px;
    }
  }

  .info-item {
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .label {
      color: #999;
      margin-right: 8px;
    }
  }
}
</style>
