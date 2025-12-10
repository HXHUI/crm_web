<template>
  <div class="activity-management">
    <!-- 主容器 -->
    <div class="main-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item>
              <el-input
                v-model="searchForm.title"
                placeholder="搜索活动标题"
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
                v-model="searchForm.type"
                placeholder="活动类型"
                clearable
                style="width: 120px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="电话" value="call" />
                <el-option label="会议" value="meeting" />
                <el-option label="邮件" value="email" />
                <el-option label="任务" value="task" />
                <el-option label="备注" value="note" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="searchForm.status"
                placeholder="活动状态"
                clearable
                style="width: 120px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="计划中" value="planned" />
                <el-option label="进行中" value="in_progress" />
                <el-option label="已完成" value="completed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" :icon="Plus" @click="goToCreate"> 新增活动 </el-button>
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

      <!-- 数据表格 -->
      <div class="table-section">
        <el-table
          :data="activities"
          v-loading="loading"
          @selection-change="handleSelectionChange"
          style="width: 100%"
          border
          :default-sort="{ prop: 'plannedStartTime', order: 'descending' }"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="title" label="活动标题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="type" label="类型" width="100" align="center">
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
          <el-table-column prop="plannedStartTime" label="计划开始时间" width="180" sortable="custom" @sort-change="handleSortChange">
            <template #default="{ row }">
              <span v-if="row.plannedStartTime">{{ formatDate(row.plannedStartTime) }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column label="计划时长" width="100" align="center">
            <template #default="{ row }">
              <span v-if="row.plannedStartTime && row.plannedEndTime">
                {{ calculateDuration(row.plannedStartTime, row.plannedEndTime) }}
              </span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="actualStartTime" label="实际开始时间" width="180" sortable="custom" @sort-change="handleSortChange">
            <template #default="{ row }">
              <span v-if="row.actualStartTime">{{ formatDate(row.actualStartTime) }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column label="实际时长" width="100" align="center">
            <template #default="{ row }">
              <span v-if="row.actualStartTime && row.actualEndTime">
                {{ calculateDuration(row.actualStartTime, row.actualEndTime) }}
              </span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column label="关联主体" width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <span>
                {{ getRelatedToName(row.relatedToType) }}:
                {{
                  row.customer?.name ||
                  row.contact?.name ||
                  row.opportunity?.title ||
                  row.lead?.name ||
                  row.relatedToId ||
                  '-'
                }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="location" label="活动地点" width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.location">{{ row.location }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="outcome" label="活动结果" width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.outcome">{{ row.outcome }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="participants" label="活动参与者" width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.participants && row.participants.length > 0">
                {{ formatParticipants(row.participants) }}
              </span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="getPriorityColor(row.priority)">{{
                getPriorityName(row.priority)
              }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="活动详细内容" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.content">{{ row.content }}</span>
              <span v-else-if="row.description">{{ row.description }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="owner.username" label="负责人" width="120" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.owner">{{ row.owner.username }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column label="部门" width="120">
            <template #default="{ row }">
              <span v-if="row.department?.name">{{ row.department.name }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="viewActivity()">查看</el-button>
              <el-button type="warning" size="small" @click="editActivity(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="deleteActivity(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

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

    <!-- 活动表单模态框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="650px"
      :close-on-click-modal="false"
    >
      <ActivityForm
        v-if="dialogVisible"
        ref="activityFormRef"
        :activity="currentActivity"
        @submit="handleActivitySubmit"
        @cancel="dialogVisible = false"
          />
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleFormSubmit">
          {{ currentActivity ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Delete } from '@element-plus/icons-vue'
import {
  activityApi,
  type Activity,
  type CreateActivityDto,
  type UpdateActivityDto,
} from '@/api/activity'
import ActivityForm from '@/components/activity/ActivityForm.vue'


// 搜索表单
const searchForm = reactive({
  title: '',
  type: '',
  status: '',
  relatedToType: '',
  relatedToId: '',
})

// 排序参数（初始为空，使用后端默认排序）
const sortParams = reactive({
  prop: '',
  order: '' as '' | 'ascending' | 'descending',
})

// 活动列表
const activities = ref<Activity[]>([])
const loading = ref(false)
const selectedRows = ref<Activity[]>([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0,
})

// 模态框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const activityFormRef = ref<InstanceType<typeof ActivityForm>>()
const currentActivity = ref<Activity | null>(null)

// 获取类型颜色
const getTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    call: 'primary',
    meeting: 'success',
    email: 'info',
    task: 'warning',
    note: 'default',
  }
  return colorMap[type] || 'default'
}

// 获取类型名称
const getTypeName = (type: string) => {
  const nameMap: Record<string, string> = {
    call: '电话',
    meeting: '会议',
    email: '邮件',
    task: '任务',
    note: '备注',
  }
  return nameMap[type] || type
}

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    planned: 'warning',
    in_progress: 'primary',
    completed: 'success',
    cancelled: 'danger',
  }
  return colorMap[status] || 'default'
}

// 获取状态名称
const getStatusName = (status: string) => {
  const nameMap: Record<string, string> = {
    planned: '计划中',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return nameMap[status] || status
}

// 获取关联主体类型名称
const getRelatedToName = (type: string) => {
  const nameMap: Record<string, string> = {
    customer: '客户',
    contact: '联系人',
    opportunity: '商机',
    lead: '线索',
  }
  return nameMap[type] || type
}

// 获取优先级名称
const getPriorityName = (priority: string) => {
  const nameMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  }
  return nameMap[priority] || priority
}

// 获取优先级颜色
const getPriorityColor = (priority: string) => {
  const colorMap: Record<string, string> = {
    low: 'info',
    medium: 'primary',
    high: 'warning',
    urgent: 'danger',
  }
  return colorMap[priority] || 'default'
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 计算时长（分钟）
const calculateDuration = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return '-'
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diffMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))

  if (diffMinutes < 60) {
    return `${diffMinutes}分钟`
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`
  } else {
    const days = Math.floor(diffMinutes / 1440)
    const hours = Math.floor((diffMinutes % 1440) / 60)
    return hours > 0 ? `${days}天${hours}小时` : `${days}天`
  }
}

// 格式化参与者
const formatParticipants = (participants: string[] | number[]): string => {
  if (!participants || participants.length === 0) return '-'
  // 如果参与者是ID数组，可能需要转换为名称，这里先简单显示数量
  if (participants.length <= 3) {
    return participants.join(', ')
  }
  return `${participants.slice(0, 3).join(', ')} 等${participants.length}人`
}

// 加载活动列表
const loadActivities = async () => {
  try {
    loading.value = true
    const params: {
      title?: string
      type?: string
      status?: string
      relatedToType?: string
      relatedToId?: string
      page: number
      limit: number
      sortBy?: string
      sortOrder?: 'ASC' | 'DESC'
    } = {
      title: searchForm.title || undefined,
      type: searchForm.type || undefined,
      status: searchForm.status || undefined,
      relatedToType: searchForm.relatedToType || undefined,
      relatedToId: searchForm.relatedToId || undefined,
      page: pagination.page,
      limit: pagination.pageSize,
    }

    // 添加排序参数
    if (sortParams.prop && sortParams.order) {
      params.sortBy = sortParams.prop
      params.sortOrder = sortParams.order === 'ascending' ? 'ASC' : 'DESC'
    } else {
      // 清除排序参数
      params.sortBy = undefined
      params.sortOrder = undefined
    }

    const response = await activityApi.getList(params)
    activities.value = response.data.activities
    pagination.total = response.data.total
  } catch {
    ElMessage.error('加载活动列表失败')
  } finally {
    loading.value = false
  }
}

// 处理排序变化
const handleSortChange = ({ prop, order }: { prop: string | null; order: string | null }) => {
  if (prop && order) {
    sortParams.prop = prop
    sortParams.order = order as 'ascending' | 'descending'
  } else {
    // 取消排序
    sortParams.prop = ''
    sortParams.order = ''
  }
  pagination.page = 1
  loadActivities()
}


// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadActivities()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    title: '',
    type: '',
    status: '',
    relatedToType: '',
    relatedToId: '',
  })
  handleSearch()
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadActivities()
}

// 当前页改变
const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadActivities()
}

// 表格选择变化
const handleSelectionChange = (selection: Activity[]) => {
  selectedRows.value = selection
}

// 查看活动
const viewActivity = () => {
  // 可以打开详情模态框或跳转到详情页
  ElMessage.info('查看活动功能待实现')
}

// 编辑活动
const editActivity = (activity: Activity) => {
  dialogTitle.value = '编辑活动'
  currentActivity.value = activity
  dialogVisible.value = true
}

// 删除活动
const deleteActivity = async (activity: Activity) => {
  try {
    await ElMessageBox.confirm(`确定要删除活动"${activity.title}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await activityApi.delete(activity.id)
    ElMessage.success('删除成功')
    loadActivities()
  } catch {
    // 用户取消操作
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的活动')
    return
  }

  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个活动吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const ids = selectedRows.value.map((row) => row.id)
    await activityApi.deleteBatch(ids)
    ElMessage.success('批量删除成功')
    loadActivities()
  } catch {
    // 用户取消操作
  }
}

// 处理表单提交
const handleFormSubmit = async () => {
  if (!activityFormRef.value) return
  await activityFormRef.value.submit()
  // submit 事件会在 handleActivitySubmit 中处理
}

// 处理活动提交
const handleActivitySubmit = async (data: CreateActivityDto | UpdateActivityDto | CreateActivityDto[]) => {
  try {
    submitLoading.value = true

    if (currentActivity.value) {
      // 更新活动（单条）
      await activityApi.update(currentActivity.value.id, data as UpdateActivityDto)
      ElMessage.success('更新活动成功')
    } else {
      // 创建活动（可能多条）
      if (Array.isArray(data)) {
        // 多负责人：创建多条活动
        const promises = data.map((activityData) => activityApi.create(activityData))
        await Promise.all(promises)
        ElMessage.success(`成功创建 ${data.length} 条活动`)
      } else {
        // 单负责人：创建一条活动
        await activityApi.create(data as CreateActivityDto)
      ElMessage.success('创建活动成功')
      }
    }

    dialogVisible.value = false
    currentActivity.value = null
    loadActivities()
  } catch (error) {
    console.error('保存活动失败:', error)
    ElMessage.error('保存失败')
  } finally {
    submitLoading.value = false
  }
}


// 打开创建模态框
const goToCreate = () => {
  dialogTitle.value = '新增活动'
  currentActivity.value = null
  dialogVisible.value = true
  // 等待组件渲染后重置表单
  nextTick(() => {
    activityFormRef.value?.resetForm()
  })
}


onMounted(() => {
  loadActivities()
})
</script>

<style lang="scss" scoped>
@use '@/styles/common/table-layout.scss';

.activity-management {
  @extend .table-page;
}

.text-gray-400 {
  color: #9ca3af;
}
</style>
