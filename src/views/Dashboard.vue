<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1 class="dashboard-title">仪表盘</h1>
        <p class="dashboard-subtitle">
          欢迎回来，{{ currentUser?.username }}
          <span v-if="isTenantOwner" class="owner-badge">（租户负责人）</span>
        </p>
      <p class="tenant-info">当前租户：{{ currentTenant?.name }}</p>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon customer">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.customers }}</div>
            <div class="stat-label">客户总数</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon opportunity">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.opportunities }}</div>
            <div class="stat-label">商机总数</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon activity">
            <el-icon><Calendar /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ stats.activities }}</div>
            <div class="stat-label">活动总数</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon revenue">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">¥{{ stats.revenue.toLocaleString() }}</div>
            <div class="stat-label">总销售额</div>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 图表区域 -->
    <div class="charts-grid">
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span>销售趋势</span>
            <el-button-group>
              <el-button size="small" :type="chartPeriod === 'week' ? 'primary' : ''" @click="chartPeriod = 'week'">周</el-button>
              <el-button size="small" :type="chartPeriod === 'month' ? 'primary' : ''" @click="chartPeriod = 'month'">月</el-button>
              <el-button size="small" :type="chartPeriod === 'year' ? 'primary' : ''" @click="chartPeriod = 'year'">年</el-button>
            </el-button-group>
          </div>
        </template>
        <div class="chart-container">
          <div class="chart-placeholder">
            <el-icon><TrendCharts /></el-icon>
            <p>销售趋势图表</p>
          </div>
        </div>
      </el-card>
      
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span>客户来源分布</span>
          </div>
        </template>
        <div class="chart-container">
          <div class="chart-placeholder">
            <el-icon><PieChart /></el-icon>
            <p>客户来源分布图</p>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 最近活动 -->
    <div class="recent-activities">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>最近活动</span>
            <el-button type="primary" size="small" @click="$router.push('/activities')">查看全部</el-button>
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
              <el-tag :type="getActivityTypeColor(activity.type)">{{ getActivityTypeName(activity.type) }}</el-tag>
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

const authStore = useAuthStore()

// 当前用户
const currentUser = computed(() => authStore.currentUser)
const currentMember = computed(() => authStore.currentMember)
const currentTenant = computed(() => authStore.currentTenant)
const isTenantOwner = computed(() => authStore.isTenantOwner)

// 图表周期
const chartPeriod = ref<'week' | 'month' | 'year'>('month')

// 统计数据
const stats = reactive({
  customers: 0,
  opportunities: 0,
  activities: 0,
  revenue: 0
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
    note: 'default'
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
    note: '备注'
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
        updatedAt: '2024-01-15T11:30:00Z'
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
        updatedAt: '2024-01-14T14:30:00Z'
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
        updatedAt: '2024-01-13T09:15:00Z'
      }
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

.dashboard-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
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

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
