<script setup lang="ts">
import { ConfigProvider } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import { onMounted } from 'vue'
import { useDictStore } from '@/stores/dict'

const dictStore = useDictStore()
// 页面初始化时加载所有字典，登录页即可使用，不阻塞渲染
dictStore.loadAll()
</script>

<template>
  <ConfigProvider :locale="zhCN">
    <router-view />
  </ConfigProvider>
</template>
