<template>
  <div class="dashboard">
    <!-- 共享过滤条件 -->
    <div class="shared-filters">
      <div class="filters-container">
        <el-select
          v-model="scopeFilter"
          placeholder="选择范围"
          size="default"
          style="width: 140px; margin-right: 12px"
        >
          <el-option label="本人及下属" value="me_and_subordinates" />
          <el-option label="全部" value="all" />
        </el-select>
        <el-select
          v-model="periodFilter"
          placeholder="选择周期"
          size="default"
          style="width: 120px"
          @change="handleFilterChange"
        >
          <el-option label="本周" value="week" />
          <el-option label="本月" value="month" />
          <el-option label="本季度" value="quarter" />
          <el-option label="本年" value="year" />
        </el-select>
      </div>
    </div>

    <!-- 销售简报 -->
    <SalesBrief :scope-filter="scopeFilter" :period-filter="periodFilter" />

    <!-- 第一行：客户分布地图、客户来源分布、销售漏斗 -->
    <div class="first-row-layout">
      <div class="chart-item map-item">
        <CustomerMap :scope-filter="scopeFilter" />
      </div>

      <div class="chart-item source-item">
        <CustomerSourceDistribution :scope-filter="scopeFilter" />
      </div>

      <div class="chart-item funnel-item">
        <SalesFunnel :scope-filter="scopeFilter" />
      </div>
    </div>

    <!-- 第二行：数据汇总、客户遗忘提醒、排行榜 -->
    <div class="second-row-layout">
      <div class="column-item">
        <DataSummary :scope-filter="scopeFilter" :period-filter="periodFilter" />
      </div>

      <div class="column-item">
        <CustomerReminder :scope-filter="scopeFilter" />
      </div>

      <div class="column-item">
        <RankingList :scope-filter="scopeFilter" :period-filter="periodFilter" />
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="recent-activities">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>最近活动</span>
            <el-button type="primary" size="small" @click="$router.push('/activities')"
              >查看全部</el-button
            >
          </div>
        </template>
        <el-timeline>
          <el-timeline-item
            v-for="activity in recentActivities"
            :key="activity.id"
            :timestamp="activity.createdAt"
            placement="top"
          >
            <el-card>
              <h4>{{ activity.title }}</h4>
              <p>{{ activity.description }}</p>
              <el-tag :type="getActivityTypeColor(activity.type)">{{
                getActivityTypeName(activity.type)
              }}</el-tag>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/modules/auth'
import type { Activity } from '@/types'
import SalesBrief from '@/components/SalesBrief.vue'
import DataSummary from '@/components/DataSummary.vue'
import CustomerReminder from '@/components/CustomerReminder.vue'
import SalesFunnel from '@/components/SalesFunnel.vue'
import CustomerSourceDistribution from '@/components/CustomerSourceDistribution.vue'
import CustomerMap from '@/components/CustomerMap.vue'
import RankingList from '@/components/RankingList.vue'

const authStore = useAuthStore()

// 当前用户
const currentUser = computed(() => authStore.currentUser)
const currentMember = computed(() => authStore.currentMember)
const currentTenant = computed(() => authStore.currentTenant)
const isTenantOwner = computed(() => authStore.isTenantOwner)

// 图表周期
const chartPeriod = ref<'week' | 'month' | 'year'>('month')

// 过滤条件
const scopeFilter = ref('me_and_subordinates')
const periodFilter = ref('month')

// 处理过滤条件变化
const handleFilterChange = () => {
  // 过滤条件变化时，子组件会自动响应
  console.log('过滤条件变化:', { scopeFilter: scopeFilter.value, periodFilter: periodFilter.value })
}

// 统计数据
const stats = reactive({
  customers: 0,
  opportunities: 0,
  activities: 0,
  revenue: 0,
})

// 最近活动
const recentActivities = ref<Activity[]>([])

// 获取活动类型颜色
const getActivityTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    call: 'primary',
    meeting: 'success',
    email: 'info',
    task: 'warning',
    note: 'default',
  }
  return colorMap[type] || 'default'
}

// 获取活动类型名称
const getActivityTypeName = (type: string) => {
  const nameMap: Record<string, string> = {
    call: '电话',
    meeting: '会议',
    email: '邮件',
    task: '任务',
    note: '备注',
  }
  return nameMap[type] || type
}

// 加载数据
const loadData = async () => {
  try {
    // 这里应该调用实际的API获取数据
    // 现在使用模拟数据
    stats.customers = 156
    stats.opportunities = 23
    stats.activities = 89
    stats.revenue = 1250000

    // 模拟最近活动数据
    recentActivities.value = [
      {
        id: '1',
        title: '客户拜访',
        description: '与ABC公司进行产品演示',
        type: 'meeting',
        status: 'completed',
        scheduledAt: '2024-01-15T10:00:00Z',
        completedAt: '2024-01-15T11:30:00Z',
        ownerId: '1',
        tenantId: '1',
        owner: {} as any,
        tenant: {} as any,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T11:30:00Z',
      },
      {
        id: '2',
        title: '电话跟进',
        description: '跟进XYZ公司的询价',
        type: 'call',
        status: 'completed',
        scheduledAt: '2024-01-14T14:00:00Z',
        completedAt: '2024-01-14T14:30:00Z',
        ownerId: '1',
        tenantId: '1',
        owner: {} as any,
        tenant: {} as any,
        createdAt: '2024-01-14T14:00:00Z',
        updatedAt: '2024-01-14T14:30:00Z',
      },
      {
        id: '3',
        title: '发送报价单',
        description: '向DEF公司发送产品报价',
        type: 'email',
        status: 'completed',
        scheduledAt: '2024-01-13T09:00:00Z',
        completedAt: '2024-01-13T09:15:00Z',
        ownerId: '1',
        tenantId: '1',
        owner: {} as any,
        tenant: {} as any,
        createdAt: '2024-01-13T09:00:00Z',
        updatedAt: '2024-01-13T09:15:00Z',
      },
    ]
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.dashboard-header {
  margin-bottom: 24px;
}

.shared-filters {
  margin-bottom: 24px;
  padding: 16px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filters-container {
  display: flex;
  align-items: center;
}

/* 第一行布局：客户分布地图、客户来源分布、销售漏斗 */
.first-row-layout {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

/* 第二行布局：数据汇总、客户遗忘提醒、排行榜 */
.second-row-layout {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.chart-item {
  display: flex;
  flex-direction: column;
}

.column-item {
  display: flex;
  flex-direction: column;
}

.dashboard-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0 0 8px 0;
}

.owner-badge {
  color: #409eff;
  font-weight: 500;
}

.tenant-info {
  font-size: 12px;
  color: #c0c4cc;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.stat-icon.customer {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.opportunity {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.activity {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.revenue {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: #909399;
}

.chart-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.recent-activities {
  margin-bottom: 24px;
}

.recent-activities .el-card {
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

@media (max-width: 1200px) {
  .first-row-layout {
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .first-row-layout .funnel-item {
    grid-column: 1 / -1;
  }

  .second-row-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 900px) {
  .first-row-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .first-row-layout {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .second-row-layout {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
