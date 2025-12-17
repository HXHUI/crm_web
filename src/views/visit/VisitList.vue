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
          <!-- 序号 -->
          <el-table-column type="index" label="序号" width="60" align="center" />

          <!-- 拜访对象 -->
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

          <!-- 拜访目的 -->
          <el-table-column prop="purpose" label="拜访目的" width="150" align="center">
            <template #default="{ row }">
              <span v-if="row.purpose">{{ getPurposeName(row.purpose) }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>

          <!-- 拜访类型 -->
          <el-table-column prop="type" label="拜访类型" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getTypeColor(row.type)" size="small">
                {{ getTypeName(row.type) }}
              </el-tag>
            </template>
          </el-table-column>

          <!-- 优先级 -->
          <el-table-column prop="priority" label="优先级" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getPriorityType(row.priority)" size="small">
                {{ getPriorityName(row.priority) }}
              </el-tag>
            </template>
          </el-table-column>

          <!-- 负责人 -->
          <el-table-column prop="owner" label="负责人" width="150">
            <template #default="{ row }">
              {{ row.owner?.user?.username || row.owner?.user?.realName || row.owner?.nickname || '-' }}
            </template>
          </el-table-column>

          <!-- 拜访准备（标签显示中文） -->
          <el-table-column label="拜访准备" min-width="200">
            <template #default="{ row }">
              <template v-if="row.preparation && row.preparation.length">
                <el-tag
                  v-for="item in row.preparation"
                  :key="item"
                  size="small"
                  class="mr-4"
                >
                  {{ getPreparationName(item) }}
                </el-tag>
              </template>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>

          <!-- 计划开始时间 -->
          <el-table-column prop="plannedStartTime" label="计划开始时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.plannedStartTime) }}
            </template>
          </el-table-column>

          <!-- 计划时长 -->
          <el-table-column label="计划时长" width="120" align="center">
            <template #default="{ row }">
              {{ getPlannedDuration(row) || '-' }}
            </template>
          </el-table-column>

          <!-- 实际开始时间 -->
          <el-table-column prop="actualStartTime" label="实际开始时间" width="180">
            <template #default="{ row }">
              {{ row.actualStartTime ? formatDate(row.actualStartTime) : '-' }}
            </template>
          </el-table-column>

          <!-- 实际时长 -->
          <el-table-column label="实际时长" width="120" align="center">
            <template #default="{ row }">
              {{ getActualDuration(row) || '-' }}
            </template>
          </el-table-column>

          <!-- 所在地区 -->
          <el-table-column label="所在地区" width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.region && row.region.length > 0">
                {{ row.region.join(' / ') }}
              </span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>

          <!-- 详细地址 -->
          <el-table-column prop="detailAddress" label="详细地址" width="200" show-overflow-tooltip />

          <!-- 描述 -->
          <el-table-column prop="description" label="描述" width="200" show-overflow-tooltip />

          <!-- 签到备注 -->
          <el-table-column prop="checkInRemark" label="签到备注" width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.checkInRemark">{{ row.checkInRemark }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>

          <!-- 拜访结果 -->
          <el-table-column prop="result" label="拜访结果" width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.result">{{ row.result }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>

          <!-- 客户反馈 -->
          <el-table-column prop="feedback" label="客户反馈" width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.feedback">{{ row.feedback }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>

          <!-- 下一步行动 -->
          <el-table-column prop="nextAction" label="下一步行动" width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.nextAction">{{ row.nextAction }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>

          <!-- 部门 -->
          <el-table-column label="部门" width="120">
            <template #default="{ row }">
              <span v-if="row.department?.name">{{ row.department.name }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>

          <!-- 创建时间 -->
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>

          <!-- 创建者 -->
          <el-table-column label="创建者" width="150">
            <template #default="{ row }">
              {{ row.creator?.user?.username || row.creator?.user?.realName || row.creator?.nickname || '-' }}
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
import dictionaryApi from '@/api/dictionary'
import VisitForm from '@/components/visit/VisitForm.vue'
import VisitCheckIn from './components/VisitCheckIn.vue'
import VisitComplete from './components/VisitComplete.vue'

const loading = ref(false)
const visits = ref<Visit[]>([])
const selectedRows = ref<Visit[]>([])
// 字典映射
const preparationMap = ref<Record<string, string>>({})
const purposeMap = ref<Record<string, string>>({})
const typeMap = ref<Record<string, string>>({})

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

// 加载字典
const loadDictionaries = async () => {
  try {
    // 加载拜访准备字典
    const prepRes = await dictionaryApi.getItems('visit_preparation')
    const prepMap: Record<string, string> = {}
    ;(prepRes.data || []).forEach((item) => {
      prepMap[item.value] = item.label
    })
    preparationMap.value = prepMap

    // 加载拜访目的字典
    const purposeRes = await dictionaryApi.getItems('visit_purpose')
    const purposeMapData: Record<string, string> = {}
    ;(purposeRes.data || []).forEach((item) => {
      purposeMapData[item.value] = item.label
    })
    purposeMap.value = purposeMapData

    // 加载拜访类型字典
    const typeRes = await dictionaryApi.getItems('visit_type')
    const typeMapData: Record<string, string> = {}
    ;(typeRes.data || []).forEach((item) => {
      typeMapData[item.value] = item.label
    })
    typeMap.value = typeMapData
  } catch (error) {
    console.error('加载字典失败', error)
  }
}

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

// 计算计划时长
const getPlannedDuration = (row: Visit) => {
  const start = row.plannedStartTime
  const end = row.plannedEndTime
  if (!start || !end) return null
  return getDurationText(start, end)
}

// 计算实际时长
const getActualDuration = (row: Visit) => {
  const start = row.actualStartTime || row.plannedStartTime
  const end = row.actualEndTime
  if (!start || !end) return null
  return getDurationText(start, end)
}

const getDurationText = (start: string, end: string) => {
  try {
    const s = new Date(start)
    const e = new Date(end)
    const diffMinutes = Math.round((e.getTime() - s.getTime()) / (1000 * 60))
    if (diffMinutes <= 0) return null
    if (diffMinutes < 60) return `${diffMinutes}分钟`
    if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60)
      const minutes = diffMinutes % 60
      return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`
    }
    const days = Math.floor(diffMinutes / 1440)
    const hours = Math.floor((diffMinutes % 1440) / 60)
    return hours > 0 ? `${days}天${hours}小时` : `${days}天`
  } catch {
    return null
  }
}

// 拜访准备字典中文名
const getPreparationName = (value: string) => {
  if (!value) return ''
  return preparationMap.value[value] || value
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
  return typeMap.value[type] || type
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

// 优先级名称和颜色
const getPriorityName = (priority?: string) => {
  const map: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  }
  return map[priority || ''] || '中'
}

const getPriorityType = (priority?: string) => {
  const map: Record<string, string> = {
    low: 'info',
    medium: '',
    high: 'warning',
    urgent: 'danger',
  }
  return map[priority || ''] || ''
}

// 拜访目的名称
const getPurposeName = (purpose: string) => {
  return purposeMap.value[purpose] || purpose
}

onMounted(() => {
  loadDictionaries()
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

