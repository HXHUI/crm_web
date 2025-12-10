<template>
  <div class="sales-brief">
    <!-- 标题 -->
    <div class="brief-header">
      <div class="title-section">
        <h2 class="brief-title">销售简报</h2>
        <span class="filter-display">{{ scopeFilterText }} | {{ periodFilterText }}</span>
      </div>
      <div class="actions">
        <el-button size="small" circle>
          <el-icon><MoreFilled /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 数据卡片 -->
    <div class="brief-cards">
      <div class="brief-card" v-for="(item, key) in briefData" :key="key">
        <div class="card-header">
          <div class="card-content">
            <div class="card-title">{{ getCardTitle(key) }}</div>
            <div class="card-value">{{ formatValue(item.current, key) }}</div>
            <div class="card-comparison">
              <span class="comparison-text">较{{ getPreviousPeriodText() }}</span>
              <span class="comparison-percent" :class="getComparisonClass(item.changePercent)">
                {{ formatPercent(item.changePercent) }}
                <el-icon v-if="item.changePercent !== 0" class="trend-icon">
                  <component :is="getTrendIcon(item.changePercent)" />
                </el-icon>
              </span>
            </div>
          </div>
          <div class="card-icon" :class="getCardIconClass(key)">
            <el-icon>
              <component :is="getCardIcon(key)" />
            </el-icon>
          </div>
        </div>
        <div class="card-chart">
          <div class="line-chart" :ref="el => setChartRef(el, key)" :id="`chart-${key}`"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { statisticsApi, type SalesBriefData, type SalesBriefTrendData } from '@/api/statistics'
import { 
  User, 
  Notebook, 
  TrendCharts, 
  Document, 
  Money,
  MoreFilled,
  ArrowUp,
  ArrowDown
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// Props
const props = defineProps<{
  scopeFilter?: string
  parsedScopeFilter?: { type: 'me_and_subordinates' | 'all' | 'department' | 'member'; departmentId?: number; memberId?: number }
  periodFilter?: string
  customDateRange?: [string, string] | null
}>()

// 默认值
const scopeFilter = computed(() => props.scopeFilter || 'me_and_subordinates')
const periodFilter = computed(() => props.periodFilter || 'month')

// 数据
const briefData = ref<SalesBriefData | null>(null)
const trendData = ref<SalesBriefTrendData | null>(null)
const loading = ref(false)
const chartInstances = ref<Map<string, echarts.ECharts>>(new Map())
const chartRefs = ref<Map<string, HTMLElement>>(new Map())

// 计算属性
const scopeFilterText = computed(() => {
  if (props.parsedScopeFilter) {
    const { type, departmentId, memberId } = props.parsedScopeFilter
    if (type === 'department' && departmentId) {
      return '部门'
    }
    if (type === 'member' && memberId) {
      return '用户'
    }
    if (type === 'all') {
      return '全部'
    }
  }
  const map: Record<string, string> = {
    me_and_subordinates: '本人及下属',
    all: '全部'
  }
  return map[scopeFilter.value] || '本人及下属'
})

const periodFilterText = computed(() => {
  const map: Record<string, string> = {
    week: '本周',
    month: '本月',
    quarter: '本季度',
    year: '本年',
    last_week: '上周',
    last_month: '上月',
    last_quarter: '上季度',
    last_year: '上年',
    custom: '自定义期间'
  }
  if (periodFilter.value === 'custom' && props.customDateRange && props.customDateRange.length === 2) {
    return `${props.customDateRange[0]} 至 ${props.customDateRange[1]}`
  }
  return map[periodFilter.value] || '本月'
})

// 方法
const loadSalesBrief = async () => {
  try {
    loading.value = true
    // 始终使用租户视图，因为顶部导航选择租户时已经确定了数据范围
    const period = periodFilter.value as 'week' | 'month' | 'quarter' | 'year' | 'last_week' | 'last_month' | 'last_quarter' | 'last_year' | 'custom'
    const params: any = {
      period,
      viewType: 'tenant'
    }
    
    // 如果是自定义期间，传递日期范围
    if (period === 'custom' && props.customDateRange && props.customDateRange.length === 2) {
      params.startDate = props.customDateRange[0]
      params.endDate = props.customDateRange[1]
    }
    
    const [briefResponse, trendResponse] = await Promise.all([
      statisticsApi.getSalesBriefs(
        period, 
        'tenant', 
        params.startDate, 
        params.endDate,
        props.parsedScopeFilter?.type,
        props.parsedScopeFilter?.departmentId,
        props.parsedScopeFilter?.memberId,
      ),
      statisticsApi.getSalesBriefsTrend('tenant')
    ])
    briefData.value = briefResponse.data
    trendData.value = trendResponse.data
    // 数据加载后，初始化或更新图表
    await nextTick()
    initCharts()
  } catch (error) {
    console.error('加载销售简报失败:', error)
  } finally {
    loading.value = false
  }
}

// 设置图表引用
const setChartRef = (el: HTMLElement | null, key: string) => {
  if (el) {
    chartRefs.value.set(key, el)
  }
}

// 获取近6个月的趋势数据（从API获取）
const getTrendData = (key: string) => {
  if (!trendData.value || !trendData.value[key]) {
    // 如果没有趋势数据，返回空数据
    return { months: [], values: [] }
  }
  
  return {
    months: trendData.value[key].months,
    values: trendData.value[key].values
  }
}

// 初始化图表
const initCharts = () => {
  if (!briefData.value) return
  
  Object.keys(briefData.value).forEach((key) => {
    const chartElement = chartRefs.value.get(key)
    if (!chartElement) return
    
    // 如果图表已存在，先销毁
    const existingChart = chartInstances.value.get(key)
    if (existingChart) {
      existingChart.dispose()
    }
    
    // 创建新图表
    const chart = echarts.init(chartElement)
    const item = briefData.value![key]
    const trend = getTrendData(key)
    
    // 如果没有趋势数据，不显示图表
    if (!trend.months.length || !trend.values.length) {
      return
    }
    
    const option = {
      grid: {
        left: '5%',
        right: '5%',
        top: '10%',
        bottom: '10%',
        containLabel: false
      },
      xAxis: {
        type: 'category',
        data: trend.months,
        show: false,
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        show: false,
        splitLine: {
          show: false
        }
      },
      series: [
        {
          type: 'line',
          data: trend.values,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 2,
            color: getLineColor(item.changePercent)
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: getAreaColor(item.changePercent, 0.3)
                },
                {
                  offset: 1,
                  color: getAreaColor(item.changePercent, 0)
                }
              ]
            }
          }
        }
      ],
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const param = params[0]
          return `${param.name}<br/>${getCardTitle(key)}: ${formatValue(param.value, key)}`
        },
        axisPointer: {
          type: 'line'
        }
      }
    }
    
    chart.setOption(option)
    chartInstances.value.set(key, chart)
  })
}

// 获取折线颜色
const getLineColor = (percent: number) => {
  if (percent > 0) return '#67c23a'
  if (percent < 0) return '#f56c6c'
  return '#909399'
}

// 获取区域填充颜色
const getAreaColor = (percent: number, opacity: number) => {
  if (percent > 0) return `rgba(103, 194, 58, ${opacity})`
  if (percent < 0) return `rgba(245, 108, 108, ${opacity})`
  return `rgba(144, 147, 153, ${opacity})`
}

// 监听过滤条件变化
watch([scopeFilter, periodFilter, () => props.customDateRange, () => props.parsedScopeFilter], () => {
  loadSalesBrief()
}, { immediate: false, deep: true })

// 监听窗口大小变化，调整图表大小
const handleResize = () => {
  chartInstances.value.forEach((chart) => {
    chart.resize()
  })
}

onMounted(() => {
  loadSalesBrief()
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstances.value.forEach((chart) => {
    chart.dispose()
  })
  chartInstances.value.clear()
})

const getCardTitle = (key: string) => {
  const map: Record<string, string> = {
    newCustomers: '新增客户',
    newContacts: '新增联系人',
    newOpportunities: '新增商机',
    newActivities: '新增跟进记录',
    opportunityAmount: '商机金额',
    contractAmount: '合同金额',
    orderAmount: '订单金额'
  }
  return map[key] || key
}

const getCardIcon = (key: string) => {
  const map: Record<string, any> = {
    newCustomers: User,
    newContacts: Notebook,
    newOpportunities: TrendCharts,
    newActivities: Document,
    opportunityAmount: Money,
    contractAmount: Money,
    orderAmount: Money
  }
  return map[key] || Document
}

const getCardIconClass = (key: string) => {
  const map: Record<string, string> = {
    newCustomers: 'customer',
    newContacts: 'contact',
    newOpportunities: 'opportunity',
    newActivities: 'activity',
    opportunityAmount: 'amount',
    contractAmount: 'amount',
    orderAmount: 'amount'
  }
  return map[key] || 'default'
}

const formatValue = (value: number, key: string) => {
  if (key === 'opportunityAmount' || key === 'contractAmount' || key === 'orderAmount') {
    return `¥${value.toLocaleString()}`
  }
  const unit = key === 'newActivities' ? '条' : (key === 'newOpportunities' ? '个' : '人')
  return `${value}${unit}`
}

const getPreviousPeriodText = () => {
  const map: Record<string, string> = {
    week: '上周',
    month: '上月',
    quarter: '上季度',
    year: '去年'
  }
  return map[periodFilter.value] || '上月'
}

const formatPercent = (percent: number) => {
  if (percent === 0) return '0%'
  const sign = percent > 0 ? '+' : ''
  return `${sign}${percent}%`
}

const getComparisonClass = (percent: number) => {
  if (percent > 0) return 'positive'
  if (percent < 0) return 'negative'
  return 'neutral'
}

const getTrendIcon = (percent: number) => {
  return percent > 0 ? ArrowUp : ArrowDown
}

</script>

<style scoped>
.sales-brief {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.brief-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.title-section {
  flex: 1;
  text-align: left;
}

.brief-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
}

.filter-display {
  display: block;
  font-size: 12px;
  color: #666;
}

.actions {
  display: flex;
  align-items: center;
}

.brief-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.brief-card {
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
}

.brief-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12px;
  flex-shrink: 0;
  font-size: 18px;
  color: white;
}

.card-icon.customer {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-icon.contact {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.card-icon.opportunity {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.card-icon.activity {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.card-icon.amount {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.card-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.card-comparison {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.comparison-text {
  color: #999;
}

.comparison-percent {
  font-weight: 500;
}

.comparison-percent.positive {
  color: #67c23a;
}

.comparison-percent.negative {
  color: #f56c6c;
}

.comparison-percent.neutral {
  color: #909399;
}

.trend-icon {
  font-size: 10px;
  margin-left: 2px;
}

.card-chart {
  height: 60px;
  width: 100%;
  margin-top: 8px;
}

.line-chart {
  width: 100%;
  height: 100%;
}

@media (max-width: 768px) {
  .brief-cards {
    grid-template-columns: 1fr;
  }
  
  .brief-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .filters {
    justify-content: center;
  }
  
  .actions {
    justify-content: center;
  }
}
</style>
