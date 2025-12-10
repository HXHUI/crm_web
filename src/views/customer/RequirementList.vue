<template>
  <div class="requirement-management">
    <!-- 主容器 -->
    <div class="main-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item>
              <el-input
                v-model="searchForm.search"
                placeholder="搜索需求内容"
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
                placeholder="需求类型"
                clearable
                style="width: 140px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="显性需求" value="explicit" />
                <el-option label="隐性需求" value="implicit" />
                <el-option label="无形需求" value="intangible" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="searchForm.status"
                placeholder="状态"
                clearable
                style="width: 120px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="待处理" value="pending" />
                <el-option label="处理中" value="processing" />
                <el-option label="已解决" value="resolved" />
                <el-option label="已关闭" value="closed" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="searchForm.priority"
                placeholder="优先级"
                clearable
                style="width: 120px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="低" :value="0" />
                <el-option label="中" :value="1" />
                <el-option label="高" :value="2" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" :icon="Plus" @click="handleCreate">新增需求</el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="table-section">
        <el-table
          :data="requirementList"
          v-loading="loading"
          style="width: 100%"
          border
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="customer.name" label="客户名称" width="150" />
          <el-table-column label="需求类型" width="150">
            <template #default="{ row }">
              <el-tag :type="getTypeTagType(row.type)">{{ getTypeLabel(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="需求内容" min-width="200" show-overflow-tooltip />
          <el-table-column prop="problemToSolve" label="要解决的问题" min-width="200" show-overflow-tooltip />
          <el-table-column label="优先级" width="100">
            <template #default="{ row }">
              <el-tag :type="getPriorityTagType(row.priority)" size="small">
                {{ getPriorityLabel(row.priority) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" size="small">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        label-position="right"
      >
        <el-form-item label="客户" prop="customerId" v-if="!searchForm.customerId">
          <el-select
            v-model="formData.customerId"
            placeholder="请选择客户"
            filterable
            style="width: 100%"
            @change="handleCustomerChange"
          >
            <el-option
              v-for="customer in customerOptions"
              :key="customer.id"
              :label="customer.name"
              :value="customer.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="需求类型" prop="type">
          <el-radio-group v-model="formData.type">
            <el-radio label="explicit">显性需求（客户提出的需求）</el-radio>
            <el-radio label="implicit">隐性需求（客户可能会有的需求）</el-radio>
            <el-radio label="intangible">无形需求（需要自己主动发现）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="需求内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="3"
            placeholder="请输入需求内容"
          />
        </el-form-item>
        <el-form-item label="要解决的问题" prop="problemToSolve">
          <el-input
            v-model="formData.problemToSolve"
            type="textarea"
            :rows="3"
            placeholder="请输入需求背后要解决的问题"
          />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="formData.priority">
            <el-radio :label="0">低</el-radio>
            <el-radio :label="1">中</el-radio>
            <el-radio :label="2">高</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="formData.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请输入或选择标签"
            style="width: 100%"
          >
            <el-option
              v-for="tag in commonTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="notes">
          <el-input
            v-model="formData.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import customerRequirementApi, {
  type CustomerRequirement,
  type CreateRequirementDto,
  type UpdateRequirementDto,
  RequirementType,
} from '@/api/customerRequirement'
import customerApi from '@/api/customer'
import { useRoute } from 'vue-router'

const route = useRoute()

// 数据
const loading = ref(false)
const submitting = ref(false)
const requirementList = ref<CustomerRequirement[]>([])
const selectedRequirements = ref<CustomerRequirement[]>([])
const customerOptions = ref<Array<{ id: number; name: string }>>([])

// 搜索表单
const searchForm = reactive({
  search: '',
  type: undefined as RequirementType | undefined,
  status: undefined as string | undefined,
  priority: undefined as number | undefined,
  customerId: undefined as number | undefined,
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 50,
  total: 0,
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('新增需求')
const formRef = ref()
const formData = reactive<CreateRequirementDto & { id?: number }>({
  customerId: undefined,
  type: RequirementType.EXPLICIT,
  content: '',
  problemToSolve: '',
  tags: [],
  priority: 0,
  status: 'pending',
  notes: '',
})

// 表单验证规则
const formRules = {
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  type: [{ required: true, message: '请选择需求类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入需求内容', trigger: 'blur' }],
}

// 常用标签
const commonTags = [
  '价格便宜',
  '质量稳定',
  '长账期',
  '技术支持',
  '售后服务',
  '新产品',
  '新技术',
  '行业需求',
  '业务需求',
  '资质使用',
  '法务需求',
  '管理需求',
  '利益需求',
]

// 初始化：如果从客户详情页跳转过来，设置客户ID
onMounted(() => {
  const customerId = route.query.customerId
  if (customerId) {
    searchForm.customerId = typeof customerId === 'string' ? parseInt(customerId) : customerId
  }
  loadCustomers()
  loadRequirements()
})

// 加载客户列表
const loadCustomers = async () => {
  try {
    const res = await customerApi.getList({ page: 1, limit: 1000 })
    customerOptions.value = res.data.customers.map((c) => ({
      id: typeof c.id === 'string' ? parseInt(c.id) : c.id,
      name: c.name,
    }))
  } catch (error: any) {
    ElMessage.error(error.message || '加载客户列表失败')
  }
}

// 加载需求列表
const loadRequirements = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.limit,
    }
    if (searchForm.search) params.search = searchForm.search
    if (searchForm.type) params.type = searchForm.type
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.priority !== undefined) params.priority = searchForm.priority
    if (searchForm.customerId) params.customerId = searchForm.customerId

    const res = await customerRequirementApi.getList(params)
    requirementList.value = res.data.requirements
    pagination.total = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '加载需求列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadRequirements()
}

// 重置
const handleReset = () => {
  searchForm.search = ''
  searchForm.type = undefined
  searchForm.status = undefined
  searchForm.priority = undefined
  handleSearch()
}

// 新增
const handleCreate = () => {
  dialogTitle.value = '新增需求'
  Object.assign(formData, {
    customerId: searchForm.customerId || undefined,
    type: RequirementType.EXPLICIT,
    content: '',
    problemToSolve: '',
    tags: [],
    priority: 0,
    status: 'pending',
    notes: '',
  })
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: CustomerRequirement) => {
  dialogTitle.value = '编辑需求'
  Object.assign(formData, {
    id: row.id,
    customerId: row.customerId,
    type: row.type,
    content: row.content,
    problemToSolve: row.problemToSolve || '',
    tags: row.tags || [],
    priority: row.priority,
    status: row.status,
    notes: row.notes || '',
  })
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row: CustomerRequirement) => {
  try {
    await ElMessageBox.confirm('确定要删除该需求吗？', '提示', {
      type: 'warning',
    })
    await customerRequirementApi.delete(row.id)
    ElMessage.success('删除成功')
    loadRequirements()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    submitting.value = true
    try {
      if (formData.id) {
        // 更新
        const { id, customerId, ...updateData } = formData
        await customerRequirementApi.update(id, updateData)
        ElMessage.success('更新成功')
      } else {
        // 创建
        await customerRequirementApi.create(formData as CreateRequirementDto)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      loadRequirements()
    } catch (error: any) {
      ElMessage.error(error.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// 对话框关闭
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 客户变化
const handleCustomerChange = () => {
  // 可以在这里加载客户相关信息
}

// 选择变化
const handleSelectionChange = (selection: CustomerRequirement[]) => {
  selectedRequirements.value = selection
}

// 分页变化
const handleSizeChange = () => {
  loadRequirements()
}

const handlePageChange = () => {
  loadRequirements()
}

// 工具函数
const getTypeLabel = (type: RequirementType) => {
  const map: Record<RequirementType, string> = {
    [RequirementType.EXPLICIT]: '显性需求',
    [RequirementType.IMPLICIT]: '隐性需求',
    [RequirementType.INTANGIBLE]: '无形需求',
  }
  return map[type] || type
}

const getTypeTagType = (type: RequirementType) => {
  const map: Record<RequirementType, string> = {
    [RequirementType.EXPLICIT]: 'success',
    [RequirementType.IMPLICIT]: 'warning',
    [RequirementType.INTANGIBLE]: 'info',
  }
  return map[type] || ''
}

const getPriorityLabel = (priority: number) => {
  const map: Record<number, string> = {
    0: '低',
    1: '中',
    2: '高',
  }
  return map[priority] || '低'
}

const getPriorityTagType = (priority: number) => {
  const map: Record<number, string> = {
    0: 'info',
    1: 'warning',
    2: 'danger',
  }
  return map[priority] || 'info'
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭',
  }
  return map[status] || status
}

const getStatusTagType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'info',
    processing: 'warning',
    resolved: 'success',
    closed: '',
  }
  return map[status] || ''
}

const formatDate = (date: string) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}
</script>

<style scoped lang="scss">
@import '@/styles/common/table-layout.scss';

.requirement-management {
  @extend .table-page;
}
</style>

