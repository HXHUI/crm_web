<template>
  <div class="ranking-list">
    <!-- 标题区域 -->
    <div class="ranking-header">
      <div class="title-section">
        <div class="title-with-icon">
          <el-icon class="title-icon"><TrendCharts /></el-icon>
          <h3 class="ranking-title">排行榜</h3>
          <el-icon class="help-icon"><QuestionFilled /></el-icon>
        </div>
        <div class="filter-display">{{ scopeFilterText }} | {{ periodFilterText }}</div>
      </div>
    </div>

    <!-- 指标选择器 -->
    <div class="metric-selector">
      <el-dropdown @command="handleMetricChange" trigger="click">
        <el-button type="primary" class="metric-button">
          {{ currentMetric.label }}
          <el-icon class="el-icon--right"><ArrowUp /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="metric in metricOptions"
              :key="metric.value"
              :command="metric.value"
              :class="{ active: currentMetric.value === metric.value }"
            >
              {{ metric.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 排行榜内容 -->
    <div class="ranking-content">
      <div class="table-header">
        <span class="header-text">{{ currentMetric.label }} ({{ currentMetric.unit }})</span>
      </div>

      <div v-if="loading" class="loading-state">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>

      <div v-else-if="rankingData.length === 0" class="empty-state">
        <el-icon><DataBoard /></el-icon>
        <span>暂无数据</span>
      </div>

      <div v-else class="ranking-list-content">
        <div
          v-for="(item, index) in rankingData"
          :key="item.memberId"
          class="ranking-item"
          :class="{ 'current-user': item.isCurrentUser }"
        >
          <div class="rank-number">
            <span v-if="index < 3" class="medal">{{ getMedalIcon(index) }}</span>
            <span v-else class="rank">{{ index + 1 }}</span>
          </div>
          <div class="member-info">
            <el-avatar :size="32" class="member-avatar">
              {{ item.memberName?.charAt(0) || 'U' }}
            </el-avatar>
            <div class="member-details">
              <div class="member-name">{{ item.memberName }}</div>
              <div class="member-position">{{ item.position || '销售' }}</div>
            </div>
          </div>
          <div class="metric-value">
            <span class="value">{{ formatValue(item.value) }}</span>
            <span class="unit">{{ currentMetric.unit }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 当前用户排名 -->
    <div v-if="currentUserRanking" class="current-user-ranking">
      <div class="user-info">
        <el-avatar :size="24" class="user-avatar">
          {{ currentUserRanking.memberName?.charAt(0) || 'U' }}
        </el-avatar>
        <span class="user-name">{{ currentUserRanking.memberName }}</span>
      </div>
      <div class="user-rank">排名 {{ currentUserRanking.rank || '--' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { TrendCharts, QuestionFilled, ArrowUp, Loading, DataBoard } from '@element-plus/icons-vue'
import { statisticsApi, type RankingItem } from '@/api/statistics'

// Props
const props = defineProps<{
  scopeFilter?: string
  periodFilter?: string
  customDateRange?: [string, string] | null
}>()

// 响应式数据
const rankingData = ref<RankingItem[]>([])
const currentUserRanking = ref<RankingItem | null>(null)
const loading = ref(false)
const currentMetric = ref({ value: 'newCustomers', label: '新增客户数', unit: '个' })

// 指标选项
const metricOptions = [
  { value: 'newCustomers', label: '新增客户数', unit: '个' },
  { value: 'newContacts', label: '新增联系人', unit: '个' },
  { value: 'newActivities', label: '新增跟进记录数', unit: '条' },
  { value: 'paymentAmount', label: '回款金额', unit: '元' },
  { value: 'contractAmount', label: '合同金额', unit: '元' },
  { value: 'contractCount', label: '合同数', unit: '个' },
]

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
    last_week: '上周',
    last_month: '上月',
    last_quarter: '上季度',
    last_year: '上年',
    custom: '自定义期间'
  }
  if (props.periodFilter === 'custom' && props.customDateRange && props.customDateRange.length === 2) {
    return `${props.customDateRange[0]} 至 ${props.customDateRange[1]}`
  }
  return map[props.periodFilter || 'month'] || '本月'
})

// 方法
const loadRankingData = async () => {
  try {
    loading.value = true
    const scope = props.scopeFilter === 'all' ? 'all' : 'me'
    const period = (props.periodFilter as 'week' | 'month' | 'quarter' | 'year') || 'month'
    const response = await statisticsApi.getRankingList(
      scope,
      period,
      currentMetric.value.value as any,
    )

    rankingData.value = response.data.ranking || []
    currentUserRanking.value = response.data.currentUser || null
  } catch (err) {
    console.error('加载排行榜数据失败:', err)
    rankingData.value = []
    currentUserRanking.value = null
  } finally {
    loading.value = false
  }
}

const handleMetricChange = (metricValue: string) => {
  const metric = metricOptions.find((m) => m.value === metricValue)
  if (metric) {
    currentMetric.value = metric
    loadRankingData()
  }
}

const getMedalIcon = (index: number) => {
  const medals = ['🥇', '🥈', '🥉']
  return medals[index] || ''
}

const formatValue = (value: number) => {
  if (currentMetric.value.value.includes('Amount')) {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }
  return value.toLocaleString('zh-CN')
}

// 监听过滤条件变化
watch([() => props.scopeFilter, () => props.periodFilter], () => {
  loadRankingData()
})

onMounted(() => {
  loadRankingData()
})
</script>

<style scoped>
.ranking-list {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.ranking-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
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

.ranking-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  margin-right: 8px;
}

.help-icon {
  font-size: 14px;
  color: #909399;
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

.chart-illustration {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ranking-icon {
  font-size: 24px;
}

.metric-selector {
  margin-bottom: 20px;
}

.metric-button {
  width: 100%;
  justify-content: space-between;
  font-weight: 500;
}

.ranking-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.table-header {
  padding: 12px 0;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 16px;
}

.header-text {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: #909399;
  flex: 1;
}

.empty-state {
  color: #c0c4cc;
}

.ranking-list-content {
  flex: 1;
  overflow-y: auto;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f7fa;
  transition: background-color 0.2s;
}

.ranking-item:hover {
  background-color: #f8f9fa;
}

.ranking-item.current-user {
  background-color: #e6f7ff;
  border-color: #91d5ff;
}

.ranking-item:last-child {
  border-bottom: none;
}

.rank-number {
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.medal {
  font-size: 20px;
}

.rank {
  font-size: 16px;
  font-weight: 600;
  color: #606266;
}

.member-info {
  display: flex;
  align-items: center;
  flex: 1;
  margin-right: 16px;
}

.member-avatar {
  margin-right: 12px;
  background-color: #409eff;
  color: white;
  font-weight: 500;
}

.member-details {
  flex: 1;
}

.member-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.member-position {
  font-size: 12px;
  color: #909399;
}

.metric-value {
  text-align: right;
}

.value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.unit {
  font-size: 12px;
  color: #909399;
  margin-left: 4px;
}

.current-user-ranking {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-radius: 6px;
  margin-top: 16px;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  margin-right: 8px;
  background-color: #409eff;
  color: white;
  font-weight: 500;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.user-rank {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

/* 下拉菜单样式 */
:deep(.el-dropdown-menu__item.active) {
  background-color: #e6f7ff;
  color: #409eff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ranking-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .illustration {
    align-self: flex-end;
  }

  .member-info {
    margin-right: 8px;
  }

  .member-avatar {
    margin-right: 8px;
  }
}
</style>
