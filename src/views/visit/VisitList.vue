<template>
  <div class="visit-management">
    <!-- 主容器 -->
    <div class="main-container">
      <!-- 工具栏 -->
      <div class="toolbar">
      <div class="toolbar-left">
        <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item>
              <el-select
                v-model="searchForm.type"
                placeholder="拜访类型"
                clearable
                style="width: 140px"
                @change="handleSearch"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="首次拜访" value="first_visit" />
                <el-option label="跟进拜访" value="follow_up" />
                <el-option label="维护拜访" value="maintenance" />
                <el-option label="商务洽谈" value="business_negotiation" />
                <el-option label="技术支持" value="technical_support" />
                <el-option label="培训" value="training" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="searchForm.status"
                placeholder="拜访状态"
                clearable
                style="width: 120px"
                @change="handleSearch"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="计划中" value="planned" />
                <el-option label="进行中" value="in_progress" />
                <el-option label="已完成" value="completed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 240px"
                @change="handleDateRangeChange"
              />
            </el-form-item>
          </el-form>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" :icon="Plus" @click="goToCreate"> 新增拜访 </el-button>
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
      <div class="table-section">
        <el-table
          :data="visits"
          v-loading="loading"
          @selection-change="handleSelectionChange"
          style="width: 100%"
          border
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="purpose" label="拜访目的" width="150" align="center">
            <template #default="{ row }">
              <span v-if="row.purpose">{{ getPurposeName(row.purpose) }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getTypeColor(row.type)" size="small">
                {{ getTypeName(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusColor(row.status)" size="small">
                {{ getStatusName(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="plannedStartTime" label="计划时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.plannedStartTime) }}
            </template>
          </el-table-column>
          <el-table-column label="拜访对象" width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <div v-if="row.customer">
                <el-tag size="small" type="info">客户</el-tag>
                {{ row.customer.name }}
              </div>
              <div v-else-if="row.contact">
                <el-tag size="small" type="warning">联系人</el-tag>
                {{ row.contact.name }}
              </div>
              <div v-else-if="row.opportunity">
                <el-tag size="small" type="success">商机</el-tag>
                {{ row.opportunity.title || row.opportunity.name }}
              </div>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column label="所在地区" width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.region && row.region.length > 0">
                {{ row.region.join(' / ') }}
              </span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="detailAddress" label="详情地址" width="200" show-overflow-tooltip />
          <el-table-column prop="owner" label="负责人" width="150">
            <template #default="{ row }">
              {{ row.owner?.user?.username || row.owner?.user?.realName || row.owner?.nickname || '-' }}
            </template>
          </el-table-column>
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
          <el-table-column prop="checkInRemark" label="签到备注" width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.checkInRemark">{{ row.checkInRemark }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="result" label="拜访结果" width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.result">{{ row.result }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="feedback" label="客户反馈" width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.feedback">{{ row.feedback }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="nextAction" label="下一步行动" width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.nextAction">{{ row.nextAction }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right" align="center">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="editVisit(row)">编辑</el-button>
              <el-button
                v-if="row.status === 'planned'"
                size="small"
                type="success"
                link
                @click="handleCheckIn(row)"
              >
                签到
              </el-button>
              <el-button
                v-if="row.status === 'planned' || row.status === 'in_progress'"
                size="small"
                type="warning"
                link
                @click="handleComplete(row)"
              >
                完成
              </el-button>
              <el-button size="small" type="danger" link @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-section">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" @close="handleDialogClose">
      <VisitForm
        v-if="dialogVisible"
        :visit="currentVisit"
        @success="handleFormSuccess"
        @cancel="dialogVisible = false"
      />
    </el-dialog>

    <!-- 签到对话框 -->
    <el-dialog v-model="checkInDialogVisible" title="签到" width="500px">
      <VisitCheckIn
        v-if="checkInDialogVisible"
        :visit="checkInVisit"
        @success="handleCheckInSuccess"
        @cancel="checkInDialogVisible = false"
      />
    </el-dialog>

    <!-- 完成拜访对话框 -->
    <el-dialog v-model="completeDialogVisible" title="完成拜访" width="600px">
      <VisitComplete
        v-if="completeDialogVisible"
        :visit="completeVisit"
        @success="handleCompleteSuccess"
        @cancel="completeDialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import visitApi, { type Visit, type QueryVisitDto } from '@/api/visit'
import VisitForm from '@/components/visit/VisitForm.vue'
import VisitCheckIn from './components/VisitCheckIn.vue'
import VisitComplete from './components/VisitComplete.vue'

const loading = ref(false)
const visits = ref<Visit[]>([])
const selectedRows = ref<Visit[]>([])

const searchForm = reactive<QueryVisitDto>({
  type: undefined,
  status: undefined,
  startDate: undefined,
  endDate: undefined,
})

const dateRange = ref<[string, string] | null>(null)

const pagination = reactive({
  page: 1,
  limit: 50,
  total: 0,
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('新增拜访')
const currentVisit = ref<Visit | null>(null)

const checkInDialogVisible = ref(false)
const checkInVisit = ref<Visit | null>(null)

const completeDialogVisible = ref(false)
const completeVisit = ref<Visit | null>(null)

// 加载数据
const loadVisits = async () => {
  loading.value = true
  try {
    const params: QueryVisitDto = {
      ...searchForm,
      page: pagination.page,
      limit: pagination.limit,
    }
    const response = await visitApi.getList(params)
    visits.value = response.data.visits
    pagination.total = response.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '加载拜访列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadVisits()
}


// 日期范围变化
const handleDateRangeChange = (dates: [string, string] | null) => {
  if (dates) {
    searchForm.startDate = dates[0]
    searchForm.endDate = dates[1]
  } else {
    searchForm.startDate = undefined
    searchForm.endDate = undefined
  }
  handleSearch()
}

// 分页
const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  loadVisits()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  loadVisits()
}

// 选择
const handleSelectionChange = (selection: Visit[]) => {
  selectedRows.value = selection
}

// 新增
const goToCreate = () => {
  currentVisit.value = null
  dialogTitle.value = '新增拜访'
  dialogVisible.value = true
}

// 编辑
const editVisit = (visit: Visit) => {
  currentVisit.value = visit
  dialogTitle.value = '编辑拜访'
  dialogVisible.value = true
}

// 删除
const handleDelete = async (visit: Visit) => {
  try {
    await ElMessageBox.confirm('确定要删除这条拜访记录吗？', '提示', {
      type: 'warning',
    })
    await visitApi.delete(visit.id)
    ElMessage.success('删除成功')
    loadVisits()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的记录')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条记录吗？`, '提示', {
      type: 'warning',
    })
    await visitApi.batchDelete(selectedRows.value.map((v) => v.id))
    ElMessage.success('批量删除成功')
    selectedRows.value = []
    loadVisits()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批量删除失败')
    }
  }
}

// 签到
const handleCheckIn = (visit: Visit) => {
  checkInVisit.value = visit
  checkInDialogVisible.value = true
}

// 完成
const handleComplete = (visit: Visit) => {
  completeVisit.value = visit
  completeDialogVisible.value = true
}

// 表单成功
const handleFormSuccess = () => {
  dialogVisible.value = false
  loadVisits()
}

// 签到成功
const handleCheckInSuccess = () => {
  checkInDialogVisible.value = false
  loadVisits()
}

// 完成成功
const handleCompleteSuccess = () => {
  completeDialogVisible.value = false
  loadVisits()
}

// 对话框关闭
const handleDialogClose = () => {
  currentVisit.value = null
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 类型名称和颜色
const getTypeName = (type: string) => {
  const map: Record<string, string> = {
    first_visit: '首次拜访',
    follow_up: '跟进拜访',
    maintenance: '维护拜访',
    business_negotiation: '商务洽谈',
    technical_support: '技术支持',
    training: '培训',
    other: '其他',
  }
  return map[type] || type
}

const getTypeColor = (type: string) => {
  const map: Record<string, string> = {
    first_visit: 'success',
    follow_up: 'primary',
    maintenance: 'info',
    business_negotiation: 'warning',
    technical_support: '',
    training: 'success',
    other: 'info',
  }
  return map[type] || ''
}

// 状态名称和颜色
const getStatusName = (status: string) => {
  const map: Record<string, string> = {
    planned: '计划中',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status] || status
}

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    planned: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'danger',
  }
  return map[status] || ''
}

// 拜访目的名称
const getPurposeName = (purpose: string) => {
  const map: Record<string, string> = {
    understand_needs: '了解需求',
    monthly_performance: '月度履约',
    performance_increment: '业绩增量',
    product_promotion: '产品推广',
    holiday_visit: '节日走访',
    contract_signing: '合同签订',
    sign_statement: '签对账单',
    price_policy: '价格政策',
    after_sales_service: '售后服务',
    negotiate_cooperation: '协商合作细节',
    understand_business: '了解客户经营状况',
    sample_tracking: '样品跟踪测试',
  }
  return map[purpose] || purpose
}

onMounted(() => {
  loadVisits()
})
</script>

<style lang="scss" scoped>
@use '@/styles/common/table-layout.scss';

.visit-management {
  @extend .table-page;
}

.text-gray-400 {
  color: #9ca3af;
}

</style>

