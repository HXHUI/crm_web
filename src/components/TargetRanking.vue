<template>
  <div class="target-ranking">
    <div class="chart-header">
      <div class="title-section">
        <h3 class="chart-title">目标排行榜</h3>
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
import targetApi, { type TargetRankingItem } from '@/api/target'
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
      targetApi.getTargetRanking(targetType.value as any, year, scopeType, departmentId, memberId),
      (() => {
        switch (targetType.value) {
          case 'contract_amount':
            return statisticsApi.getContractAmountRanking(year, scopeType, departmentId, memberId)
          case 'sales_amount':
            return statisticsApi.getOrderAmountRanking(year, scopeType, departmentId, memberId)
          case 'new_leads':
            return statisticsApi.getLeadCountRanking(year, scopeType, departmentId, memberId)
          case 'new_customers':
            return statisticsApi.getCustomerCountRanking(year, scopeType, departmentId, memberId)
          case 'new_opportunities':
            return statisticsApi.getOpportunityCountRanking(year, scopeType, departmentId, memberId)
          case 'won_opportunities':
            return statisticsApi.getWonOpportunityCountRanking(year, scopeType, departmentId, memberId)
          default:
            return Promise.resolve({ data: [] })
        }
      })(),
    ])

    console.log('目标排行榜数据:', targetResponse)
    console.log('实际排行榜数据:', actualResponse)

    const targetData = targetResponse.data || targetResponse
    const actualData = actualResponse.data || actualResponse

    if (!Array.isArray(targetData)) {
      console.error('目标数据格式错误:', targetData)
      error.value = true
      return
    }

    if (!Array.isArray(actualData)) {
      console.warn('实际数据格式错误，使用空数组:', actualData)
    }

    // 合并数据并按实际金额排序
    // 首先，确保所有有实际金额的数据都被包含（即使没有目标数据）
    const allOwnerKeys = new Set<string>()
    targetData.forEach(t => {
      allOwnerKeys.add(`${t.ownerType}:${t.ownerId}`)
    })
    ;(actualData || []).forEach(a => {
      allOwnerKeys.add(`${a.ownerType}:${a.ownerId}`)
    })
    
    const rankingData = Array.from(allOwnerKeys).map(key => {
      const [ownerType, ownerIdStr] = key.split(':')
      const ownerId = Number(ownerIdStr)
      
      const target = targetData.find(
        (t) => String(t.ownerType) === String(ownerType) && Number(t.ownerId) === ownerId
      )
      const actual = (actualData || []).find(
        (a) => String(a.ownerType) === String(ownerType) && Number(a.ownerId) === ownerId
      )
      
      // 判断是金额类型还是数量类型
      const isAmountType = targetType.value === 'contract_amount' || targetType.value === 'sales_amount'
      const actualValue = isAmountType 
        ? (actual as any)?.totalAmount || 0
        : (actual as any)?.totalCount || 0
      
      return {
        ownerType,
        ownerId,
        ownerName: target?.ownerName || actual?.ownerName || `成员#${ownerId}`,
        totalTarget: target?.totalTarget || 0,
        totalActual: actualValue,
        completionRate: (target?.totalTarget || 0) > 0 
          ? (actualValue / (target?.totalTarget || 0)) * 100 
          : 0,
      }
    })

    // 按实际值降序排序，如果实际值相同则按目标值降序排序，确保排序稳定
    rankingData.sort((a, b) => {
      if (b.totalActual !== a.totalActual) {
        return b.totalActual - a.totalActual
      }
      // 如果实际值相同，按目标值降序排序
      return b.totalTarget - a.totalTarget
    })

    console.log('准备更新排行榜图表:', rankingData)

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
      
      updateChart(rankingData)
    }
    
    tryUpdateChart()
  } catch (err) {
    console.error('加载目标排行榜数据失败:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

const updateChart = (data: Array<{
  ownerName: string
  totalTarget: number
  totalActual: number
  completionRate: number
}>) => {
  if (!chartRef.value) {
    console.warn('图表容器不存在')
    return
  }

  // 确保容器有高度
  if (chartRef.value.offsetHeight === 0) {
    console.warn('图表容器高度为0，延迟初始化')
    setTimeout(() => updateChart(data), 200)
    return
  }

  // 如果图表实例不存在，创建新实例
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
    console.log('图表实例已创建')
  } else {
    // 检查 Canvas 是否存在，如果不存在则重新初始化
    const existingCanvas = chartRef.value.querySelector('canvas')
    if (!existingCanvas) {
      console.warn('Canvas 不存在，重新初始化图表实例')
      chartInstance.dispose()
      chartInstance = null
      chartInstance = echarts.init(chartRef.value)
      console.log('图表实例已重新创建')
    } else {
      console.log('图表实例已存在，准备更新')
    }
  }
  
  // 确保图表容器可见
  if (chartRef.value.style.display === 'none') {
    chartRef.value.style.display = 'block'
  }

  // 只显示前10名
  const displayData = data.slice(0, 10).reverse()

  // 准备Y轴数据，添加排名标识
  // 注意：displayData已经反转，所以数组最后一个元素（图表底部）是第1名
  const yAxisData = displayData.map((d, index) => {
    // 计算真实排名：数组最后一个元素是第1名
    const realRank = displayData.length - index
    let rankIcon = ''
    if (realRank === 1) {
      rankIcon = '🥇 ' // 金牌
    } else if (realRank === 2) {
      rankIcon = '🥈 ' // 银牌
    } else if (realRank === 3) {
      rankIcon = '🥉 ' // 铜牌
    } else {
      rankIcon = `${realRank}. ` // 其他排名显示数字
    }
    return `${rankIcon}${d.ownerName}`
  })

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        const isAmountType = targetType.value === 'contract_amount' || targetType.value === 'sales_amount'
        const unit = isAmountType ? '元' : '个'
        // 从Y轴值中提取原始名称（移除排名标识）
        const axisValue = params[0].axisValue as string
        const ownerName = axisValue.replace(/^[🥇🥈🥉]?\s*\d+\.\s*/, '')
        let result = `${ownerName}<br/>`
        params.forEach((param: any) => {
          const data = param.data as any
          if (param.seriesName === '目标值') {
            result += `${param.marker}${param.seriesName}: ${data.target.toLocaleString('zh-CN')}${unit}<br/>`
          } else if (param.seriesName === '实际值') {
            result += `${param.marker}${param.seriesName}: ${data.actual.toLocaleString('zh-CN')}${unit}<br/>`
            result += `完成率: ${data.rate.toFixed(2)}%<br/>`
          }
        })
        return result
      },
    },
    legend: {
      data: ['目标值', '实际值'],
      top: 10,
    },
    grid: {
      left: '15%',
      right: '10%',
      bottom: '3%',
      top: '15%',
      containLabel: false,
    },
    xAxis: {
      type: 'value',
      name: (() => {
        const isAmountType = targetType.value === 'contract_amount' || targetType.value === 'sales_amount'
        return isAmountType ? '金额（元）' : '数量（个）'
      })(),
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
    yAxis: {
      type: 'category',
      data: yAxisData,
      axisLabel: {
        interval: 0,
        formatter: (value: string) => {
          // 移除排名标识后检查长度
          const nameWithoutIcon = value.replace(/^[🥇🥈🥉]?\s*\d+\.\s*/, '')
          if (nameWithoutIcon.length > 6) {
            // 保留排名标识，只截断名称
            const match = value.match(/^([🥇🥈🥉]?\s*\d+\.\s*)(.+)$/)
            if (match) {
              return match[1] + match[2].substring(0, 6) + '...'
            }
            return value.substring(0, 10) + '...'
          }
          return value
        },
      },
    },
    series: [
      {
        name: '目标值',
        type: 'bar',
        data: displayData.map((d) => ({
          value: d.totalTarget,
          target: d.totalTarget,
          actual: d.totalActual,
          rate: d.completionRate,
        })),
        itemStyle: {
          color: '#5470c6',
        },
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => {
            const data = params.data as any
            return `目标: ${data.target.toLocaleString('zh-CN')}`
          },
        },
      },
      {
        name: '实际值',
        type: 'bar',
        data: displayData.map((d) => ({
          value: d.totalActual,
          target: d.totalTarget,
          actual: d.totalActual,
          rate: d.completionRate,
        })),
        itemStyle: {
          color: '#91cc75',
        },
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => {
            const data = params.data as any
            return `实际: ${data.actual.toLocaleString('zh-CN')} (${data.rate.toFixed(1)}%)`
          },
        },
      },
    ],
  }

  try {
    chartInstance.setOption(option, true) // 第二个参数 true 表示不合并，完全替换
    // 强制重新渲染
    chartInstance.resize()
    console.log('排行榜图表已更新，数据条数:', data.length)
  } catch (err) {
    console.error('更新排行榜图表失败:', err)
    // 如果更新失败，尝试重新初始化
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }
    chartInstance = echarts.init(chartRef.value)
    chartInstance.setOption(option, true)
    chartInstance.resize()
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
.target-ranking {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
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

