<template>
  <div class="opportunity-management">
    <!-- 主容器 -->
    <div class="main-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item>
              <el-input
                v-model="searchForm.search"
                placeholder="搜索商机标题"
                clearable
                @keyup.enter="handleSearch"
                style="width: 200px"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="searchForm.stage"
                placeholder="商机阶段"
                clearable
                style="width: 120px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="初步接触" value="initial_contact" />
                <el-option label="需求分析" value="needs_analysis" />
                <el-option label="方案/报价" value="proposal_quote" />
                <el-option label="谈判审核" value="negotiation_review" />
                <el-option label="赢单" value="closed_won" />
                <el-option label="输单" value="closed_lost" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="searchForm.status"
                placeholder="商机状态"
                clearable
                style="width: 120px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="积极跟进" value="active" />
                <el-option label="等待客户" value="waiting_client" />
                <el-option label="已搁置" value="on_hold" />
                <el-option label="面临风险" value="at_risk" />
                <el-option label="已结束" value="closed" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="toolbar-right">
          <!-- 视图切换 -->
          <el-radio-group v-model="viewMode" size="default" style="margin-right: 12px">
            <el-radio-button value="list">
              <el-icon><List /></el-icon>
              <span style="margin-left: 4px">列表</span>
            </el-radio-button>
            <el-radio-button value="kanban">
              <el-icon><Grid /></el-icon>
              <span style="margin-left: 4px">看板</span>
            </el-radio-button>
          </el-radio-group>
          <el-button type="primary" :icon="Plus" @click="goToCreate"> 新增商机 </el-button>
          <el-button
            type="danger"
            :icon="Delete"
            :disabled="selectedRows.length === 0"
            @click="handleBatchDelete"
          >
            删除 ({{ selectedRows.length }})
          </el-button>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'" class="table-section">
        <el-table
          :data="opportunities"
          v-loading="loading"
          @selection-change="handleSelectionChange"
          style="width: 100%"
          border
          :summary-method="getSummaries"
          show-summary
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="title" label="商机标题" min-width="200">
            <template #default="{ row }">
              <el-button type="primary" link @click="viewOpportunityDetail(row)">
                {{ row.title }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="customer.name" label="关联客户" width="200" show-overflow-tooltip />
          <el-table-column prop="value" label="商机价值" width="120" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.value) }}
            </template>
          </el-table-column>
          <el-table-column prop="stage" label="阶段" width="120">
            <template #default="{ row }">
              <el-tag :type="getStageType(row.stage)">
                {{ getStageName(row.stage) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusName(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="probability" label="成交概率" width="100" align="center">
            <template #default="{ row }"> {{ row.probability }}% </template>
          </el-table-column>
          <el-table-column prop="expectedCloseDate" label="预计成交日期" width="160">
            <template #default="{ row }">
              {{ formatDateOnly(row.expectedCloseDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="owner.username" label="负责人" width="120" />
          <el-table-column label="部门" width="120">
            <template #default="{ row }">
              <span v-if="row.department?.name">{{ row.department.name }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="260" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" :icon="View" @click="viewOpportunity(row)">
                查看
              </el-button>
              <el-button type="warning" size="small" :icon="Edit" @click="editOpportunity(row)">
                编辑
              </el-button>
              <el-button type="danger" size="small" :icon="Delete" @click="deleteOpportunity(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-section">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>

      <!-- 看板视图 -->
      <div v-else-if="viewMode === 'kanban'" class="kanban-section" v-loading="loading">
        <div class="kanban-board">
          <div
            v-for="stage in stageColumns"
            :key="stage.value"
            class="kanban-column"
            :ref="(el) => setColumnRef(el, stage.value)"
          >
            <div class="kanban-column-header">
              <span class="stage-name">{{ stage.label }}</span>
              <el-tag :type="getStageType(stage.value)" size="small">
                {{ getOpportunitiesByStage(stage.value).length }}
              </el-tag>
            </div>
            <div
              class="kanban-column-body"
              :data-stage="stage.value"
            >
              <div
                v-for="opportunity in getOpportunitiesByStage(stage.value)"
                :key="opportunity.id"
                class="kanban-card"
                :data-id="opportunity.id"
              >
                <div class="kanban-card-header">
                  <span class="card-title" :title="opportunity.title">{{ opportunity.title }}</span>
                </div>
                <div class="kanban-card-body">
                  <div class="card-item">
                    <span class="card-label">客户：</span>
                    <span class="card-value" :title="opportunity.customer?.name">
                      {{ opportunity.customer?.name || '-' }}
                    </span>
                  </div>
                  <div class="card-item">
                    <span class="card-label">价值：</span>
                    <span class="card-value">{{ formatCurrency(opportunity.value) }}</span>
                  </div>
                  <div class="card-item">
                    <span class="card-label">概率：</span>
                    <span class="card-value">{{ opportunity.probability }}%</span>
                  </div>
                  <div class="card-item">
                    <span class="card-label">预计成交日期：</span>
                    <span class="card-value">{{ formatDateOnly(opportunity.expectedCloseDate) }}</span>
                  </div>
                  <div class="card-item">
                    <el-tag :type="getStatusType(opportunity.status)" size="small">
                      {{ getStatusName(opportunity.status) }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 商机表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <OpportunityForm
        v-if="dialogVisible"
        ref="opportunityFormRef"
        :opportunity="currentOpportunity"
        @submit="handleFormSubmit"
        @cancel="dialogVisible = false"
      />
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit"> 确定 </el-button>
      </template>
    </el-dialog>

    <!-- 商机详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      direction="rtl"
      size="70%"
      :with-header="false"
      class="detail-drawer"
      :before-close="handleDrawerClose"
    >
      <div v-if="selectedOpportunity" class="detail-layout">
        <!-- 左侧导航按钮 -->
        <div class="left-nav" :class="{ collapsed: menuCollapsed }">
          <!-- 收缩/展开按钮 -->
          <div class="menu-toggle" @click="menuCollapsed = !menuCollapsed">
            <el-icon>
              <Fold v-if="!menuCollapsed" />
              <Expand v-else />
            </el-icon>
          </div>
          <ul class="side-menu with-timeline">
            <!-- 顺序：基本信息、活动记录、拜访记录、销售合同、销售订单 -->
            <li
              class="side-item"
              :class="{ active: activeTab === 'basic' }"
              @click="handleNavClick('basic')"
            >
              <span class="item-btn" :title="menuCollapsed ? '基本信息' : ''">
                <el-icon class="item-icon"><User /></el-icon>
                <span v-show="!menuCollapsed" class="item-text">基本信息</span>
              </span>
            </li>
            <li
              class="side-item"
              :class="{ active: activeTab === 'activities' }"
              @click="handleNavClick('activities')"
            >
              <span class="item-btn" :title="menuCollapsed ? '活动记录' : ''">
                <el-icon class="item-icon"><Clock /></el-icon>
                <span v-show="!menuCollapsed" class="item-text">活动记录</span>
              </span>
            </li>
            <li
              class="side-item"
              :class="{ active: activeTab === 'visits' }"
              @click="handleNavClick('visits')"
            >
              <span class="item-btn" :title="menuCollapsed ? '拜访记录' : ''">
                <el-icon class="item-icon"><Location /></el-icon>
                <span v-show="!menuCollapsed" class="item-text">拜访记录</span>
              </span>
            </li>
            <li
              class="side-item"
              :class="{ active: activeTab === 'contracts' }"
              @click="handleNavClick('contracts')"
            >
              <span class="item-btn" :title="menuCollapsed ? '销售合同' : ''">
                <el-icon class="item-icon"><Files /></el-icon>
                <span v-show="!menuCollapsed" class="item-text">销售合同</span>
              </span>
            </li>
            <li
              class="side-item"
              :class="{ active: activeTab === 'orders' }"
              @click="handleNavClick('orders')"
            >
              <span class="item-btn" :title="menuCollapsed ? '销售订单' : ''">
                <el-icon class="item-icon"><ShoppingCart /></el-icon>
                <span v-show="!menuCollapsed" class="item-text">销售订单</span>
              </span>
            </li>
          </ul>
        </div>

        <!-- 右侧内容区域 -->
        <div class="right-content">
          <!-- 可滚动内容区域（包含基本信息和各业务模块） -->
          <div class="dynamic-content-section detail-scroll-container" ref="detailContentRef">
            <!-- 基本信息 -->
            <el-card id="opportunity-section-basic" shadow="never" class="section-card basic-info-section detail-section">
              <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <h3 class="section-title" style="margin: 0">基本信息</h3>
                  <div class="action-buttons">
                    <el-button type="primary" :icon="Edit" @click="openEditOpportunity">编辑</el-button>
                  </div>
                </div>
              </template>
              <div class="detail-header">
                <div class="detail-title">
                  <h2>{{ selectedOpportunity.title }}</h2>
                </div>
                <div class="detail-meta">
                  <div class="meta-item">
                    <span class="meta-label">关联客户:</span>
                    <span class="meta-value">{{ selectedOpportunity.customer?.name || '-' }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">商机阶段:</span>
                    <span class="meta-value">
                      <el-tag :type="getStageType(selectedOpportunity.stage)" size="small">
                        {{ getStageName(selectedOpportunity.stage) }}
                      </el-tag>
                    </span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">负责人:</span>
                    <span class="meta-value">{{ getUserName(selectedOpportunity.owner) || '-' }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">创建时间:</span>
                    <span class="meta-value">{{ formatDate(selectedOpportunity.createdAt) }}</span>
                  </div>
                </div>
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <label>商机价值：</label>
                  <span>{{ formatCurrency(selectedOpportunity.value) }}</span>
                </div>
                <div class="info-item">
                  <label>成交概率：</label>
                  <span>{{ selectedOpportunity.probability }}%</span>
                </div>
                <div class="info-item">
                  <label>预计成交日期：</label>
                  <span>{{ selectedOpportunity.expectedCloseDate ? formatDateOnly(selectedOpportunity.expectedCloseDate) : '-' }}</span>
                </div>
                <div class="info-item">
                  <label>商机状态：</label>
                  <span>
                    <el-tag :type="getStatusType(selectedOpportunity.status)" size="small">
                      {{ getStatusName(selectedOpportunity.status) }}
                    </el-tag>
                  </span>
                </div>
                <div class="info-item full-width" v-if="selectedOpportunity.description">
                  <label>商机描述：</label>
                  <div class="description">{{ selectedOpportunity.description }}</div>
                </div>
              </div>
            </el-card>

            <!-- 活动记录内容 -->
            <el-card shadow="never" id="opportunity-section-activities" class="tab-content detail-section section-card">
              <template #header>
                <h3 class="section-title" style="margin: 0">活动记录</h3>
              </template>
              <ActivityList
                v-if="selectedOpportunity?.id"
                :related-to-type="'opportunity'"
                :related-to-id="selectedOpportunity.id"
                :auto-load="true"
                @refresh="() => {}"
              />
            </el-card>

            <!-- 拜访记录内容 -->
            <el-card shadow="never" id="opportunity-section-visits" class="tab-content detail-section section-card">
              <template #header>
                <h3 class="section-title" style="margin: 0">拜访记录</h3>
              </template>
              <div class="list-padding">
                <ContactVisitList
                  v-if="selectedOpportunity?.id"
                  related-to-type="opportunity"
                  :related-to-id="String(selectedOpportunity.id)"
                />
              </div>
            </el-card>

            <!-- 合同内容 -->
            <el-card shadow="never" id="opportunity-section-contracts" class="tab-content detail-section section-card">
              <template #header>
                <h3 class="section-title" style="margin: 0">销售合同</h3>
              </template>
              <div class="list-padding">
                <el-table :data="opportunityContracts" border style="width: 100%">
                  <el-table-column prop="contractNumber" label="合同编号" width="180" />
                  <el-table-column prop="type" label="类型" width="120">
                    <template #default="{ row }">
                      <el-tag size="small">{{ getContractTypeName(row.type) }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="status" label="状态" width="120">
                    <template #default="{ row }">
                      <el-tag size="small" :type="getContractStatusType(row.status)">
                        {{ getContractStatusName(row.status) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="totalAmount" label="合同金额" width="120" align="right">
                    <template #default="{ row }">{{ formatCurrency(row.totalAmount) }}</template>
                  </el-table-column>
                  <el-table-column prop="signDate" label="签约日期" width="120">
                    <template #default="{ row }">
                      {{ row.signDate ? formatDateOnly(row.signDate) : '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="effectiveDate" label="生效日期" width="120">
                    <template #default="{ row }">
                      {{ row.effectiveDate ? formatDateOnly(row.effectiveDate) : '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="expiryDate" label="到期日期" width="120">
                    <template #default="{ row }">
                      {{ row.expiryDate ? formatDateOnly(row.expiryDate) : '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="负责人" width="120">
                    <template #default="{ row }">{{ getUserName(row.owner) }}</template>
                  </el-table-column>
                </el-table>
                <div v-if="opportunityContracts.length === 0" class="empty-state">
                  <el-empty description="暂无合同记录" />
                </div>
              </div>
            </el-card>

            <!-- 订单内容 -->
            <el-card shadow="never" id="opportunity-section-orders" class="tab-content detail-section section-card">
              <template #header>
                <h3 class="section-title" style="margin: 0">销售订单</h3>
              </template>
              <div class="list-padding">
                <el-table :data="opportunityOrders" border style="width: 100%">
                  <el-table-column prop="orderNumber" label="订单编号" width="180" />
                  <el-table-column prop="status" label="状态" width="120">
                    <template #default="{ row }">
                      <el-tag size="small" :type="getOrderStatusType(row.status)">
                        {{ getOrderStatusName(row.status) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="totalAmount" label="订单金额" width="120" align="right">
                    <template #default="{ row }">{{ formatCurrency(row.totalAmount) }}</template>
                  </el-table-column>
                  <el-table-column prop="orderDate" label="订单日期" width="120">
                    <template #default="{ row }">
                      {{ formatDateOnly(row.orderDate) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="deliveryDate" label="交付日期" width="120">
                    <template #default="{ row }">
                      {{ row.deliveryDate ? formatDateOnly(row.deliveryDate) : '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="负责人" width="120">
                    <template #default="{ row }">{{ getUserName(row.owner) }}</template>
                  </el-table-column>
                </el-table>
                <div v-if="opportunityOrders.length === 0" class="empty-state">
                  <el-empty description="暂无订单记录" />
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Edit, Delete, View, List, Grid, Clock, Location, Files, ShoppingCart, User, Fold, Expand } from '@element-plus/icons-vue'
import Sortable from 'sortablejs'
import opportunityApi, {
  type Opportunity,
  type CreateOpportunityDto,
  type UpdateOpportunityDto,
} from '@/api/opportunity'
import OpportunityForm from '@/components/opportunity/OpportunityForm.vue'
import ActivityList from '@/components/activity/ActivityList.vue'
import ContactVisitList from '@/components/visit/ContactVisitList.vue'
import contractApi, { type Contract } from '@/api/contract'
import orderApi, { type Order } from '@/api/order'

const router = useRouter()

// 视图模式
const viewMode = ref<'list' | 'kanban'>('list')

// 搜索表单
const searchForm = reactive({
  search: '',
  stage: undefined as string | undefined,
  status: undefined as string | undefined,
})

// 商机列表
const opportunities = ref<Opportunity[]>([])
const loading = ref(false)
const selectedRows = ref<Opportunity[]>([])

// 看板相关
const columnRefs = ref<Record<string, HTMLElement | null>>({})
const sortableInstances = ref<Sortable[]>([])

// 商机阶段列配置
const stageColumns = [
  { label: '初步接触', value: 'initial_contact' },
  { label: '需求分析', value: 'needs_analysis' },
  { label: '方案/报价', value: 'proposal_quote' },
  { label: '谈判审核', value: 'negotiation_review' },
  { label: '赢单', value: 'closed_won' },
  { label: '输单', value: 'closed_lost' },
]

// 设置列引用
const setColumnRef = (el: HTMLElement | Element | null, stage: string) => {
  if (el && el instanceof HTMLElement) {
    columnRefs.value[stage] = el
  } else {
    // 元素被卸载时清除引用
    delete columnRefs.value[stage]
  }
}

// 按阶段获取商机
const getOpportunitiesByStage = (stage: string) => {
  return opportunities.value.filter((opp) => opp.stage === stage)
}


// 分页
const pagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0,
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const opportunityFormRef = ref<InstanceType<typeof OpportunityForm>>()
const currentOpportunity = ref<Opportunity | null>(null)

// 详情抽屉相关
const drawerVisible = ref(false)
const selectedOpportunity = ref<Opportunity | null>(null)
const activeTab = ref<'basic' | 'activities' | 'visits' | 'contracts' | 'orders'>('basic')
const opportunityContracts = ref<Contract[]>([])
const opportunityOrders = ref<Order[]>([])
const loadingDetails = ref(false)
const menuCollapsed = ref(false)
const detailContentRef = ref<HTMLElement | null>(null)

// 获取阶段类型
const getStageType = (stage: string) => {
  const typeMap: Record<string, string> = {
    initial_contact: 'info',
    needs_analysis: 'warning',
    proposal_quote: 'primary',
    negotiation_review: 'warning',
    closed_won: 'success',
    closed_lost: 'danger',
  }
  return typeMap[stage] || 'default'
}

// 获取阶段名称
const getStageName = (stage: string) => {
  const nameMap: Record<string, string> = {
    initial_contact: '初步接触',
    needs_analysis: '需求分析',
    proposal_quote: '方案/报价',
    negotiation_review: '谈判审核',
    closed_won: '赢单',
    closed_lost: '输单',
  }
  return nameMap[stage] || stage
}

// 获取状态类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    active: 'success',
    waiting_client: 'warning',
    on_hold: 'info',
    at_risk: 'danger',
    closed: 'default',
  }
  return typeMap[status] || 'default'
}

// 获取状态名称
const getStatusName = (status: string) => {
  const nameMap: Record<string, string> = {
    active: '积极跟进',
    waiting_client: '等待客户',
    on_hold: '已搁置',
    at_risk: '面临风险',
    closed: '已结束',
  }
  return nameMap[status] || status
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 格式化日期（仅日期部分，格式：YYYY-MM-DD）
const formatDateOnly = (dateString: string | null | undefined) => {
  if (!dateString) return '-'
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime()) || d.getFullYear() < 1900) {
      return '-'
    }
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  } catch (e) {
    return '-'
  }
}

// 格式化货币
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

// 获取用户名
const getUserName = (owner: any) => {
  if (!owner) return '-'
  if (typeof owner === 'string') return owner
  if (owner.username) return owner.username
  if (owner.nickname) return owner.nickname
  if (owner.user?.username) return owner.user.username
  return '-'
}

// 查看商机详情（抽屉）
const viewOpportunityDetail = (opportunity: Opportunity) => {
  selectedOpportunity.value = opportunity
  drawerVisible.value = true
  activeTab.value = 'basic'
  loadOpportunityDetails(opportunity.id)
  // 等待DOM更新后滚动到基本信息
  nextTick(() => {
    scrollToSection('basic')
  })
}

// 抽屉关闭处理
const handleDrawerClose = (done: () => void) => {
  selectedOpportunity.value = null
  opportunityContracts.value = []
  opportunityOrders.value = []
  activeTab.value = 'basic'
  done()
}

// 锚点导航点击处理
const handleNavClick = (tab: 'basic' | 'activities' | 'visits' | 'contracts' | 'orders') => {
  activeTab.value = tab
  scrollToSection(tab)
}

// 滚动到指定section
const scrollToSection = (tab: string) => {
  nextTick(() => {
    const sectionId = `opportunity-section-${tab}`
    const section = document.getElementById(sectionId)
    if (section && detailContentRef.value) {
      const container = detailContentRef.value
      const sectionTop = section.offsetTop - container.offsetTop - 20 // 20px offset
      container.scrollTo({
        top: sectionTop,
        behavior: 'smooth',
      })
    }
  })
}

// 处理详情页滚动，更新activeTab
const handleDetailScroll = () => {
  if (!detailContentRef.value) return

  const container = detailContentRef.value
  const scrollTop = container.scrollTop + 100 // 100px offset for header

  const sections = [
    { id: 'opportunity-section-basic', tab: 'basic' },
    { id: 'opportunity-section-activities', tab: 'activities' },
    { id: 'opportunity-section-visits', tab: 'visits' },
    { id: 'opportunity-section-contracts', tab: 'contracts' },
    { id: 'opportunity-section-orders', tab: 'orders' },
  ]

  for (let i = sections.length - 1; i >= 0; i--) {
    const section = document.getElementById(sections[i].id)
    if (section) {
      const sectionTop = section.offsetTop - container.offsetTop
      if (scrollTop >= sectionTop) {
        activeTab.value = sections[i].tab as any
        break
      }
    }
  }
}

// 加载商机详情
const loadOpportunityDetails = async (opportunityId: string) => {
  try {
    loadingDetails.value = true
    // 并行加载销售合同、销售订单
    const [contractsResponse, ordersResponse] = await Promise.all([
      contractApi.getList({ opportunityId: Number(opportunityId), page: 1, limit: 1000 }),
      orderApi.getList({ opportunityId: Number(opportunityId), page: 1, limit: 1000 }),
    ])

    if ((contractsResponse as any).data?.code === 200) {
      opportunityContracts.value = (contractsResponse as any).data.data?.contracts || []
    } else if ((contractsResponse as any).data?.contracts) {
      opportunityContracts.value = (contractsResponse as any).data.contracts || []
    }

    if ((ordersResponse as any).data?.code === 200) {
      opportunityOrders.value = (ordersResponse as any).data.data?.orders || []
    } else if ((ordersResponse as any).data?.orders) {
      opportunityOrders.value = (ordersResponse as any).data.orders || []
    }
  } catch (error) {
    console.error('加载商机详情失败:', error)
    ElMessage.error('加载商机详情失败')
  } finally {
    loadingDetails.value = false
  }
}

// 合同相关方法
const getContractTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    sales: '销售合同',
    service: '服务合同',
    maintenance: '维护合同',
    other: '其他',
  }
  return typeMap[type] || type
}

const getContractStatusName = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    pending_sign: '待签约',
    signed: '已签约',
    active: '生效中',
    expired: '已过期',
    terminated: '已终止',
  }
  return statusMap[status] || status
}

const getContractStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    draft: 'info',
    pending_sign: 'warning',
    signed: 'success',
    active: 'success',
    expired: 'danger',
    terminated: 'danger',
  }
  return typeMap[status] || 'info'
}

// 订单相关方法
const getOrderStatusName = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    processing: '处理中',
    shipped: '已发货',
    delivered: '已交付',
    completed: '已完成',
    cancelled: '已取消',
  }
  return statusMap[status] || status
}

const getOrderStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    pending: 'info',
    confirmed: 'warning',
    processing: 'warning',
    shipped: 'success',
    delivered: 'success',
    completed: 'success',
    cancelled: 'danger',
  }
  return typeMap[status] || 'info'
}

// 计算合计行
const getSummaries = (param: { columns: Array<{ property?: string; label?: string }>; data: Opportunity[] }) => {
  const { columns, data } = param
  const sums: string[] = []

  columns.forEach((column, index: number) => {
    // 第一列（选择框列）或没有 property 的列（如操作列）显示"合计"
    if (index === 0 || !column.property) {
      sums[index] = index === 0 ? '合计' : ''
      return
    }

    if (column.property === 'value') {
      // 商机价值列计算总和
      const values = data.map((item: Opportunity) => Number(item.value) || 0)
      const sum = values.reduce((prev: number, curr: number) => {
        return prev + curr
      }, 0)
      sums[index] = formatCurrency(sum)
    } else {
      // 其他列显示空
      sums[index] = ''
    }
  })

  return sums
}

// 加载商机列表
const loadOpportunities = async () => {
  try {
    loading.value = true
    // 构建查询参数，只包含有效值
    const params: any = {
      // 看板视图加载所有数据，列表视图使用分页
      page: viewMode.value === 'kanban' ? 1 : pagination.page,
      limit: viewMode.value === 'kanban' ? 10000 : pagination.pageSize,
    }

    // 只添加有效的搜索参数
    if (searchForm.search && searchForm.search.trim()) {
      params.search = searchForm.search.trim()
    }
    if (searchForm.stage) {
      params.stage = searchForm.stage
    }
    if (searchForm.status) {
      params.status = searchForm.status
    }

    const response = await opportunityApi.getList(params)

    if (response.code === 200) {
      opportunities.value = response.data.opportunities
      pagination.total = response.data.total

      // 如果是看板视图，重新初始化拖拽
      if (viewMode.value === 'kanban') {
        nextTick(() => {
          initKanbanSortable()
        })
      }
    }
  } catch (error) {
    console.error('加载商机列表失败:', error)
    ElMessage.error('加载商机列表失败')
  } finally {
    loading.value = false
  }
}


// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadOpportunities()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    search: '',
    stage: undefined,
    status: undefined,
  })
  pagination.page = 1
  loadOpportunities()
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadOpportunities()
}

// 当前页改变
const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadOpportunities()
}

// 查看商机
const viewOpportunity = (opportunity: Opportunity) => {
  router.push(`/opportunities/${opportunity.id}`)
}

// 编辑商机
const editOpportunity = (opportunity: Opportunity) => {
  dialogTitle.value = '编辑商机'
  currentOpportunity.value = opportunity
  dialogVisible.value = true
}

// 删除商机
const deleteOpportunity = async (opportunity: Opportunity) => {
  try {
    await ElMessageBox.confirm(`确定要删除商机"${opportunity.title}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await opportunityApi.delete(opportunity.id)
    ElMessage.success('删除成功')
    loadOpportunities()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除商机失败:', error)
      ElMessage.error('删除商机失败')
    }
  }
}

// 跳转到创建页面 (现在改为打开模态框)
const goToCreate = () => {
  dialogTitle.value = '新建商机'
  currentOpportunity.value = null
  dialogVisible.value = true
}

// 处理表单提交
const handleFormSubmit = async (data: CreateOpportunityDto | UpdateOpportunityDto) => {
  try {
    submitLoading.value = true

    if (currentOpportunity.value) {
      // 编辑商机
      await opportunityApi.update(currentOpportunity.value.id, data as UpdateOpportunityDto)
      ElMessage.success('更新商机成功')
    } else {
      // 新建商机
      await opportunityApi.create(data as CreateOpportunityDto)
      ElMessage.success('创建商机成功')
    }

    dialogVisible.value = false
    currentOpportunity.value = null
    loadOpportunities()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    submitLoading.value = false
  }
}

// 对话框关闭处理
const handleDialogClose = () => {
  currentOpportunity.value = null
  if (opportunityFormRef.value) {
    opportunityFormRef.value.resetForm()
  }
}

// 提交表单（调用组件的 submit 方法）
const handleSubmit = async () => {
  if (!opportunityFormRef.value) return

  const success = await opportunityFormRef.value.submit()
  if (success) {
    // 如果表单验证通过，handleFormSubmit 会被调用
    // 这里不需要额外处理
  }
}

// 表格选择变化
const handleSelectionChange = (selection: Opportunity[]) => {
  selectedRows.value = selection
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) return

  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个商机吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const ids = selectedRows.value.map((row) => row.id)
    await opportunityApi.deleteBatch(ids)
    ElMessage.success('批量删除成功')
    loadOpportunities()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 初始化看板拖拽
const initKanbanSortable = () => {
  nextTick(() => {
    // 清理之前的实例
    sortableInstances.value.forEach((instance: any) => instance.destroy())
    sortableInstances.value = []

    // 为每个阶段列创建 Sortable 实例
    stageColumns.forEach((stage) => {
      const columnEl = columnRefs.value[stage.value]
      if (!columnEl) return

      const columnBody = columnEl.querySelector('.kanban-column-body') as HTMLElement
      if (!columnBody) return

      const sortable = Sortable.create(columnBody, {
        group: 'kanban',
        animation: 200,
        ghostClass: 'kanban-card-ghost',
        dragClass: 'kanban-card-drag',
        forceFallback: false,
        fallbackOnBody: true,
        swapThreshold: 0.65,
        onEnd: async (evt: any) => {
          const { from, to, item, oldIndex, newIndex } = evt

          // 确保 from 和 to 是有效的元素
          if (!from || !to || !item) {
            console.warn('拖拽事件缺少必要元素:', { from, to, item })
            return
          }

          // 获取阶段信息的辅助函数
          const getStageFromElement = (element: HTMLElement): string | null => {
            // 首先尝试从元素本身获取
            let stage = element.getAttribute('data-stage')
            if (stage) return stage

            // 如果元素有 class 'kanban-column-body'，尝试从父元素获取
            if (element.classList.contains('kanban-column-body')) {
              const parent = element.parentElement
              if (parent) {
                // 查找父元素中的阶段信息
                const stageColumn = parent.querySelector('[data-stage]')
                if (stageColumn) {
                  return stageColumn.getAttribute('data-stage')
                }
              }
            }

            // 尝试从最近的包含 data-stage 的父元素获取
            let current: HTMLElement | null = element
            while (current && current !== document.body) {
              stage = current.getAttribute('data-stage')
              if (stage) return stage
              current = current.parentElement
            }

            return null
          }

          // 获取阶段信息
          const fromStage = getStageFromElement(from as HTMLElement)
          const toStage = getStageFromElement(to as HTMLElement)
          const opportunityId = item.getAttribute('data-id')

          console.log('拖拽事件触发:', {
            fromStage,
            toStage,
            opportunityId,
            oldIndex,
            newIndex,
            fromElement: from,
            toElement: to,
            itemElement: item,
            fromClassName: from.className,
            toClassName: to.className
          })

          // 检查必要的数据
          if (!opportunityId) {
            console.warn('缺少商机ID，卡片元素:', item)
            return
          }

          if (!toStage) {
            console.warn('缺少目标阶段，目标元素:', to, '目标元素的属性:', {
              dataStage: to.getAttribute('data-stage'),
              className: to.className,
              parent: to.parentElement
            })
            return
          }

          if (!fromStage) {
            console.warn('缺少源阶段，源元素:', from)
            // 即使没有源阶段，如果目标阶段有效，也可以继续
          }

          if (fromStage === toStage) {
            console.log('拖拽到同一列，不需要处理')
            return
          }

          // 找到对应的商机（处理类型匹配问题：ID 可能是字符串或数字）
          const opportunity = opportunities.value.find((opp) => {
            // 转换为字符串进行比较，确保类型匹配
            return String(opp.id) === String(opportunityId) || opp.id === opportunityId
          })

          console.log('查找商机结果:', {
            opportunityId,
            opportunityIds: opportunities.value.map(opp => ({ id: opp.id, type: typeof opp.id })),
            found: !!opportunity,
            opportunity: opportunity
          })

          if (!opportunity) {
            console.warn('未找到对应的商机，opportunityId:', opportunityId, '所有商机ID:', opportunities.value.map(opp => opp.id))
            // 恢复原位置
            if (fromStage && oldIndex !== null) {
              const fromColumn = from
              const items = Array.from(fromColumn.children)
              if (items[oldIndex] && item.parentNode === to) {
                fromColumn.insertBefore(item, items[oldIndex])
              }
            }
            return
          }

          // 保存原始阶段，用于错误恢复
          const originalStage = opportunity.stage

          console.log('准备更新商机阶段:', {
            opportunityId,
            fromStage,
            toStage,
            opportunity: opportunity
          })

          try {
            // 更新商机阶段
            console.log('调用 API 更新阶段:', opportunityId, toStage)
            const response = await opportunityApi.updateStage(opportunityId, toStage)
            console.log('API 响应:', response)

            if (response && (response as any).code === 200) {
              ElMessage.success('商机阶段已更新')
              // 更新本地数据，避免重新加载整个列表
              const responseData = (response as any).data
              if (responseData) {
                opportunity.stage = toStage as any
                if (responseData.status) {
                  opportunity.status = responseData.status
                }
              }
              console.log('更新成功，新阶段:', toStage)
              // 重新加载列表以确保数据同步
              await loadOpportunities()
            } else {
              console.error('API 返回错误:', response)
              throw new Error((response as any)?.message || '更新失败')
            }
          } catch (error: any) {
            console.error('更新商机阶段失败:', error)
            console.error('错误详情:', {
              message: error?.message,
              response: error?.response,
              data: error?.response?.data
            })

            // 恢复原位置
            if (fromStage && oldIndex !== null && fromStage !== toStage) {
              const fromColumn = from
              const items = Array.from(fromColumn.children)
              if (item.parentNode === to) {
                fromColumn.insertBefore(item, items[oldIndex] || null)
              }
            }

            // 恢复本地数据
            opportunity.stage = originalStage

            // 显示错误消息
            const errorMessage = error?.response?.data?.message || error?.message || '更新商机阶段失败'
            ElMessage.error(errorMessage)

            // 重新加载列表以确保数据同步
            loadOpportunities()
          }
        },
      })

      sortableInstances.value.push(sortable)
    })
  })
}

// 监听视图模式变化
watch(viewMode, (newMode) => {
  if (newMode === 'kanban') {
    // 延迟初始化，确保 DOM 已渲染
    nextTick(() => {
      initKanbanSortable()
    })
  } else {
    // 切换到列表视图时清理拖拽实例
    sortableInstances.value.forEach((instance) => instance.destroy())
    sortableInstances.value = []
  }
})

// 编辑商机
const openEditOpportunity = () => {
  if (!selectedOpportunity.value) return
  router.push({
    path: '/opportunities',
    query: { id: selectedOpportunity.value.id, action: 'edit' },
  })
}

// 监听抽屉显示状态，添加滚动监听
watch(drawerVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      if (detailContentRef.value) {
        detailContentRef.value.addEventListener('scroll', handleDetailScroll)
      }
    })
  } else {
    if (detailContentRef.value) {
      detailContentRef.value.removeEventListener('scroll', handleDetailScroll)
    }
  }
})

onMounted(() => {
  loadOpportunities()
  // 如果初始是看板视图，初始化拖拽
  if (viewMode.value === 'kanban') {
    nextTick(() => {
      initKanbanSortable()
    })
  }
})

onBeforeUnmount(() => {
  // 清理 Sortable 实例
  sortableInstances.value.forEach((instance: any) => instance.destroy())
  // 移除滚动监听
  if (detailContentRef.value) {
    detailContentRef.value.removeEventListener('scroll', handleDetailScroll)
  }
})
</script>

<style lang="scss" scoped>
@use '@/styles/common/table-layout.scss';
@use '@/styles/common/detail-drawer.scss';

.opportunity-management {
  @extend .table-page;

  // 关联客户列样式 - 超出部分显示省略号
  :deep(.el-table .cell) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

// 看板视图样式
.kanban-section {
  padding: 0 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.kanban-board {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  flex: 1;
  padding-bottom: 16px;

  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

.kanban-column {
  flex: 0 0 260px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.kanban-column-header {
  padding: 16px;
  background: #fff;
  border-radius: 8px 8px 0 0;
  border-bottom: 2px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 14px;

  .stage-name {
    color: #303133;
  }
}

.kanban-column-body {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  min-height: 200px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

.kanban-card {
  background: #fff;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: move;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.kanban-card-ghost {
  opacity: 0.5;
  background: #e4e7ed;
}

.kanban-card-drag {
  opacity: 0.8;
  transform: rotate(2deg);
}

.kanban-card-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;

  .card-title {
    font-weight: 600;
    font-size: 14px;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
  }
}

.kanban-card-body {
  .card-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    font-size: 13px;

    &:last-child {
      margin-bottom: 0;
    }

    .card-label {
      color: #909399;
      min-width: 60px;
    }

    .card-value {
      color: #606266;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.kanban-card-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: flex-end;

  .el-button-group {
    width: 100%;
    display: flex;

    .el-button {
      flex: 1;
    }
  }
}

// 商机详情页特定样式
.detail-layout {
  .right-content {
    height: 100%;

    .dynamic-content-section.detail-scroll-container {
      height: 100%;
      overflow-y: auto;
      padding-right: 8px;
      scroll-behavior: smooth;
    }

    .detail-section {
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-card {
        border: 1px solid #ebeef5;
        border-radius: 4px;

        :deep(.el-card__header) {
          padding: 16px 20px;
          border-bottom: 1px solid #ebeef5;
          background-color: #fafafa;
        }

        :deep(.el-card__body) {
          padding: 20px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
        }
      }
    }

    .basic-info-section {
      .detail-header {
        margin-bottom: 20px;

        .detail-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;

          h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: #262626;
          }
        }

        .detail-meta {
          display: flex;
          align-items: center;
          gap: 24px;
          color: #666;
          font-size: 14px;
          margin-bottom: 16px;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;

            .meta-label {
              color: #999;
            }

            .meta-value {
              color: #303133;
            }
          }
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;

        .info-item {
          display: flex;
          align-items: flex-start;

          &.full-width {
            grid-column: 1 / -1;
          }

          label {
            font-weight: 500;
            color: #606266;
            min-width: 100px;
            margin-right: 8px;
            flex-shrink: 0;
          }

          span {
            color: #303133;
            word-break: break-all;
          }

          .description {
            color: #606266;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
          }
        }
      }
    }

  }
}
</style>
