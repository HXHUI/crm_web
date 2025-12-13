<template>
  <div class="opportunity-stage-distribution">
    <!-- 标题区域 -->
    <div class="chart-header">
      <div class="title-section">
        <h3 class="chart-title">商机阶段分布</h3>
      </div>
    </div>

    <!-- 图表内容 -->
    <div class="chart-content" v-if="stageData">
      <div class="chart-container">
        <div ref="chartRef" class="chart"></div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading-overlay">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-overlay">
      <el-icon><Warning /></el-icon>
      <span>加载失败，请重试</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Loading, Warning } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { statisticsApi, type OpportunityStageDistributionData } from '@/api/statistics'

const props = defineProps<{
  scopeFilter?: string
  parsedScopeFilter?: { type: 'me_and_subordinates' | 'all' | 'department' | 'member'; departmentId?: number; memberId?: number }
}>()

const loading = ref(false)
const error = ref(false)
const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

const stageData = ref<OpportunityStageDistributionData | null>(null)

// 阶段名称映射
const stageNames = [
  '初步接触',
  '需求分析',
  '方案/报价',
  '谈判审核',
  '赢单',
  '输单',
]

// 加载数据
const loadData = async () => {
  try {
    loading.value = true
    error.value = false

    const scopeType = props.parsedScopeFilter?.type || 'me_and_subordinates'
    const departmentId = props.parsedScopeFilter?.departmentId
    const memberId = props.parsedScopeFilter?.memberId
    const scope = scopeType === 'all' ? 'all' : 'me'

    const response = await statisticsApi.getOpportunityStageDistribution(
      scope,
      'tenant',
      scopeType,
      departmentId,
      memberId,
    )

    stageData.value = response.data

    await nextTick()
    updateChart()
  } catch (err) {
    console.error('加载商机阶段分布数据失败:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

// 更新图表
const updateChart = () => {
  if (!chartRef.value || !stageData.value) {
    return
  }

  // 如果图表实例不存在，创建新实例
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  // 准备数据
  const counts = [
    stageData.value.initialContact.count,
    stageData.value.needsAnalysis.count,
    stageData.value.proposalQuote.count,
    stageData.value.negotiationReview.count,
    stageData.value.closedWon.count,
    stageData.value.closedLost.count,
  ]

  const amounts = [
    stageData.value.initialContact.amount,
    stageData.value.needsAnalysis.amount,
    stageData.value.proposalQuote.amount,
    stageData.value.negotiationReview.amount,
    stageData.value.closedWon.amount,
    stageData.value.closedLost.amount,
  ]

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach((param: any) => {
          if (param.seriesName === '商机数量') {
            result += `${param.marker}${param.seriesName}: ${param.value.toLocaleString('zh-CN')}个<br/>`
          } else {
            result += `${param.marker}${param.seriesName}: ¥${param.value.toLocaleString('zh-CN')}<br/>`
          }
        })
        return result
      },
    },
    legend: {
      data: ['商机数量', '商机金额'],
      top: 10,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: stageNames,
      axisPointer: {
        type: 'shadow',
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '商机数量（个）',
        position: 'left',
        axisLabel: {
          formatter: (value: number) => {
            return value.toLocaleString('zh-CN')
          },
        },
      },
      {
        type: 'value',
        name: '商机金额（元）',
        position: 'right',
        axisLabel: {
          formatter: (value: number) => {
            if (value >= 10000) {
              return `${(value / 10000).toFixed(1)}万`
            }
            return value.toLocaleString('zh-CN')
          },
        },
      },
    ],
    series: [
      {
        name: '商机数量',
        type: 'bar',
        yAxisIndex: 0,
        data: counts,
        itemStyle: {
          color: '#5470c6',
        },
      },
      {
        name: '商机金额',
        type: 'bar',
        yAxisIndex: 1,
        data: amounts,
        itemStyle: {
          color: '#91cc75',
        },
      },
    ],
  }

  chartInstance.setOption(option, true)
  chartInstance.resize()
}

const resizeChart = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', resizeChart)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

watch(
  () => [props.scopeFilter, props.parsedScopeFilter],
  () => {
    loadData()
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
.opportunity-stage-distribution {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.title-section {
  display: flex;
  align-items: center;
}

.chart-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.chart-content {
  flex: 1;
  position: relative;
  min-height: 400px;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #909399;
}

.error-overlay {
  color: #f56c6c;
}

.chart-container {
  width: 100%;
  height: 100%;
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>

