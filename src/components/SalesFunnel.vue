<template>
  <div class="sales-funnel">
    <!-- 标题区域 -->
    <div class="funnel-header">
      <div class="title-section">
        <div class="title-with-icon">
          <el-icon class="title-icon"><TrendCharts /></el-icon>
          <h3 class="funnel-title">销售漏斗</h3>
          <el-icon class="help-icon"><QuestionFilled /></el-icon>
        </div>
        <div class="filter-display">{{ scopeFilterText }} | 全部</div>
      </div>
    </div>

    <!-- 漏斗内容 -->
    <div class="funnel-content" v-if="funnelData">
      <div class="funnel-chart-container">
        <div class="funnel-chart" ref="funnelChartRef"></div>
      </div>

      <!-- 转化率统计 -->
      <div class="conversion-stats">
        <div class="stat-item">
          <div class="stat-label">初步接触转化率</div>
          <div class="stat-value">{{ getConversionRate('leads') }}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">需求分析转化率</div>
          <div class="stat-value">{{ getConversionRate('qualified') }}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">方案/报价转化率</div>
          <div class="stat-value">{{ getConversionRate('proposal') }}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">谈判审核转化率</div>
          <div class="stat-value">{{ getConversionRate('negotiation') }}%</div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading-state">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <el-icon><Warning /></el-icon>
      <span>加载失败，请重试</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { statisticsApi, type SalesFunnelData } from '@/api/statistics'
import { TrendCharts, QuestionFilled, Loading, Warning } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// Props
const props = defineProps<{
  scopeFilter?: string
}>()

// 响应式数据
const funnelData = ref<SalesFunnelData | null>(null)
const loading = ref(false)
const error = ref(false)
const funnelChartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 计算属性
const scopeFilterText = computed(() => {
  const map: Record<string, string> = {
    me_and_subordinates: '本人及下属',
    all: '全部',
  }
  return map[props.scopeFilter || 'me_and_subordinates'] || '本人及下属'
})

// 漏斗阶段数据
const funnelStages = computed(() => {
  if (!funnelData.value) return []

  return [
    {
      key: 'leads',
      name: '初步接触',
      count: funnelData.value.leads.count,
      amount: funnelData.value.leads.amount,
    },
    {
      key: 'qualified',
      name: '需求分析',
      count: funnelData.value.qualified.count,
      amount: funnelData.value.qualified.amount,
    },
    {
      key: 'proposal',
      name: '方案/报价',
      count: funnelData.value.proposal.count,
      amount: funnelData.value.proposal.amount,
    },
    {
      key: 'negotiation',
      name: '谈判审核',
      count: funnelData.value.negotiation.count,
      amount: funnelData.value.negotiation.amount,
    },
    {
      key: 'closed',
      name: '赢单',
      count: funnelData.value.closed.count,
      amount: funnelData.value.closed.amount,
    },
  ]
})

// 方法
const loadSalesFunnel = async () => {
  try {
    loading.value = true
    error.value = false
    const scope = props.scopeFilter === 'all' ? 'all' : 'me'
    const response = await statisticsApi.getSalesFunnel(scope)
    funnelData.value = response.data
  } catch (err) {
    console.error('加载销售漏斗失败:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

// 获取阶段颜色
const getStageColor = (index: number): string => {
  const colors = [
    '#4ecdc4', // 青色 - 线索
    '#45b7d1', // 蓝色 - 合格
    '#feca57', // 黄色 - 提案
    '#ff6b6b', // 红色 - 谈判
    '#8b5cf6', // 紫色 - 成交
  ]
  return colors[index % colors.length]
}

// 计算转化率
const getConversionRate = (stage: keyof SalesFunnelData): string => {
  if (!funnelData.value) return '0.0'

  let previousCount = 0
  switch (stage) {
    case 'leads':
      return '100.0' // 线索是起点
    case 'qualified':
      previousCount = funnelData.value.leads.count
      break
    case 'proposal':
      previousCount = funnelData.value.qualified.count
      break
    case 'negotiation':
      previousCount = funnelData.value.proposal.count
      break
    case 'closed':
      previousCount = funnelData.value.negotiation.count
      break
  }

  if (previousCount === 0) return '0.0'

  const rate = (funnelData.value[stage].count / previousCount) * 100
  return rate.toFixed(1)
}

// 初始化漏斗图
const initFunnelChart = () => {
  if (!funnelChartRef.value) return

  chartInstance = echarts.init(funnelChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: function (params: any) {
        return `${params.name}<br/>客户数量: ${params.value}个<br/>商机金额: ¥${funnelStages.value[params.dataIndex]?.amount.toLocaleString() || 0}`
      },
    },
    legend: {
      show: false,
    },
    series: [
      {
        name: '销售漏斗',
        type: 'funnel',
        left: '10%',
        top: 60,
        bottom: 60,
        width: '80%',
        min: 0,
        max: Math.max(...funnelStages.value.map((item) => item.count)),
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: {
          show: true,
          position: 'inside',
          formatter: function (params: any) {
            return `${params.name}\n${params.value}个`
          },
          fontSize: 12,
          fontWeight: 'bold',
          color: '#fff',
        },
        labelLine: {
          length: 10,
          lineStyle: {
            width: 1,
            type: 'solid',
          },
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1,
        },
        emphasis: {
          label: {
            fontSize: 14,
          },
        },
        data: funnelStages.value.map((item, index) => ({
          value: item.count,
          name: item.name,
          itemStyle: {
            color: getStageColor(index),
          },
        })),
      },
    ],
  }

  chartInstance.setOption(option)
}

// 更新漏斗图
const updateFunnelChart = () => {
  if (!chartInstance) return

  const option = {
    series: [
      {
        max: Math.max(...funnelStages.value.map((item) => item.count)),
        data: funnelStages.value.map((item, index) => ({
          value: item.count,
          name: item.name,
          itemStyle: {
            color: getStageColor(index),
          },
        })),
      },
    ],
  }

  chartInstance.setOption(option)
}

// 监听数据变化，更新图表
watch(
  funnelStages,
  () => {
    if (funnelStages.value && funnelStages.value.length > 0) {
      nextTick(() => {
        if (chartInstance) {
          updateFunnelChart()
        } else {
          initFunnelChart()
        }
      })
    }
  },
  { deep: true },
)

// 监听过滤条件变化
watch(
  () => props.scopeFilter,
  () => {
    loadSalesFunnel()
  },
)

onMounted(() => {
  loadSalesFunnel()
})

// 组件卸载时销毁图表
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.sales-funnel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.funnel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.title-section {
  flex: 1;
}

.title-with-icon {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.title-icon {
  font-size: 20px;
  color: #409eff;
  margin-right: 8px;
}

.funnel-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.help-icon {
  font-size: 16px;
  color: #c0c4cc;
  margin-left: 8px;
  cursor: help;
}

.filter-display {
  font-size: 12px;
  color: #909399;
}

.illustration {
  display: flex;
  align-items: center;
}

.funnel-illustration {
  display: flex;
  align-items: center;
  gap: 8px;
}

.funnel-icon {
  font-size: 24px;
}

.chart-icon {
  font-size: 20px;
}

.funnel-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.funnel-chart-container {
  width: 100%;
  min-height: 400px;
}

.funnel-chart {
  width: 100%;
  height: 400px;
  min-width: 300px;
}

.conversion-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: #909399;
}

.error-state {
  color: #f56c6c;
}

@media (max-width: 768px) {
  .funnel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .illustration {
    align-self: flex-end;
  }

  .funnel-chart-container {
    min-height: 350px;
  }

  .funnel-chart {
    min-width: 250px;
    height: 350px;
  }

  .conversion-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .funnel-chart {
    min-width: 200px;
    height: 300px;
  }

  .conversion-stats {
    grid-template-columns: 1fr;
  }
}
</style>
