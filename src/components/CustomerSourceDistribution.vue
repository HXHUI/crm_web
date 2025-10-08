<template>
  <div class="customer-source-distribution">
    <!-- 标题区域 -->
    <div class="chart-header">
      <div class="title-section">
        <div class="title-with-icon">
          <el-icon class="title-icon"><PieChart /></el-icon>
          <h3 class="chart-title">客户来源分布</h3>
        </div>
        <div class="filter-display">{{ scopeFilterText }}</div>
      </div>
    </div>

    <!-- 图表内容 -->
    <div class="chart-content" v-if="sourceData && sourceData.length > 0">
      <div class="pie-chart-container">
        <div class="pie-chart" ref="pieChartRef"></div>
        <div class="chart-legend">
          <div v-for="(item, index) in sourceData" :key="item.source" class="legend-item">
            <div class="legend-color" :style="{ backgroundColor: getSourceColor(index) }"></div>
            <div class="legend-text">
              <div class="legend-name">{{ getSourceLabel(item.source) }}</div>
              <div class="legend-count">{{ item.count }}个 ({{ item.percentage }}%)</div>
            </div>
            +
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading-state">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!loading" class="empty-state">
      <el-icon><PieChart /></el-icon>
      <span>暂无数据</span>
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
import { statisticsApi, type CustomerSourceDistributionData } from '@/api/statistics'
import leadApi from '@/api/lead'
import { PieChart, Loading, Warning } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// Props
const props = defineProps<{
  scopeFilter?: string
}>()

// 响应式数据
const sourceData = ref<CustomerSourceDistributionData[]>([])
const sourceOptions = ref<{ key: string; label: string }[]>([])
const loading = ref(false)
const error = ref(false)
const pieChartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 计算属性
const scopeFilterText = computed(() => {
  const map: Record<string, string> = {
    me_and_subordinates: '本人及下属',
    all: '全部',
  }
  return map[props.scopeFilter || 'me_and_subordinates'] || '本人及下属'
})

// 方法
const loadSourceOptions = async () => {
  try {
    const response = await leadApi.sources()
    sourceOptions.value =
      (response as unknown as { data: { key: string; label: string }[] }).data || []
  } catch (err) {
    console.error('加载客户来源选项失败:', err)
  }
}

const loadSourceDistribution = async () => {
  try {
    loading.value = true
    error.value = false
    const scope = props.scopeFilter === 'all' ? 'all' : 'me'
    const response = await statisticsApi.getCustomerSourceDistribution(scope)
    sourceData.value = response.data
  } catch (err) {
    console.error('加载客户来源分布失败:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

// 获取来源颜色
const getSourceColor = (index: number): string => {
  const colors = [
    '#409EFF', // 蓝色
    '#67C23A', // 绿色
    '#E6A23C', // 橙色
    '#F56C6C', // 红色
    '#909399', // 灰色
    '#9C27B0', // 紫色
    '#00BCD4', // 青色
    '#FF9800', // 深橙色
    '#4CAF50', // 深绿色
    '#2196F3', // 深蓝色
  ]
  return colors[index % colors.length]
}

// 获取来源中文标签
const getSourceLabel = (source: string): string => {
  const option = sourceOptions.value.find((opt) => opt.key === source)
  return option?.label || source
}

// 初始化饼图
const initPieChart = () => {
  if (!pieChartRef.value) return

  chartInstance = echarts.init(pieChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: function (params: {
        seriesName: string
        name: string
        value: number
        percent: number
      }) {
        return `${params.seriesName}<br/>${params.name}: ${params.value}个 (${params.percent}%)`
      },
    },
    legend: {
      show: false,
    },
    series: [
      {
        name: '客户来源',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}: {c}个 ({d}%)',
          fontSize: 12,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 8,
        },
        data: sourceData.value.map((item, index) => ({
          value: item.count,
          name: getSourceLabel(item.source),
          itemStyle: {
            color: getSourceColor(index),
          },
        })),
      },
    ],
  }

  chartInstance.setOption(option)
}

// 更新饼图
const updatePieChart = () => {
  if (!chartInstance) return

  const option = {
    series: [
      {
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}: {c}个 ({d}%)',
          fontSize: 12,
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 8,
        },
        data: sourceData.value.map((item, index) => ({
          value: item.count,
          name: getSourceLabel(item.source),
          itemStyle: {
            color: getSourceColor(index),
          },
        })),
      },
    ],
  }

  chartInstance.setOption(option)
}

// 监听数据变化，更新图表
watch(
  sourceData,
  () => {
    if (sourceData.value && sourceData.value.length > 0) {
      nextTick(() => {
        if (chartInstance) {
          updatePieChart()
        } else {
          initPieChart()
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
    loadSourceDistribution()
  },
)

onMounted(async () => {
  await loadSourceOptions()
  loadSourceDistribution()
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
.customer-source-distribution {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.chart-header {
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

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.filter-display {
  font-size: 12px;
  color: #909399;
}

.illustration {
  display: flex;
  align-items: center;
}

.chart-illustration {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pie-icon {
  font-size: 24px;
}

.chart-icon {
  font-size: 20px;
}

.chart-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pie-chart-container {
  display: flex;
  align-items: center;
  gap: 24px;
  min-height: 300px;
}

.pie-chart {
  flex: 1;
  height: 300px;
  min-width: 300px;
}

.chart-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 200px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.legend-name {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.legend-count {
  font-size: 11px;
  color: #909399;
}

.loading-state,
.empty-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: #909399;
}

.empty-state {
  color: #c0c4cc;
}

.error-state {
  color: #f56c6c;
}

@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .illustration {
    align-self: flex-end;
  }

  .pie-chart-container {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .pie-chart {
    min-width: 250px;
    height: 250px;
  }

  .chart-legend {
    min-width: auto;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .pie-chart {
    min-width: 200px;
    height: 200px;
  }

  .legend-item {
    padding: 6px 10px;
  }

  .legend-name {
    font-size: 12px;
  }

  .legend-count {
    font-size: 10px;
  }
}
</style>
