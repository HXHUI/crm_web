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

      <!-- 数据表格 -->
      <div class="table-section">
        <el-table
          :data="opportunities"
          v-loading="loading"
          @selection-change="handleSelectionChange"
          style="width: 100%"
          border
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="title" label="商机标题" min-width="200" />
          <el-table-column prop="customer.name" label="关联客户" width="150" />
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
          <el-table-column prop="expectedCloseDate" label="预计成交日期" width="150">
            <template #default="{ row }">
              {{ formatDate(row.expectedCloseDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="owner.username" label="负责人" width="120" />
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
    </div>

    <!-- 商机表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="商机标题" prop="title">
          <el-input
            v-model="formData.title"
            placeholder="请输入商机标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="关联客户" prop="customerId">
          <el-select v-model="formData.customerId" placeholder="请选择关联客户" style="width: 100%">
            <el-option
              v-for="customer in availableCustomers"
              :key="customer.id"
              :label="customer.name"
              :value="customer.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="商机价值" prop="value">
          <el-input-number
            v-model="formData.value"
            placeholder="请输入商机价值"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="商机阶段" prop="stage">
          <el-select v-model="formData.stage" placeholder="请选择商机阶段" style="width: 100%">
            <el-option label="初步接触" value="initial_contact" />
            <el-option label="需求分析" value="needs_analysis" />
            <el-option label="方案/报价" value="proposal_quote" />
            <el-option label="谈判审核" value="negotiation_review" />
            <el-option label="赢单" value="closed_won" />
            <el-option label="输单" value="closed_lost" />
          </el-select>
        </el-form-item>
        <el-form-item label="商机状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择商机状态" style="width: 100%">
            <el-option label="积极跟进" value="active" />
            <el-option label="等待客户" value="waiting_client" />
            <el-option label="已搁置" value="on_hold" />
            <el-option label="面临风险" value="at_risk" />
            <el-option label="已结束" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="成交概率" prop="probability">
          <el-input-number
            v-model="formData.probability"
            placeholder="请输入成交概率"
            :min="0"
            :max="100"
            style="width: 100%"
          />
          <div class="text-sm text-gray-500 mt-1">请输入0-100之间的数字</div>
        </el-form-item>
        <el-form-item label="预计成交日期" prop="expectedCloseDate">
          <el-date-picker
            v-model="formData.expectedCloseDate"
            type="date"
            placeholder="请选择预计成交日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="商机描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            placeholder="请输入商机描述"
            :rows="3"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit"> 确定 </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Edit, Delete, View } from '@element-plus/icons-vue'
import opportunityApi, {
  type Opportunity,
  type CreateOpportunityDto,
  type UpdateOpportunityDto,
  type QueryOpportunityDto,
} from '@/api/opportunity'
import customerApi from '@/api/customer'
import { useAuthStore } from '@/stores/modules/auth'

const router = useRouter()
const authStore = useAuthStore()

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

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const formRef = ref()

// 表单数据
const formData = reactive<CreateOpportunityDto & { id?: string }>({
  title: '',
  description: '',
  value: 0,
  currency: 'CNY',
  stage: 'initial_contact',
  status: 'active',
  probability: 0,
  expectedCloseDate: '',
  customerId: '',
})

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入商机标题', trigger: 'blur' },
    { min: 2, max: 100, message: '商机标题长度在 2 到 100 个字符', trigger: 'blur' },
  ],
  customerId: [{ required: true, message: '请选择关联客户', trigger: 'change' }],
  value: [
    { required: true, message: '请输入商机价值', trigger: 'blur' },
    { type: 'number', min: 0, message: '商机价值必须大于等于0', trigger: 'blur' },
  ],
  stage: [{ required: true, message: '请选择商机阶段', trigger: 'change' }],
  probability: [
    { required: true, message: '请输入成交概率', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '成交概率必须在0-100之间', trigger: 'blur' },
  ],
  expectedCloseDate: [{ required: true, message: '请选择预计成交日期', trigger: 'change' }],
}

// 可用客户列表
const availableCustomers = ref<Array<{ id: string; name: string }>>([])

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

// 格式化货币
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

// 加载商机列表
const loadOpportunities = async () => {
  try {
    loading.value = true
    const params = {
      ...searchForm,
      page: pagination.page,
      limit: pagination.pageSize,
    }
    const response = await opportunityApi.getList(params)

    if (response.code === 200) {
      opportunities.value = response.data.opportunities
      pagination.total = response.data.total
    }
  } catch (error) {
    console.error('加载商机列表失败:', error)
    ElMessage.error('加载商机列表失败')
  } finally {
    loading.value = false
  }
}

// 加载可用客户列表
const loadAvailableCustomers = async () => {
  try {
    const response = await customerApi.getList({ page: 1, limit: 1000 })
    if (response.code === 200) {
      availableCustomers.value = response.data.customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
      }))
    }
  } catch (error) {
    console.error('加载客户列表失败:', error)
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
  Object.assign(formData, {
    id: opportunity.id,
    title: opportunity.title,
    description: opportunity.description || '',
    value: Number(opportunity.value) || 0, // 确保转换为数字
    currency: opportunity.currency,
    stage: opportunity.stage,
    probability: Number(opportunity.probability) || 0, // 确保转换为数字
    expectedCloseDate: opportunity.expectedCloseDate.split('T')[0], // 只取日期部分
    customerId: opportunity.customerId,
  })
  // 清除表单验证状态
  if (formRef.value) {
    formRef.value.clearValidate()
  }
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
  Object.assign(formData, {
    id: undefined,
    title: '',
    description: '',
    value: 0,
    currency: 'CNY',
    stage: 'initial_contact',
    probability: 0,
    expectedCloseDate: '',
    customerId: '',
  })
  // 清除表单验证状态
  if (formRef.value) {
    formRef.value.clearValidate()
  }
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitLoading.value = true

    if (formData.id) {
      // 编辑商机
      const { id, ...updateData } = formData
      await opportunityApi.update(id, updateData as UpdateOpportunityDto)
      ElMessage.success('更新商机成功')
    } else {
      // 新建商机
      await opportunityApi.create(formData as CreateOpportunityDto)
      ElMessage.success('创建商机成功')
    }

    dialogVisible.value = false
    loadOpportunities()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    submitLoading.value = false
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

onMounted(() => {
  loadOpportunities()
  loadAvailableCustomers()
})
</script>

<style lang="scss" scoped>
@use '@/styles/common/table-layout.scss';

.opportunity-management {
  @extend .table-page;
}
</style>
