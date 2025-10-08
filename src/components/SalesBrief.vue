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
          <div class="card-icon" :class="getCardIconClass(key)">
            <el-icon>
              <component :is="getCardIcon(key)" />
            </el-icon>
          </div>
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
        </div>
        <div class="card-chart">
          <div class="mini-chart" :class="getChartClass(item.changePercent)">
            <div class="chart-bar" v-for="i in 7" :key="i" :style="{ height: getBarHeight(i, item.changePercent) + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { statisticsApi, type SalesBriefData } from '@/api/statistics'
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

// Props
const props = defineProps<{
  scopeFilter?: string
  periodFilter?: string
}>()

// 默认值
const scopeFilter = computed(() => props.scopeFilter || 'me_and_subordinates')
const periodFilter = computed(() => props.periodFilter || 'month')

// 数据
const briefData = ref<SalesBriefData | null>(null)
const loading = ref(false)

// 计算属性
const scopeFilterText = computed(() => {
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
    year: '本年'
  }
  return map[periodFilter.value] || '本月'
})

// 方法
const loadSalesBrief = async () => {
  try {
    loading.value = true
    const response = await statisticsApi.getSalesBriefs(periodFilter.value as 'week' | 'month' | 'quarter' | 'year')
    briefData.value = response.data
  } catch (error) {
    console.error('加载销售简报失败:', error)
  } finally {
    loading.value = false
  }
}

// 监听过滤条件变化
watch([scopeFilter, periodFilter], () => {
  loadSalesBrief()
}, { immediate: false })

const getCardTitle = (key: string) => {
  const map: Record<string, string> = {
    newCustomers: '新增客户',
    newContacts: '新增联系人',
    newOpportunities: '新增商机',
    newActivities: '新增跟进记录',
    opportunityAmount: '商机金额'
  }
  return map[key] || key
}

const getCardIcon = (key: string) => {
  const map: Record<string, any> = {
    newCustomers: User,
    newContacts: Notebook,
    newOpportunities: TrendCharts,
    newActivities: Document,
    opportunityAmount: Money
  }
  return map[key] || Document
}

const getCardIconClass = (key: string) => {
  const map: Record<string, string> = {
    newCustomers: 'customer',
    newContacts: 'contact',
    newOpportunities: 'opportunity',
    newActivities: 'activity',
    opportunityAmount: 'amount'
  }
  return map[key] || 'default'
}

const formatValue = (value: number, key: string) => {
  if (key === 'opportunityAmount') {
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

const getChartClass = (percent: number) => {
  if (percent > 0) return 'positive'
  if (percent < 0) return 'negative'
  return 'neutral'
}

const getBarHeight = (index: number, percent: number) => {
  // 生成模拟的柱状图高度
  const baseHeight = 20
  const variation = Math.sin(index * 0.5) * 30
  return Math.max(10, baseHeight + variation)
}

onMounted(() => {
  loadSalesBrief()
})
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
  margin-bottom: 12px;
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
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
  height: 40px;
  display: flex;
  align-items: end;
}

.mini-chart {
  display: flex;
  align-items: end;
  gap: 2px;
  width: 100%;
  height: 100%;
}

.chart-bar {
  flex: 1;
  background: #e6f4ff;
  border-radius: 1px;
  min-height: 4px;
  transition: all 0.3s ease;
}

.mini-chart.positive .chart-bar {
  background: #67c23a;
}

.mini-chart.negative .chart-bar {
  background: #f56c6c;
}

.mini-chart.neutral .chart-bar {
  background: #909399;
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
