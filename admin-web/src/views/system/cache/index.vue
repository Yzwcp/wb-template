<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined, DeleteOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import * as cacheApi from '@/api/cache'
import type { CacheKeyRecord } from '@/api/cache'

defineOptions({ name: 'SystemCache' })

const infoLoading = ref(false)
const redisInfo = ref<any>(null)
const keyLoading = ref(false)
const keyList = ref<CacheKeyRecord[]>([])
const keyPagination = ref({ current: 1, pageSize: 50, total: 0 })
const searchPattern = ref('')
const allMode = ref(false)

const detailVisible = ref(false)
const detailKey = ref<CacheKeyRecord | null>(null)
const detailLoading = ref(false)

async function loadInfo() {
  infoLoading.value = true
  try { redisInfo.value = await cacheApi.getInfo() } catch { /* ignore */ }
  finally { infoLoading.value = false }
}

async function loadKeys(page?: number, size?: number) {
  keyLoading.value = true
  try {
    const p = page ?? keyPagination.value.current
    const ps = size ?? keyPagination.value.pageSize
    const res = await cacheApi.getKeys({ page: p, pageSize: ps, pattern: searchPattern.value || undefined })
    keyList.value = res.list || []
    keyPagination.value.total = res.total || 0
    keyPagination.value.current = p
  } catch { keyList.value = []; keyPagination.value.total = 0 }
  finally { keyLoading.value = false }
}

async function loadAllKeys() {
  keyLoading.value = true
  allMode.value = true
  try {
    const all = await cacheApi.getAllKeys({ pattern: searchPattern.value || undefined })
    keyList.value = all || []
    keyPagination.value.total = all?.length || 0
    keyPagination.value.current = 1
    keyPagination.value.pageSize = Math.max(all?.length || 0, 1)
  } catch { keyList.value = []; keyPagination.value.total = 0 }
  finally { keyLoading.value = false }
}

function handleSearch() {
  keyPagination.value.current = 1
  allMode.value = false
  loadKeys()
}

function handlePageChange(page: number, size: number) {
  if (allMode.value) return
  loadKeys(page, size)
}

async function handleViewDetail(key: string) {
  detailLoading.value = true
  detailVisible.value = true
  try { detailKey.value = await cacheApi.getKeyDetail(key) }
  finally { detailLoading.value = false }
}

async function handleDeleteKey(key: string) {
  Modal.confirm({
    title: '确认删除', content: `确定删除 "${key}" 吗？`,
    async onOk() {
      try { await cacheApi.deleteKey(key); message.success('删除成功'); allMode.value ? loadAllKeys() : loadKeys() } catch { }
    },
  })
}

async function handleClearAll() {
  Modal.confirm({
    title: '危险操作', content: '确定清空所有缓存？不可恢复！', okType: 'danger',
    async onOk() {
      try { await cacheApi.clearAll(); message.success('已清空'); loadInfo(); allMode.value ? loadAllKeys() : loadKeys() } catch { }
    },
  })
}

function formatTTL(ttl: number): string {
  if (ttl === -1) return '永久'
  if (ttl === -2) return '已过期'
  const h = Math.floor(ttl / 3600), m = Math.floor((ttl % 3600) / 60), s = ttl % 60
  if (h > 0) return `${h}时${m}分${s}秒`
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

function formatBytes(bytes: number | undefined): string {
  if (!bytes || bytes === 0) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

const infoItems = [
  { label: 'Redis 版本', key: 'version' },
  { label: '运行天数', key: 'uptimeInDays' },
  { label: '已用内存', key: 'usedMemoryHuman' },
  { label: '客户端连接数', key: 'connectedClients' },
]

onMounted(() => { loadInfo(); loadKeys() })
</script>

<template>
  <div class="system-cache">
    <a-card title="Redis 信息" :bordered="false" style="margin-bottom:16px">
      <a-spin :spinning="infoLoading">
        <a-row :gutter="[16,16]">
          <a-col v-for="item in infoItems" :key="item.key" :xs="12" :sm="8" :md="6">
            <a-statistic :title="item.label" :value="redisInfo?.[item.key] ?? '-'" />
          </a-col>
        </a-row>
      </a-spin>
    </a-card>

    <a-card :bordered="false">
      <div class="key-toolbar">
        <a-space>
          <a-input-search v-model:value="searchPattern" placeholder="搜索 Key（* 通配符）" style="width:260px" @search="handleSearch" />
          <a-button @click="allMode?loadAllKeys():loadKeys()"><ReloadOutlined /> 刷新</a-button>
          <a-button @click="loadAllKeys"><DownloadOutlined /> 加载全部</a-button>
        </a-space>
        <a-space>
          <span v-if="keyPagination.total" class="total-tip">共 {{ keyPagination.total }} 个 Key</span>
          <a-button danger @click="handleClearAll"><DeleteOutlined /> 清空所有</a-button>
        </a-space>
      </div>

      <a-table
        :columns="[
          { title:'Key', dataIndex:'key', ellipsis:true },
          { title:'类型', dataIndex:'type', width:90 },
          { title:'TTL', dataIndex:'ttl', width:140 },
          { title:'操作', key:'action', width:160, fixed:'right' },
        ]"
        :data-source="keyList"
        row-key="key"
        :loading="keyLoading"
        :pagination="allMode?false:keyPagination"
        size="middle"
        @change="(pg:any)=>handlePageChange(pg.current,pg.pageSize)"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex==='ttl'">{{ formatTTL(record.ttl) }}</template>
          <template v-if="column.key==='action'">
            <a-space>
              <a-button type="link" size="small" @click="handleViewDetail(record.key)"><EyeOutlined /> 详情</a-button>
              <a-button type="link" danger size="small" @click="handleDeleteKey(record.key)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="detailVisible" title="缓存详情" :footer="null" width="680">
      <a-spin :spinning="detailLoading">
        <a-descriptions v-if="detailKey" :column="1" bordered size="small">
          <a-descriptions-item label="Key">{{ detailKey.key }}</a-descriptions-item>
          <a-descriptions-item label="类型">{{ detailKey.type }}</a-descriptions-item>
          <a-descriptions-item label="TTL">{{ formatTTL(detailKey.ttl) }}</a-descriptions-item>
          <a-descriptions-item label="大小">{{ formatBytes(detailKey.size) }}</a-descriptions-item>
          <a-descriptions-item label="值">
            <pre style="max-height:300px;overflow:auto;margin:0;font-size:12px">{{ typeof detailKey.value === 'string' ? detailKey.value : JSON.stringify(detailKey.value, null, 2) }}</pre>
          </a-descriptions-item>
        </a-descriptions>
      </a-spin>
    </a-modal>
  </div>
</template>

<style scoped lang="less">
.system-cache {
  .key-toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
  .total-tip { color:#1677ff; font-size:13px; }
}
</style>
