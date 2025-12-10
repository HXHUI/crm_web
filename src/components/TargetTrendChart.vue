<template>
  <div class="target-trend-chart">
    <div class="chart-header">
      <div class="title-section">
        <h3 class="chart-title">目标趋势及完成率</h3>
      </div>
    </div>
    <div class="chart-content">
      <div v-if="loading" class="loading-overlay">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      <div v-else-if="error" class="error-overlay">
        <el-icon><Warning /></el-icon>
        <span>加载失败，请重试</span>
      </div>
      <div v-else class="chart-container">
        <div ref="chartRef" class="chart"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Loading, Warning } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import targetApi, { type TargetTrendData } from '@/api/target'
import { statisticsApi } from '@/api/statistics'

const props = defineProps<{
  scopeFilter?: string
  parsedScopeFilter?: { type: 'me_and_subordinates' | 'all' | 'department' | 'member'; departmentId?: number; memberId?: number }
  targetType?: 'contract_amount' | 'sales_amount' | 'new_leads' | 'new_customers' | 'new_opportunities' | 'won_opportunities'
}>()

const targetType = computed(() => props.targetType || 'contract_amount')
const loading = ref(false)
const error = ref(false)
const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

const currentYear = computed(() => new Date().getFullYear())

const loadData = async () => {
  try {
    loading.value = true
    error.value = false

    const year = currentYear.value
    const scopeType = props.parsedScopeFilter?.type || 'me_and_subordinates'
    const departmentId = props.parsedScopeFilter?.departmentId
    const memberId = props.parsedScopeFilter?.memberId

    // 并行获取目标数据和实际数据
    const [targetResponse, actualResponse] = await Promise.all([
      targetApi.getTargetTrend(targetType.value as any, year, scopeType, departmentId, memberId),
      (() => {
        switch (targetType.value) {
          case 'contract_amount':
            return statisticsApi.getMonthlyContractAmount(year, scopeType, departmentId, memberId)
          case 'sales_amount':
            return statisticsApi.getMonthlyOrderAmount(year, scopeType, departmentId, memberId)
          case 'new_leads':
            return statisticsApi.getMonthlyLeadCount(year, scopeType, departmentId, memberId)
          case 'new_customers':
            return statisticsApi.getMonthlyCustomerCount(year, scopeType, departmentId, memberId)
          case 'new_opportunities':
            return statisticsApi.getMonthlyOpportunityCount(year, scopeType, departmentId, memberId)
          case 'won_opportunities':
            return statisticsApi.getMonthlyWonOpportunityCount(year, scopeType, departmentId, memberId)
          default:
            return Promise.resolve({ data: Array(12).fill(0) })
        }
      })(),
    ])

    console.log('目标趋势数据:', targetResponse)
    console.log('实际数据:', actualResponse)

    // 处理目标数据
    let targetData = targetResponse.data || targetResponse
    if (!targetData || !targetData.months || !targetData.targets) {
      console.error('目标数据格式错误:', targetData)
      error.value = true
      return
    }

    // 处理实际数据 - 可能是数组，也可能是对象
    let actualData = actualResponse.data || actualResponse
    let actuals: number[] = []
    
    if (Array.isArray(actualData)) {
      // 如果是数组，直接使用
      actuals = actualData
    } else if (actualData && typeof actualData === 'object' && 'actuals' in actualData) {
      // 如果是对象且包含 actuals 属性，使用 actuals
      actuals = actualData.actuals || []
      console.log('从对象中提取 actuals:', actuals)
    } else {
      console.warn('实际数据格式未知，使用默认值:', actualData)
      actuals = Array(12).fill(0)
    }

    // 确保 actuals 长度正确
    if (actuals.length < 12) {
      actuals.push(...Array(12 - actuals.length).fill(0))
    } else if (actuals.length > 12) {
      actuals = actuals.slice(0, 12)
    }

    // 计算完成率
    const completionRates = targetData.targets.map((target, index) => {
      if (target === 0) return 0
      return (actuals[index] / target) * 100
    })

    console.log('准备更新图表:', {
      months: targetData.months,
      targets: targetData.targets,
      actuals,
      completionRates,
    })

    // 等待 DOM 更新并确保图表容器存在
    await nextTick()
    
    // 确保容器可见且有高度
    let retryCount = 0
    const tryUpdateChart = () => {
      if (!chartRef.value) {
        if (retryCount < 5) {
          retryCount++
          setTimeout(tryUpdateChart, 100)
        }
        return
      }
      
      if (chartRef.value.offsetHeight === 0) {
        if (retryCount < 5) {
          retryCount++
          setTimeout(tryUpdateChart, 100)
        }
        return
      }
      
      updateChart(targetData.months, targetData.targets, actuals, completionRates)
    }
    
    tryUpdateChart()
  } catch (err) {
    console.error('加载目标趋势数据失败:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

const updateChart = (
  months: string[],
  targets: number[],
  actuals: number[],
  completionRates: number[],
) => {
  if (!chartRef.value) {
    console.warn('图表容器不存在')
    return
  }

  // 检查容器状态
  const container = chartRef.value
  const containerInfo = {
    offsetWidth: container.offsetWidth,
    offsetHeight: container.offsetHeight,
    clientWidth: container.clientWidth,
    clientHeight: container.clientHeight,
    display: window.getComputedStyle(container).display,
    visibility: window.getComputedStyle(container).visibility,
  }
  console.log('图表容器信息:', containerInfo)

  // 确保容器有高度
  if (container.offsetHeight === 0 || container.offsetWidth === 0) {
    console.warn('图表容器尺寸为0，延迟初始化', containerInfo)
    setTimeout(() => updateChart(months, targets, actuals, completionRates), 200)
    return
  }

  // 如果图表实例不存在，创建新实例
  if (!chartInstance) {
    try {
      chartInstance = echarts.init(container)
      console.log('图表实例已创建，容器尺寸:', containerInfo)
    } catch (err) {
      console.error('创建图表实例失败:', err)
      return
    }
  } else {
    // 检查 Canvas 是否存在，如果不存在则重新初始化
    const existingCanvas = container.querySelector('canvas')
    if (!existingCanvas) {
      console.warn('Canvas 不存在，重新初始化图表实例')
      chartInstance.dispose()
      chartInstance = null
      try {
        chartInstance = echarts.init(container)
        console.log('图表实例已重新创建')
      } catch (err) {
        console.error('重新创建图表实例失败:', err)
        return
      }
    } else {
      console.log('图表实例已存在，准备更新')
    }
  }
  
  // 确保图表容器可见
  if (container.style.display === 'none') {
    container.style.display = 'block'
  }
  if (container.style.visibility === 'hidden') {
    container.style.visibility = 'visible'
  }

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
      formatter: (params: any) => {
        const isAmountType = targetType.value === 'contract_amount' || targetType.value === 'sales_amount'
        const unit = isAmountType ? '元' : '个'
        let result = `${params[0].axisValue}<br/>`
        params.forEach((param: any) => {
          if (param.seriesName === '完成率') {
            result += `${param.marker}${param.seriesName}: ${param.value.toFixed(2)}%<br/>`
          } else {
            result += `${param.marker}${param.seriesName}: ${param.value.toLocaleString('zh-CN')}${unit}<br/>`
          }
        })
        return result
      },
    },
    legend: {
      data: ['目标值', '实际值', '完成率'],
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
      data: months,
      axisPointer: {
        type: 'shadow',
      },
    },
    yAxis: [
      {
        type: 'value',
        name: (() => {
          const isAmountType = targetType.value === 'contract_amount' || targetType.value === 'sales_amount'
          return isAmountType ? '金额（元）' : '数量（个）'
        })(),
        position: 'left',
        axisLabel: {
          formatter: (value: number) => {
            const isAmountType = targetType.value === 'contract_amount' || targetType.value === 'sales_amount'
            if (isAmountType) {
              if (value >= 10000) {
                return `${(value / 10000).toFixed(1)}万`
              }
              return value.toLocaleString('zh-CN')
            } else {
              return value.toLocaleString('zh-CN')
            }
          },
        },
      },
      {
        type: 'value',
        name: '完成率（%）',
        position: 'right',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%',
        },
      },
    ],
    series: [
      {
        name: '目标值',
        type: 'bar',
        data: targets,
        itemStyle: {
          color: '#5470c6',
        },
      },
      {
        name: '实际值',
        type: 'bar',
        data: actuals,
        itemStyle: {
          color: '#91cc75',
        },
      },
      {
        name: '完成率',
        type: 'line',
        yAxisIndex: 1,
        data: completionRates,
        itemStyle: {
          color: '#fac858',
        },
        lineStyle: {
          width: 2,
        },
      },
    ],
  }

  try {
    // 确保容器有尺寸
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.warn('容器尺寸为0，无法渲染图表')
      return
    }

    // 设置图表选项（不合并，完全替换）
    chartInstance.setOption(option, true)
    
    // 立即调整大小
    chartInstance.resize()
    
    // 使用 requestAnimationFrame 确保在下一帧检查渲染结果
    requestAnimationFrame(() => {
      if (chartInstance && chartRef.value) {
        const canvas = chartRef.value.querySelector('canvas')
        if (canvas) {
          console.log('图表Canvas已渲染，尺寸:', canvas.width, 'x', canvas.height)
        } else {
          console.warn('图表Canvas未找到，尝试重新设置选项和调整大小')
          // 如果 Canvas 不存在，重新设置选项并调整大小
          chartInstance.setOption(option, true)
          chartInstance.resize()
          
          // 再次检查
          setTimeout(() => {
            const canvasAfterRetry = chartRef.value?.querySelector('canvas')
            if (canvasAfterRetry) {
              console.log('重新渲染成功，Canvas尺寸:', canvasAfterRetry.width, 'x', canvasAfterRetry.height)
            } else {
              console.error('重新渲染失败，Canvas仍未创建')
            }
          }, 100)
        }
      }
    })
    
    console.log('图表已更新，当前容器尺寸:', {
      width: chartRef.value?.offsetWidth,
      height: chartRef.value?.offsetHeight,
    })
  } catch (err) {
    console.error('更新图表失败:', err)
    // 如果更新失败，尝试重新初始化
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }
    if (chartRef.value && chartRef.value.offsetWidth > 0 && chartRef.value.offsetHeight > 0) {
      try {
        chartInstance = echarts.init(chartRef.value)
        chartInstance.setOption(option, true)
        chartInstance.resize()
      } catch (initErr) {
        console.error('重新初始化图表失败:', initErr)
      }
    }
  }
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
  () => [props.scopeFilter, props.parsedScopeFilter, props.targetType],
  () => {
    loadData()
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
.target-trend-chart {
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
  min-height: 300px;
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

.chart-container {
  width: 100%;
  height: 100%;
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 300px;
}
</style>

