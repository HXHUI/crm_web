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
              <el-select v-model="searchForm.type" placeholder="活动类型" clearable style="width: 120px">
                <el-option label="全部" :value="undefined" />
                <el-option label="电话" value="call" />
                <el-option label="会议" value="meeting" />
                <el-option label="邮件" value="email" />
                <el-option label="任务" value="task" />
                <el-option label="备注" value="note" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select v-model="searchForm.status" placeholder="活动状态" clearable style="width: 120px">
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
          <el-button type="primary" :icon="Plus" @click="goToCreate">
            新增活动
          </el-button>
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
          <el-table-column prop="plannedStartTime" label="计划时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.plannedStartTime) }}
            </template>
          </el-table-column>
          <el-table-column label="关联主体" width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.relatedToType }} / {{ row.relatedToId }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small">{{ row.priority }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="owner.username" label="负责人" width="120" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.owner">{{ row.owner.username }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="viewActivity(row)">查看</el-button>
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
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="活动标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入活动标题" />
        </el-form-item>
        <el-form-item label="活动描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入活动描述"
          />
        </el-form-item>
        <el-form-item label="活动类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择活动类型" style="width: 100%">
            <el-option label="电话" value="call" />
            <el-option label="会议" value="meeting" />
            <el-option label="邮件" value="email" />
            <el-option label="任务" value="task" />
            <el-option label="备注" value="note" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划开始时间" prop="plannedStartTime">
          <el-date-picker
            v-model="formData.plannedStartTime"
            type="datetime"
            placeholder="选择计划开始时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="计划结束时间" prop="plannedEndTime">
          <el-date-picker
            v-model="formData.plannedEndTime"
            type="datetime"
            placeholder="选择计划结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="活动地点" prop="location">
          <el-input v-model="formData.location" placeholder="请输入活动地点" />
        </el-form-item>
        <el-form-item label="关联类型" prop="relatedToType">
          <el-select v-model="formData.relatedToType" placeholder="请选择关联类型" style="width: 100%">
            <el-option label="客户" value="customer" />
            <el-option label="联系人" value="contact" />
            <el-option label="商机" value="opportunity" />
            <el-option label="线索" value="lead" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联对象" prop="relatedToId">
          <el-select v-model="formData.relatedToId" placeholder="请选择关联对象" filterable clearable style="width: 100%">
            <el-option v-for="opt in relatedOptions" :key="opt.id" :label="opt.name || opt.title" :value="opt.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="formData.priority" placeholder="请选择优先级" style="width: 100%">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行笔记" prop="content">
          <el-input v-model="formData.content" type="textarea" :rows="3" placeholder="可记录执行细节/完成笔记" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          {{ formData.id ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Delete } from '@element-plus/icons-vue'
import { activityApi, type Activity, type CreateActivityDto, type UpdateActivityDto } from '@/api/activity'
import { customerApi } from '@/api/customer'
import { opportunityApi } from '@/api/opportunity'

const router = useRouter()

// 搜索表单
const searchForm = reactive({
  title: '',
  type: '',
  status: '',
  relatedToType: '',
  relatedToId: ''
})

// 活动列表
const activities = ref<Activity[]>([])
const loading = ref(false)
const selectedRows = ref<Activity[]>([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 模态框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const formRef = ref()

// 表单数据
const formData = reactive<CreateActivityDto & { id?: string }>({
  title: '',
  description: '',
  type: 'call',
  plannedStartTime: '',
  plannedEndTime: '',
  location: '',
  relatedToType: 'customer',
  relatedToId: '',
  priority: 'medium',
  content: ''
})

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入活动标题', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择活动类型', trigger: 'change' }
  ],
  plannedStartTime: [
    { required: true, message: '请选择计划开始时间', trigger: 'change' }
  ]
}

// 选项数据
const customerOptions = ref<Array<{ id: string; name: string }>>([])
const opportunityOptions = ref<Array<{ id: string; title: string }>>([])
const relatedOptions = ref<Array<any>>([])

// 根据选择的客户过滤商机选项
watch(() => formData.relatedToType, (t) => {
  if (t === 'customer') relatedOptions.value = customerOptions.value
  else if (t === 'opportunity') relatedOptions.value = opportunityOptions.value
  else relatedOptions.value = []
  formData.relatedToId = ''
})

// 监听关联类型变化，清空关联对象选择
watch(() => formData.relatedToType, (newType, oldType) => {
  if (newType !== oldType) {
    formData.relatedToId = ''
  }
})

// 获取类型颜色
const getTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    call: 'primary',
    meeting: 'success',
    email: 'info',
    task: 'warning',
    note: 'default'
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
    note: '备注'
  }
  return nameMap[type] || type
}

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    planned: 'warning',
    completed: 'success',
    cancelled: 'danger'
  }
  return colorMap[status] || 'default'
}

// 获取状态名称
const getStatusName = (status: string) => {
  const nameMap: Record<string, string> = {
    planned: '计划中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return nameMap[status] || status
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 加载活动列表
const loadActivities = async () => {
  try {
    loading.value = true
    const params = {
      title: searchForm.title || undefined,
      type: searchForm.type || undefined,
      status: searchForm.status || undefined,
      relatedToType: searchForm.relatedToType || undefined,
      relatedToId: searchForm.relatedToId || undefined,
      page: pagination.page,
      limit: pagination.pageSize
    }
    
    const response = await activityApi.getList(params)
    activities.value = response.data.activities
    pagination.total = response.data.total
  } catch (error) {
    ElMessage.error('加载活动列表失败')
  } finally {
    loading.value = false
  }
}

// 加载选项数据
const loadOptions = async () => {
  try {
    const customerResponse = await customerApi.getList({ page: 1, limit: 1000 })
    customerOptions.value = (customerResponse.data.customers || []).map((c: any) => ({ id: c.id, name: c.name }))
    const opportunityResponse = await opportunityApi.getList({ page: 1, limit: 1000 })
    opportunityOptions.value = ((opportunityResponse.data as any).opportunities || []).map((o: any) => ({ id: o.id, title: o.title }))
  } catch (error) {
    console.error('加载选项数据失败:', error)
  }
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
    relatedToId: ''
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
const viewActivity = (activity: Activity) => {
  // 可以打开详情模态框或跳转到详情页
  ElMessage.info('查看活动功能待实现')
}

// 编辑活动
const editActivity = (activity: Activity) => {
  dialogTitle.value = '编辑活动'
  Object.assign(formData, {
    id: activity.id,
    title: activity.title,
    description: activity.description || '',
    type: activity.type,
    plannedStartTime: activity.plannedStartTime,
    plannedEndTime: activity.plannedEndTime || '',
    location: activity.location || '',
    relatedToType: (activity as any).relatedToType || 'customer',
    relatedToId: (activity as any).relatedToId || '',
    priority: (activity as any).priority || 'medium',
    content: (activity as any).content || ''
  })
  dialogVisible.value = true
}

// 删除活动
const deleteActivity = async (activity: Activity) => {
  try {
    await ElMessageBox.confirm(`确定要删除活动"${activity.title}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await activityApi.delete(activity.id)
    ElMessage.success('删除成功')
    loadActivities()
  } catch (error) {
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
      type: 'warning'
    })
    
    const ids = selectedRows.value.map(row => row.id)
    await activityApi.deleteBatch(ids)
    ElMessage.success('批量删除成功')
    loadActivities()
  } catch (error) {
    // 用户取消操作
  }
}

// 打开创建模态框
const goToCreate = () => {
  dialogTitle.value = '新增活动'
  resetForm()
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    id: undefined,
    title: '',
    description: '',
    type: 'call',
    plannedStartTime: '',
    plannedEndTime: '',
    location: '',
    relatedToType: 'customer',
    relatedToId: '',
    priority: 'medium',
    content: ''
  })
  formRef.value?.clearValidate()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    const submitData = {
      ...formData,
      plannedStartTime: formData.plannedStartTime ? new Date(formData.plannedStartTime).toISOString() : '',
      plannedEndTime: formData.plannedEndTime ? new Date(formData.plannedEndTime).toISOString() : undefined
    }
    
    if (formData.id) {
      // 更新活动
      await activityApi.update(formData.id, submitData as UpdateActivityDto)
      ElMessage.success('更新活动成功')
    } else {
      // 创建活动
      await activityApi.create(submitData as CreateActivityDto)
      ElMessage.success('创建活动成功')
    }
    
    dialogVisible.value = false
    loadActivities()
  } catch (error) {
    // 表单验证失败或其他错误
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  loadActivities()
  loadOptions()
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
