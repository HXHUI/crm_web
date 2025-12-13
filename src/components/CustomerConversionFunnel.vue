<template>
  <div class="customer-conversion-funnel">
    <!-- 标题区域 -->
    <div class="funnel-header">
      <div class="title-section">
        <div class="title-with-icon">
          <el-icon class="title-icon"><TrendCharts /></el-icon>
          <h3 class="funnel-title">客户转化漏斗</h3>
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
          <div class="stat-label">线索转化率</div>
          <div class="stat-value">{{ getConversionRate('leads') }}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">合格转化率</div>
          <div class="stat-value">{{ getConversionRate('qualified') }}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">提案转化率</div>
          <div class="stat-value">{{ getConversionRate('proposal') }}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">谈判转化率</div>
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
import { statisticsApi, type CustomerConversionFunnelData } from '@/api/statistics'
import { TrendCharts, QuestionFilled, Loading, Warning } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// Props
const props = defineProps<{
  scopeFilter?: string
  parsedScopeFilter?: { type: 'me_and_subordinates' | 'all' | 'department' | 'member'; departmentId?: number; memberId?: number }
}>()

// 响应式数据
const funnelData = ref<CustomerConversionFunnelData | null>(null)
const loading = ref(false)
const error = ref(false)
const funnelChartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 计算属性
const scopeFilterText = computed(() => {
  const map: Record<string, string> = {
    me_and_subordinates: '本人及下属',
    all: '全部',
    department: '部门',
    member: '用户',
  }
  return map[props.scopeFilter || 'me_and_subordinates'] || '本人及下属'
})

// 漏斗阶段数据
const funnelStages = computed(() => {
  if (!funnelData.value) return []

  return [
    {
      key: 'leads',
      name: '线索总数',
      count: funnelData.value.leads.count,
    },
    {
      key: 'converted',
      name: '已转化客户',
      count: funnelData.value.converted.count,
    },
    {
      key: 'qualified',
      name: '合格客户',
      count: funnelData.value.qualified.count,
      amount: funnelData.value.qualified.amount,
    },
    {
      key: 'proposal',
      name: '提案客户',
      count: funnelData.value.proposal.count,
      amount: funnelData.value.proposal.amount,
    },
    {
      key: 'negotiation',
      name: '谈判客户',
      count: funnelData.value.negotiation.count,
      amount: funnelData.value.negotiation.amount,
    },
    {
      key: 'closedWon',
      name: '成交客户',
      count: funnelData.value.closedWon.count,
      amount: funnelData.value.closedWon.amount,
    },
  ]
})

// 方法
const loadCustomerConversionFunnel = async () => {
  try {
    loading.value = true
    error.value = false
    
    const scopeType = props.parsedScopeFilter?.type || 'me_and_subordinates'
    const departmentId = props.parsedScopeFilter?.departmentId
    const memberId = props.parsedScopeFilter?.memberId
    const scope = scopeType === 'all' ? 'all' : 'me'
    
    const response = await statisticsApi.getCustomerConversionFunnel(
      scope,
      'tenant',
      scopeType,
      departmentId,
      memberId,
    )
    funnelData.value = response.data
  } catch (err) {
    console.error('加载客户转化漏斗失败:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

// 获取阶段颜色
const getStageColor = (index: number): string => {
  const colors = [
    '#4ecdc4', // 青色 - 线索
    '#45b7d1', // 蓝色 - 已转化
    '#feca57', // 黄色 - 合格
    '#ff6b6b', // 红色 - 提案
    '#8b5cf6', // 紫色 - 谈判
    '#51cf66', // 绿色 - 成交
  ]
  return colors[index % colors.length]
}

// 计算转化率
const getConversionRate = (stage: keyof CustomerConversionFunnelData | 'leads'): string => {
  if (!funnelData.value) return '0.0'

  let previousCount = 0
  let currentCount = 0

  switch (stage) {
    case 'leads':
      // 线索转化率 = 已转化客户数 / 线索总数 * 100
      previousCount = funnelData.value.leads.count
      currentCount = funnelData.value.converted.count
      break
    case 'converted':
      // 已转化客户转化率 = 合格客户数 / 已转化客户数 * 100
      previousCount = funnelData.value.converted.count
      currentCount = funnelData.value.qualified.count
      break
    case 'qualified':
      // 合格转化率 = 提案客户数 / 合格客户数 * 100
      previousCount = funnelData.value.qualified.count
      currentCount = funnelData.value.proposal.count
      break
    case 'proposal':
      // 提案转化率 = 谈判客户数 / 提案客户数 * 100
      previousCount = funnelData.value.proposal.count
      currentCount = funnelData.value.negotiation.count
      break
    case 'negotiation':
      // 谈判转化率 = 成交客户数 / 谈判客户数 * 100
      previousCount = funnelData.value.negotiation.count
      currentCount = funnelData.value.closedWon.count
      break
  }

  if (previousCount === 0) return '0.0'

  const rate = (currentCount / previousCount) * 100
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
        const stage = funnelStages.value[params.dataIndex]
        let result = `${params.name}<br/>客户数量: ${params.value}个`
        if (stage && stage.amount !== undefined) {
          result += `<br/>预计价值: ¥${stage.amount.toLocaleString()}`
        }
        return result
      },
    },
    legend: {
      show: false,
    },
    series: [
      {
        name: '客户转化漏斗',
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
  () => [props.scopeFilter, props.parsedScopeFilter],
  () => {
    loadCustomerConversionFunnel()
  },
  { deep: true },
)

onMounted(() => {
  loadCustomerConversionFunnel()
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
.customer-conversion-funnel {
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

