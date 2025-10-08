<template>
  <div class="data-summary">
    <!-- 标题和过滤 -->
    <div class="summary-header">
      <div class="title-section">
        <div class="title-with-icon">
          <el-icon class="title-icon"><TrendCharts /></el-icon>
          <h3 class="summary-title">数据汇总</h3>
        </div>
        <div class="filter-display">{{ scopeFilterText }} | {{ periodFilterText }}</div>
      </div>
    </div>

    <!-- 数据内容 -->
    <div class="summary-content" v-if="summaryData">
      <!-- 客户汇总 -->
      <div class="summary-section">
        <h4 class="section-title">客户汇总</h4>
        <div class="metrics-grid">
          <div class="metric-item">
            <div class="metric-label">新增客户</div>
            <div class="metric-value">{{ summaryData.customerSummary.newCustomers }}人</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">
              转成交客户
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </div>
            <div class="metric-value">{{ summaryData.customerSummary.convertedCustomers }}人</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">
              放入公海客户
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </div>
            <div class="metric-value">{{ summaryData.customerSummary.publicPoolCustomers }}人</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">公海池领取</div>
            <div class="metric-value">
              {{ summaryData.customerSummary.claimedFromPublicPool }}人
            </div>
          </div>
        </div>
      </div>

      <!-- 商机汇总 -->
      <div class="summary-section">
        <h4 class="section-title">商机汇总</h4>
        <div class="metrics-grid">
          <div class="metric-item">
            <div class="metric-label">新增商机</div>
            <div class="metric-value">{{ summaryData.opportunitySummary.newOpportunities }}个</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">赢单商机</div>
            <div class="metric-value">{{ summaryData.opportunitySummary.wonOpportunities }}个</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">输单商机</div>
            <div class="metric-value">{{ summaryData.opportunitySummary.lostOpportunities }}个</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">商机总金额</div>
            <div class="metric-value">
              ¥{{ summaryData.opportunitySummary.totalAmount.toLocaleString() }}
            </div>
          </div>
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
import { ref, computed, onMounted, watch } from 'vue'
import { statisticsApi, type DataSummaryData } from '@/api/statistics'
import { TrendCharts, QuestionFilled, Loading, Warning } from '@element-plus/icons-vue'

// Props
const props = defineProps<{
  scopeFilter?: string
  periodFilter?: string
}>()

// 响应式数据
const summaryData = ref<DataSummaryData | null>(null)
const loading = ref(false)
const error = ref(false)

// 计算属性
const scopeFilterText = computed(() => {
  const map: Record<string, string> = {
    me_and_subordinates: '本人及下属',
    all: '全部',
  }
  return map[props.scopeFilter || 'me_and_subordinates'] || '本人及下属'
})

const periodFilterText = computed(() => {
  const map: Record<string, string> = {
    week: '本周',
    month: '本月',
    quarter: '本季度',
    year: '本年',
  }
  return map[props.periodFilter || 'month'] || '本月'
})

// 方法
const loadDataSummary = async () => {
  try {
    loading.value = true
    error.value = false
    const response = await statisticsApi.getDataSummary((props.periodFilter as any) || 'month')
    summaryData.value = response.data
  } catch (err) {
    console.error('加载数据汇总失败:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

// 监听周期变化
watch(
  () => props.periodFilter,
  () => {
    loadDataSummary()
  },
)

onMounted(() => {
  loadDataSummary()
})
</script>

<style scoped>
.data-summary {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.summary-header {
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

.summary-title {
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

.person-icon {
  font-size: 24px;
}

.chart-board {
  font-size: 20px;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.summary-section {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.summary-section:first-child {
  border-top: none;
  padding-top: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.metric-item {
  text-align: center;
}

.metric-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.help-icon {
  font-size: 12px;
  color: #c0c4cc;
  cursor: help;
}

.metric-value {
  font-size: 20px;
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

@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .summary-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .illustration {
    align-self: flex-end;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
