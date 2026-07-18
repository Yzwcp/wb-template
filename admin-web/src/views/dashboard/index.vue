<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import * as echarts from "echarts";
import {
  RiseOutlined,
  TeamOutlined,
  BarChartOutlined,
  TrophyOutlined,
} from "@ant-design/icons-vue";

// ==================== 模拟数据 ====================

/** 生成近30天每日开户数据 */
function generateDailyData() {
  const days: string[] = [];
  const values: number[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(`${d.getMonth() + 1}/${d.getDate()}`);
    // 模拟每日开户量 8~35 之间波动
    values.push(Math.floor(Math.random() * 28) + 8);
  }
  return { days, values };
}

/** 生成近12月每月开户数据 */
function generateMonthlyData() {
  const months: string[] = [];
  const values: number[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
    // 月开户量 200~600
    values.push(Math.floor(Math.random() * 401) + 200);
  }
  return { months, values };
}

/** 渠道分布 */
const channelData = [
  { name: "线上推广", value: 1280 },
  { name: "线下地推", value: 860 },
  { name: "客户转介绍", value: 540 },
  { name: "合作渠道", value: 420 },
  { name: "自然流量", value: 300 },
];

/** 近30天数据 */
const dailyData = generateDailyData();

/** 近12月数据 */
const monthlyData = generateMonthlyData();

/** 汇总指标 */
const stats = computed(() => {
  const today = dailyData.values[dailyData.values.length - 1];
  const thisMonthTotal = dailyData.values.reduce((a, b) => a + b, 0);
  const yearTotal = monthlyData.values.reduce((a, b) => a + b, 0);
  const monthAvg = Math.round(yearTotal / 12);
  return {
    today,
    thisMonthTotal,
    monthAvg,
    yearTotal,
  };
});

/** 最近开户记录 */
const recentRecords = ref([
  {
    id: 1,
    customerName: "张三",
    phone: "138****5678",
    channel: "线上推广",
    time: "2026-07-06 14:32:10",
    status: "已开户",
  },
  {
    id: 2,
    customerName: "李四",
    phone: "139****1234",
    channel: "线下地推",
    time: "2026-07-06 13:15:22",
    status: "已开户",
  },
  {
    id: 3,
    customerName: "王五",
    phone: "136****7890",
    channel: "客户转介绍",
    time: "2026-07-06 11:48:05",
    status: "已开户",
  },
  {
    id: 4,
    customerName: "赵六",
    phone: "137****3456",
    channel: "合作渠道",
    time: "2026-07-06 10:20:33",
    status: "已开户",
  },
  {
    id: 5,
    customerName: "孙七",
    phone: "135****9012",
    channel: "线上推广",
    time: "2026-07-06 09:05:18",
    status: "已开户",
  },
  {
    id: 6,
    customerName: "周八",
    phone: "133****7890",
    channel: "自然流量",
    time: "2026-07-05 16:42:50",
    status: "已开户",
  },
  {
    id: 7,
    customerName: "吴九",
    phone: "150****2345",
    channel: "线下地推",
    time: "2026-07-05 15:10:07",
    status: "已开户",
  },
  {
    id: 8,
    customerName: "郑十",
    phone: "138****6789",
    channel: "线上推广",
    time: "2026-07-05 14:28:41",
    status: "已开户",
  },
]);

// ==================== 图表 ====================

const dailyChartRef = ref<HTMLDivElement>();
const monthlyChartRef = ref<HTMLDivElement>();
const channelChartRef = ref<HTMLDivElement>();

let dailyChart: echarts.ECharts | null = null;
let monthlyChart: echarts.ECharts | null = null;
let channelChart: echarts.ECharts | null = null;

function initDailyChart() {
  if (!dailyChartRef.value) return;
  dailyChart = echarts.init(dailyChartRef.value);
  dailyChart.setOption({
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    grid: { top: 20, right: 20, bottom: 30, left: 50 },
    xAxis: {
      type: "category",
      data: dailyData.days,
      axisLabel: { rotate: 45, fontSize: 10 },
    },
    yAxis: {
      type: "value",
      name: "开户数",
    },
    series: [
      {
        data: dailyData.values,
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 4,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(24,144,255,0.35)" },
            { offset: 1, color: "rgba(24,144,255,0.02)" },
          ]),
        },
        itemStyle: { color: "#1890ff" },
        lineStyle: { color: "#1890ff", width: 2 },
      },
    ],
  });
}

function initMonthlyChart() {
  if (!monthlyChartRef.value) return;
  monthlyChart = echarts.init(monthlyChartRef.value);
  const avg = stats.value.monthAvg;
  monthlyChart.setOption({
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    legend: { data: ["月开户量", "月均线"], top: 0 },
    grid: { top: 40, right: 20, bottom: 30, left: 50 },
    xAxis: {
      type: "category",
      data: monthlyData.months,
      axisLabel: { rotate: 45, fontSize: 10 },
    },
    yAxis: {
      type: "value",
      name: "开户数",
    },
    series: [
      {
        name: "月开户量",
        data: monthlyData.values,
        type: "bar",
        barWidth: 24,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#1890ff" },
            { offset: 1, color: "#69c0ff" },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: "月均线",
        type: "line",
        data: Array(12).fill(avg),
        smooth: true,
        symbol: "none",
        lineStyle: { color: "#ff4d4f", type: "dashed", width: 2 },
      },
    ],
  });
}

function initChannelChart() {
  if (!channelChartRef.value) return;
  channelChart = echarts.init(channelChartRef.value);
  channelChart.setOption({
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} 户 ({d}%)",
    },
    legend: {
      orient: "vertical",
      right: 10,
      top: "center",
    },
    series: [
      {
        type: "pie",
        radius: ["45%", "75%"],
        center: ["35%", "50%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: "bold",
          },
        },
        data: channelData,
        color: ["#1890ff", "#36cfc9", "#b37feb", "#ffc53d", "#ff7a45"],
      },
    ],
  });
}

function handleResize() {
  dailyChart?.resize();
  monthlyChart?.resize();
  channelChart?.resize();
}

onMounted(() => {
  initDailyChart();
  initMonthlyChart();
  initChannelChart();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  dailyChart?.dispose();
  monthlyChart?.dispose();
  channelChart?.dispose();
});
</script>

<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <a-row :gutter="16" class="stat-cards">
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <span class="stat-label">今日开户量</span>
              <span class="stat-value">
                <span class="stat-number">{{ stats.today }}</span>
                <span class="stat-unit">户</span>
              </span>
            </div>
            <div class="stat-icon stat-icon-blue">
              <RiseOutlined />
            </div>
          </div>
          <div class="stat-footer">
            <span class="stat-trend up">较昨日 ↑12%</span>
          </div>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :lg="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <span class="stat-label">本月开户量</span>
              <span class="stat-value">
                <span class="stat-number">{{ stats.thisMonthTotal }}</span>
                <span class="stat-unit">户</span>
              </span>
            </div>
            <div class="stat-icon stat-icon-green">
              <TeamOutlined />
            </div>
          </div>
          <div class="stat-footer">
            <span class="stat-trend up">环比 ↑8.5%</span>
          </div>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :lg="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <span class="stat-label">月均开户量</span>
              <span class="stat-value">
                <span class="stat-number">{{ stats.monthAvg }}</span>
                <span class="stat-unit">户</span>
              </span>
            </div>
            <div class="stat-icon stat-icon-purple">
              <BarChartOutlined />
            </div>
          </div>
          <div class="stat-footer">
            <span class="stat-trend up">同比 ↑15.3%</span>
          </div>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :lg="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <span class="stat-label">累计开户总量</span>
              <span class="stat-value">
                <span class="stat-number">{{ stats.yearTotal }}</span>
                <span class="stat-unit">户</span>
              </span>
            </div>
            <div class="stat-icon stat-icon-orange">
              <TrophyOutlined />
            </div>
          </div>
          <div class="stat-footer">
            <span class="stat-trend up">总完成率 92.6%</span>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 图表区域 -->
    <a-row :gutter="16" class="chart-row">
      <a-col :span="16">
        <a-card title="近30天每日开户趋势" class="chart-card">
          <div ref="dailyChartRef" class="chart-container"></div>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="开户渠道分布" class="chart-card">
          <div ref="channelChartRef" class="chart-container"></div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" class="chart-row">
      <a-col :span="24">
        <a-card title="近12月开户量统计" class="chart-card">
          <template #extra>
            <a-tag color="blue">月均 {{ stats.monthAvg }} 户</a-tag>
          </template>
          <div
            ref="monthlyChartRef"
            class="chart-container chart-container-lg"
          ></div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 最近开户记录 -->
    <a-row :gutter="16" class="chart-row">
      <a-col :span="24">
        <a-card title="最近开户记录" class="chart-card">
          <template #extra>
            <a-button type="link" size="small">查看全部</a-button>
          </template>
          <a-table
            :columns="[
              {
                title: '客户姓名',
                dataIndex: 'customerName',
                key: 'customerName',
              },
              { title: '手机号', dataIndex: 'phone', key: 'phone' },
              { title: '开户渠道', dataIndex: 'channel', key: 'channel' },
              { title: '开户时间', dataIndex: 'time', key: 'time' },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
              },
            ]"
            :data-source="recentRecords"
            :pagination="false"
            size="middle"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag color="success">{{ record.status }}</a-tag>
              </template>
              <template v-if="column.key === 'channel'">
                <a-tag
                  :color="
                    record.channel === '线上推广'
                      ? 'blue'
                      : record.channel === '线下地推'
                        ? 'green'
                        : record.channel === '客户转介绍'
                          ? 'purple'
                          : record.channel === '合作渠道'
                            ? 'orange'
                            : 'default'
                  "
                >
                  {{ record.channel }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<style lang="less" scoped>
.dashboard {
  padding: 0;
}

.stat-cards {
  margin-bottom: 16px;
}

.stat-card {
  border-radius: 8px;
  transition: box-shadow 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  :deep(.ant-card-body) {
    padding: 20px;
  }
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.stat-value {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.stat-number {
  font-size: 30px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1;
}

.stat-unit {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: #fff;
}

.stat-icon-blue {
  background: linear-gradient(135deg, #1890ff, #096dd9);
}
.stat-icon-green {
  background: linear-gradient(135deg, #52c41a, #389e0d);
}
.stat-icon-purple {
  background: linear-gradient(135deg, #722ed1, #531dab);
}
.stat-icon-orange {
  background: linear-gradient(135deg, #fa8c16, #d46b08);
}

.stat-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.stat-trend {
  font-size: 13px;

  &.up {
    color: #52c41a;
  }

  &.down {
    color: #ff4d4f;
  }
}

.chart-row {
  margin-bottom: 16px;
}

.chart-card {
  border-radius: 8px;

  :deep(.ant-card-head) {
    border-bottom: 1px solid #f0f0f0;
  }

  :deep(.ant-card-head-title) {
    font-weight: 600;
  }
}

.chart-container {
  height: 320px;
  width: 100%;
}

.chart-container-lg {
  height: 350px;
}
</style>
