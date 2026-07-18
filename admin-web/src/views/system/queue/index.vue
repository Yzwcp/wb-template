<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import { ReloadOutlined, UndoOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import * as queueApi from '@/api/queue'

defineOptions({ name: 'SystemQueue' })

const queues = ref<any[]>([])
const selectedQueue = ref<string>('')
const queueLoading = ref(false)

const jobList = ref<any[]>([])
const jobLoading = ref(false)
const jobPagination = ref({ current: 1, pageSize: 10, total: 0 })

async function loadQueues() {
  queueLoading.value = true
  try {
    queues.value = await queueApi.getQueues()
    if (queues.value.length > 0 && !selectedQueue.value) {
      selectedQueue.value = queues.value[0].name
      loadJobs()
    }
  } catch {
    queues.value = []
  } finally {
    queueLoading.value = false
  }
}

async function loadJobs() {
  if (!selectedQueue.value) return
  jobLoading.value = true
  try {
    const res = await queueApi.getJobs({
      page: jobPagination.value.current,
      pageSize: jobPagination.value.pageSize,
      queue: selectedQueue.value,
    })
    jobList.value = res.list || []
    jobPagination.value.total = res.total || 0
  } catch {
    jobList.value = []
    jobPagination.value.total = 0
  } finally {
    jobLoading.value = false
  }
}

function handleSelectQueue(name: string) {
  selectedQueue.value = name
  jobPagination.value.current = 1
  loadJobs()
}

function handlePageChange(page: number, size: number) {
  jobPagination.value.current = page
  jobPagination.value.pageSize = size
  loadJobs()
}

async function handleRetry(job: any) {
  try {
    await queueApi.retryJob(selectedQueue.value, job.id)
    message.success('已重试')
    loadJobs()
  } catch (err: any) {
  }
}

async function handleClean() {
  try {
    await queueApi.cleanQueue(selectedQueue.value)
    message.success('队列已清理')
    loadQueues()
    loadJobs()
  } catch (err: any) {
  }
}

const jobColumns = [
  { title: 'Job ID', dataIndex: 'id', key: 'id', width: 150, ellipsis: true },
  { title: '任务名', dataIndex: 'name', key: 'name', width: 150 },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
  },
  {
    title: '尝试次数',
    dataIndex: 'attemptsMade',
    key: 'attemptsMade',
    width: 80,
  },
  {
    title: '失败原因',
    dataIndex: 'failedReason',
    key: 'failedReason',
    ellipsis: true,
  },
  { title: '操作', key: 'action', width: 120, fixed: 'right' },
]

const statusColorMap: Record<string, string> = {
  waiting: 'blue',
  active: 'green',
  completed: 'default',
  failed: 'red',
  delayed: 'orange',
}

onMounted(() => {
  loadQueues()
})
</script>

<template>
  <div class="system-queue">
    <!-- Queue overview cards -->
    <a-row :gutter="[16, 16]" style="margin-bottom: 16px">
      <a-col v-for="q in queues" :key="q.name" :xs="24" :sm="12" :md="8" :lg="6">
        <a-card
          size="small"
          :class="['queue-card', { active: selectedQueue === q.name }]"
          hoverable
          @click="handleSelectQueue(q.name)"
        >
          <div class="queue-name">
            <a-tag :color="q.paused ? 'red' : 'green'">{{ q.paused ? '暂停' : '运行' }}</a-tag>
            <strong>{{ q.name }}</strong>
          </div>
          <a-row :gutter="8" style="margin-top: 12px">
            <a-col :span="6">
              <a-statistic title="等待" :value="q.waiting ?? 0" value-style="font-size: 16px; color: #1677ff" />
            </a-col>
            <a-col :span="6">
              <a-statistic title="进行中" :value="q.active ?? 0" value-style="font-size: 16px; color: #52c41a" />
            </a-col>
            <a-col :span="6">
              <a-statistic title="完成" :value="q.completed ?? 0" value-style="font-size: 16px" />
            </a-col>
            <a-col :span="6">
              <a-statistic title="失败" :value="q.failed ?? 0" value-style="font-size: 16px; color: #ff4d4f" />
            </a-col>
          </a-row>
        </a-card>
      </a-col>

      <a-col v-if="queues.length === 0 && !queueLoading" :span="24">
        <a-empty description="暂无队列数据" />
      </a-col>
    </a-row>

    <!-- Job list for selected queue -->
    <a-card v-if="selectedQueue" :bordered="false">
      <template #title>
        <span>
          {{ selectedQueue }} 队列任务
        </span>
      </template>
      <template #extra>
        <a-space>
          <a-button size="small" @click="loadJobs"><ReloadOutlined /> 刷新</a-button>
          <a-button danger size="small" @click="handleClean"><DeleteOutlined /> 清理</a-button>
        </a-space>
      </template>

      <a-table
        :columns="jobColumns"
        :data-source="jobList"
        row-key="id"
        :loading="jobLoading"
        :pagination="jobPagination"
        :scroll="{ x: 'max-content' }"
        size="middle"
        @change="(pg: any) => handlePageChange(pg.current, pg.pageSize)"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="statusColorMap[record.status] || 'default'">{{ record.status }}</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-button type="link" size="small" :disabled="record.status !== 'failed'" @click="handleRetry(record)">
              <UndoOutlined /> 重试
            </a-button>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<style scoped lang="less">
.system-queue {
  .queue-card {
    cursor: pointer;
    transition: all 0.3s;
    border: 2px solid transparent;

    &.active {
      border-color: #1677ff;
    }

    .queue-name {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}
</style>
