<template>
  <div class="dashboard">
    <!-- 共享过滤条件 -->
    <div class="shared-filters">
      <div class="filters-container">
        <el-select
          v-model="scopeFilter"
          placeholder="选择范围"
          size="default"
          style="width: 160px; margin-right: 12px"
          @change="handleScopeChange"
        >
          <el-option-group label="范围">
            <el-option label="全部" value="all" />
          </el-option-group>
          <el-option-group v-if="userDepartments.length > 0" label="部门">
            <el-option
              v-for="dept in userDepartments"
              :key="`department_${dept.id}`"
              :label="dept.name"
              :value="`department_${dept.id}`"
            />
          </el-option-group>
          <el-option-group v-if="userAndSubordinates.length > 0" label="用户">
            <el-option
              v-for="item in userAndSubordinates"
              :key="`member_${item.id}`"
              :label="item.label"
              :value="`member_${item.id}`"
            />
          </el-option-group>
        </el-select>
        <el-select
          v-model="periodFilter"
          placeholder="选择周期"
          size="default"
          style="width: 140px; margin-right: 12px"
          @change="handlePeriodChange"
        >
          <el-option-group label="当前周期">
            <el-option label="本周" value="week" />
            <el-option label="本月" value="month" />
            <el-option label="本季度" value="quarter" />
            <el-option label="本年" value="year" />
          </el-option-group>
          <el-option-group label="上一周期">
            <el-option label="上周" value="last_week" />
            <el-option label="上月" value="last_month" />
            <el-option label="上季度" value="last_quarter" />
            <el-option label="上年" value="last_year" />
          </el-option-group>
          <el-option-group label="自定义">
            <el-option label="自定义期间" value="custom" />
          </el-option-group>
        </el-select>
        <el-date-picker
          v-if="periodFilter === 'custom'"
          v-model="customDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始"
          end-placeholder="结束"
          size="default"
          style="width: 240px; margin-right: 12px"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="handleCustomDateChange"
        />
        <el-button
          v-if="periodFilter === 'custom' && customDateRange && customDateRange.length === 2"
          type="primary"
          size="default"
          @click="handleFilterChange"
        >
          应用
        </el-button>
      </div>
    </div>

    <!-- 销售简报 -->
    <SalesBrief
      :scope-filter="scopeFilter"
      :parsed-scope-filter="parsedScopeFilter"
      :period-filter="periodFilter"
      :custom-date-range="customDateRange"
    />

    <!-- 第一行：客户分布地图（全部客户、已成交客户）、客户来源分布 -->
    <div class="first-row-layout">
      <div class="chart-item maps-container">
        <div class="maps-card">
          <div class="maps-header">
            <div class="title-with-icon">
              <el-icon class="title-icon"><Location /></el-icon>
              <h3 class="card-title">客户分布地图</h3>
            </div>
            <div class="filter-display">{{ getScopeFilterText() }}</div>
          </div>
          <div class="maps-content">
            <div class="map-item-inline">
            <CustomerMap
              :scope-filter="scopeFilter"
              :parsed-scope-filter="parsedScopeFilter"
              title="全部客户"
              :only-converted="false"
              :show-card="false"
            />
            </div>
            <div class="map-item-inline">
            <CustomerMap
              :scope-filter="scopeFilter"
              :parsed-scope-filter="parsedScopeFilter"
              title="已成交客户"
              :only-converted="true"
              :show-card="false"
            />
            </div>
          </div>
        </div>
      </div>

      <div class="chart-item source-item">
        <CustomerSourceDistribution
          :scope-filter="scopeFilter"
          :parsed-scope-filter="parsedScopeFilter"
        />
      </div>
    </div>

    <!-- 第二行：目标分析 -->
    <div class="second-row-layout">
      <div class="chart-item target-analysis-item">
        <TargetAnalysis
          :scope-filter="scopeFilter"
          :parsed-scope-filter="parsedScopeFilter"
        />
      </div>
    </div>

    <!-- 漏斗分析行：商机转化漏斗、商机阶段分布、客户转化漏斗 -->
    <div class="funnel-analysis-layout">
      <div class="chart-item">
        <SalesFunnel
          :scope-filter="scopeFilter"
          :parsed-scope-filter="parsedScopeFilter"
        />
      </div>
      <div class="chart-item">
        <OpportunityStageDistribution
          :scope-filter="scopeFilter"
          :parsed-scope-filter="parsedScopeFilter"
        />
      </div>
      <div class="chart-item">
        <CustomerConversionFunnel
          :scope-filter="scopeFilter"
          :parsed-scope-filter="parsedScopeFilter"
        />
      </div>
    </div>

    <!-- 第三行：数据汇总、客户遗忘提醒、排行榜 -->
    <div class="third-row-layout">
      <div class="column-item">
        <DataSummary
          :scope-filter="scopeFilter"
          :parsed-scope-filter="parsedScopeFilter"
          :period-filter="periodFilter"
          :custom-date-range="customDateRange"
        />
      </div>

      <div class="column-item">
        <CustomerReminder
          :scope-filter="scopeFilter"
          :parsed-scope-filter="parsedScopeFilter"
        />
      </div>

      <div class="column-item">
        <RankingList
          :scope-filter="scopeFilter"
          :parsed-scope-filter="parsedScopeFilter"
          :period-filter="periodFilter"
          :custom-date-range="customDateRange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Location } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/modules/auth'
import { getMemberDepartments, getDepartmentMembers, type Department, type Member } from '@/api/department'
import SalesBrief from '@/components/SalesBrief.vue'
import DataSummary from '@/components/DataSummary.vue'
import CustomerReminder from '@/components/CustomerReminder.vue'
import SalesFunnel from '@/components/SalesFunnel.vue'
import CustomerSourceDistribution from '@/components/CustomerSourceDistribution.vue'
import CustomerMap from '@/components/CustomerMap.vue'
import RankingList from '@/components/RankingList.vue'
import TargetAnalysis from '@/components/TargetAnalysis.vue'
import OpportunityStageDistribution from '@/components/OpportunityStageDistribution.vue'
import CustomerConversionFunnel from '@/components/CustomerConversionFunnel.vue'


const authStore = useAuthStore()

// 当前用户
const currentMember = computed(() => authStore.currentMember)

// 范围选择相关数据
const userDepartments = ref<Department[]>([])
const userAndSubordinates = ref<Array<{ id: string; label: string; type: 'self' | 'subordinate' }>>([])
const loadingScopeOptions = ref(false)

// 过滤条件
const scopeFilter = ref('')
const periodFilter = ref('month')
const customDateRange = ref<[string, string] | null>(null)

// 解析范围过滤条件
const parsedScopeFilter = computed(() => {
  if (scopeFilter.value === 'all') {
    return { type: 'all' as const }
  }
  if (scopeFilter.value.startsWith('department_')) {
    const departmentId = scopeFilter.value.replace('department_', '')
    return { type: 'department' as const, departmentId: parseInt(departmentId) }
  }
  if (scopeFilter.value.startsWith('member_')) {
    const memberId = scopeFilter.value.replace('member_', '')
    return { type: 'member' as const, memberId: parseInt(memberId) }
  }
  // 默认返回全部
  return { type: 'all' as const }
})

// 处理周期变化
const handlePeriodChange = () => {
  // 如果不是自定义，直接触发变化
  if (periodFilter.value !== 'custom') {
    handleFilterChange()
  }
  // 如果是自定义，清空日期范围
  if (periodFilter.value === 'custom') {
    customDateRange.value = null
  }
}

// 处理自定义日期变化
const handleCustomDateChange = () => {
  // 自定义日期变化时，不自动触发，需要用户点击"应用"按钮
}

// 加载范围选择选项
const loadScopeOptions = async () => {
  if (!currentMember.value?.id) return

  try {
    loadingScopeOptions.value = true

    // 1. 加载用户所属部门
    const deptResponse = await getMemberDepartments(currentMember.value.id)
    userDepartments.value = deptResponse.data || []

    // 2. 加载用户选项（包含当前用户和下级用户）
    const userOptions: Array<{ id: string; label: string; type: 'self' | 'subordinate' }> = []

    if (!currentMember.value?.id) {
      userAndSubordinates.value = userOptions
      return
    }

    const member = currentMember.value as unknown as Member & { nickname?: string; isManager?: boolean }
    const currentMemberId = member.id.toString()
    const currentUserId = member.userId?.toString() || member.user?.id?.toString() || ''

    // 首先添加当前用户到列表开头
    const currentUserLabel = member.nickname || (member.user as { realName?: string })?.realName || member.user?.username || '当前用户'
    userOptions.push({
      id: currentMemberId,
      label: currentUserLabel,
      type: 'self'
    })

    // 如果用户是部门负责人，加载部门成员
    if (userDepartments.value.length > 0) {

      for (const dept of userDepartments.value) {
        // 检查用户是否是部门负责人
        const deptManagerId = dept.managerId ? dept.managerId.toString() : null
        const isManager = deptManagerId === currentMemberId || (member.isManager ?? false)

        if (isManager) {
          try {
            // 获取部门所有成员
            let allMembers: Member[] = []
            let page = 1
            const limit = 1000
            let hasMore = true

            while (hasMore) {
              const membersResponse = await getDepartmentMembers(dept.id, { page, limit })

              let members: Member[] = []
              if (membersResponse.data) {
                if (Array.isArray(membersResponse.data)) {
                  members = membersResponse.data
                } else if (membersResponse.data.members && Array.isArray(membersResponse.data.members)) {
                  members = membersResponse.data.members
                } else if (membersResponse.data.data && Array.isArray(membersResponse.data.data)) {
                  members = membersResponse.data.data
                }
              }

              allMembers = allMembers.concat(members)

              const total = membersResponse.data?.total || membersResponse.data?.data?.total || 0
              hasMore = allMembers.length < total && members.length === limit
              page++

              if (page > 100) {
                console.warn(`部门 ${dept.name} 成员数量过多，已获取前 ${allMembers.length} 个`)
                break
              }
            }

            // 添加部门成员（排除当前用户，通过 memberId 或 userId 比较）
            allMembers.forEach((memberItem: Member) => {
              const memberItemTyped = memberItem as Member & { nickname?: string }
              const memberItemId = memberItem.id.toString()
              const memberItemUserId = memberItem.userId?.toString() || memberItem.user?.id?.toString() || ''

              // 如果 memberId 与当前用户一致，跳过
              if (memberItemId === currentMemberId) {
                return
              }

              // 如果 userId 存在且与当前用户一致，跳过（不添加该选项，只保留"当前用户"选项）
              if (currentUserId && memberItemUserId && memberItemUserId === currentUserId) {
                return
              }

              // 否则添加到选项列表
              userOptions.push({
                id: memberItemId,
                label: `${memberItemTyped.nickname || (memberItemTyped.user as { realName?: string })?.realName || memberItemTyped.user?.username || '成员'} (${dept.name})`,
                type: 'subordinate'
              })
            })
          } catch (error) {
            console.error(`获取部门 ${dept.name} 成员失败:`, error)
          }
        }
      }
    }

    userAndSubordinates.value = userOptions

    // 首次加载时，如果 scopeFilter 为空，设置为当前用户
    if (!scopeFilter.value && currentMember.value?.id) {
      scopeFilter.value = `member_${currentMember.value.id}`
    }
  } catch (error) {
    console.error('加载范围选择选项失败:', error)
    ElMessage.error('加载范围选择选项失败')
  } finally {
    loadingScopeOptions.value = false
  }
}

// 处理范围变化
const handleScopeChange = () => {
  handleFilterChange()
}

// 获取范围过滤文本
const getScopeFilterText = () => {
  if (scopeFilter.value === 'all') {
    return '全部'
  }
  if (scopeFilter.value.startsWith('department_')) {
    const departmentId = scopeFilter.value.replace('department_', '')
    const dept = userDepartments.value.find(d => d.id === departmentId)
    return dept ? dept.name : '部门'
  }
  if (scopeFilter.value.startsWith('member_')) {
    const memberId = scopeFilter.value.replace('member_', '')
    const member = userAndSubordinates.value.find(m => m.id === memberId)
    // 如果找不到，可能是当前用户，尝试从 currentMember 获取
    if (!member && currentMember.value?.id && memberId === currentMember.value.id.toString()) {
      const member = currentMember.value as unknown as Member & { nickname?: string }
      return member.nickname || (member.user as { realName?: string })?.realName || member.user?.username || '当前用户'
    }
    return member ? member.label : '用户'
  }
  return '全部'
}

// 处理过滤条件变化
const handleFilterChange = () => {
  // 如果是自定义期间，需要验证日期范围
  if (periodFilter.value === 'custom') {
    if (!customDateRange.value || customDateRange.value.length !== 2) {
      ElMessage.warning('请选择完整的日期范围')
      return
    }
  }

  // 过滤条件变化时，子组件会自动响应
  console.log('过滤条件变化:', {
    scopeFilter: scopeFilter.value,
    periodFilter: periodFilter.value,
    customDateRange: customDateRange.value
  })
}

// 统计数据
const stats = reactive({
  customers: 0,
  opportunities: 0,
  activities: 0,
  revenue: 0,
})


// 加载数据
const loadData = async () => {
  try {
    // 这里应该调用实际的API获取数据
    // 现在使用模拟数据
    stats.customers = 156
    stats.opportunities = 23
    stats.activities = 89
    stats.revenue = 1250000
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

onMounted(() => {
  loadScopeOptions()
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

/* 第一行布局：客户分布地图（全部、已成交）、客户来源分布 */
.first-row-layout {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

/* 地图容器占两列 */
.maps-container {
  grid-column: span 2;
}

/* 地图卡片样式 */
.maps-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.maps-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.title-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 20px;
  color: #409eff;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.filter-display {
  font-size: 12px;
  color: #909399;
}

/* 地图内容区域 */
.maps-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  flex: 1;
}

.map-item-inline {
  display: flex;
  flex-direction: column;
}

/* 无卡片模式下的地图样式 */
.map-item-inline :deep(.customer-map.no-card) {
  background: transparent;
  padding: 0;
  box-shadow: none;
  border-radius: 0;
}

.map-item-inline :deep(.customer-map.no-card .chart-header) {
  margin-bottom: 12px;
}

.map-item-inline :deep(.customer-map.no-card .chart-title) {
  font-size: 16px;
  font-weight: 500;
}

/* 第二行布局：目标分析 */
.second-row-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

/* 漏斗分析行布局：商机转化漏斗、商机阶段分布、客户转化漏斗 */
.funnel-analysis-layout {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

/* 第三行布局：数据汇总、客户遗忘提醒、排行榜 */
.third-row-layout {
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

@media (max-width: 1200px) {
  .first-row-layout {
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .maps-container {
    grid-column: span 2;
  }

  .first-row-layout .funnel-item {
    grid-column: 1 / -1;
  }

  .second-row-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .target-analysis-item {
    grid-column: span 1;
  }

  .funnel-item {
    grid-column: span 1;
  }

  .funnel-analysis-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .third-row-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 900px) {
  .first-row-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .maps-container {
    grid-column: span 1;
  }

  .maps-content {
    grid-template-columns: 1fr;
  }

  .funnel-analysis-layout {
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

  .maps-container {
    grid-column: span 1;
  }

  .maps-content {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .second-row-layout {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .target-analysis-item {
    grid-column: span 1;
  }

  .funnel-analysis-layout {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .third-row-layout {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
