<template>
  <div class="quote-management">
    <div class="main-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item>
              <el-input
                v-model="searchForm.search"
                placeholder="搜索报价单号/客户名称"
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
                v-model="searchForm.status"
                placeholder="报价状态"
                clearable
                style="width: 120px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="草稿" value="draft" />
                <el-option label="待审批" value="pending_approval" />
                <el-option label="已审批" value="approved" />
                <el-option label="已发送" value="sent" />
                <el-option label="已接受" value="accepted" />
                <el-option label="已拒绝" value="rejected" />
                <el-option label="已过期" value="expired" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch"> 搜索 </el-button>
              <el-button :icon="Refresh" @click="handleReset"> 重置 </el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" :icon="Plus" @click="goToCreate"> 新增报价 </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="table-section">
        <el-table
          :data="quotes"
          v-loading="loading"
          style="width: 100%"
          border
          show-summary
          :summary-method="getSummaries"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="quoteNumber" label="报价单号" width="150">
            <template #default="{ row }">
              <el-link type="primary" :underline="false" @click="viewQuote(row)" style="cursor: pointer">
                {{ row.quoteNumber }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column prop="customer.name" label="客户" width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="customer-name">{{ row.customer?.name || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="opportunity.name" label="商机" width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="opportunity-name">{{ row.opportunity?.name || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="totalAmount" label="总金额" width="120" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.totalAmount) }}
            </template>
          </el-table-column>
          <el-table-column prop="quoteDate" label="报价日期" width="120">
            <template #default="{ row }">
              {{ formatDate(row.quoteDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="expiryDate" label="有效期" width="120">
            <template #default="{ row }">
              {{ row.expiryDate ? formatDate(row.expiryDate) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusName(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="owner" label="负责人" width="120">
            <template #default="{ row }">
              {{ row.owner?.user?.username || row.owner?.username || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="部门" width="120">
            <template #default="{ row }">
              <span v-if="row.department?.name">{{ row.department.name }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column label="创建者" width="120">
            <template #default="{ row }">
              {{ row.creator?.user?.username || row.creator?.nickname || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="300" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
              <el-button
                v-if="row.status === 'draft'"
                type="warning"
                size="small"
                :icon="Edit"
                @click="editQuote(row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="row.status === 'draft' || row.status === 'rejected'"
                type="success"
                size="small"
                @click="viewQuote(row)"
              >
                {{ row.status === 'rejected' ? '重新提交审批' : '提交审批' }}
              </el-button>
              <el-button type="info" size="small" :icon="Printer" @click="printQuote(row)">
                打印
              </el-button>
              <el-button type="info" size="small" @click="createContractFromQuote(row)">
                创建合同
              </el-button>
              <el-button type="danger" size="small" :icon="Delete" @click="deleteQuote(row)">
                删除
              </el-button>
              </div>
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

    <!-- 报价表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="1000px"
      :close-on-click-modal="false"
    >
      <QuoteForm
        ref="quoteFormRef"
        :quote="currentQuote"
        @submit="(data) => handleQuoteSubmitWithStatus(data)"
        @cancel="dialogVisible = false"
      />
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          v-if="hasWorkflowTemplate"
          :loading="submitLoading"
          @click="handleSaveDraft"
        >
          保存草稿
        </el-button>
        <el-button
          v-if="hasWorkflowTemplate"
          type="primary"
          :loading="submitLoading"
          @click="handleSubmitApproval"
        >
          提交审批
        </el-button>
        <el-button
          v-if="!hasWorkflowTemplate"
          type="primary"
          :loading="submitLoading"
          @click="handleSubmit"
        >
          提交
        </el-button>
      </template>
    </el-dialog>

    <!-- 打印对话框 -->
    <el-dialog
      v-model="printDialogVisible"
      title="打印报价单"
      width="90%"
      :close-on-click-modal="false"
      class="print-dialog"
    >
      <QuotePrint
        v-if="printQuoteData"
        ref="quotePrintRef"
        :quote="printQuoteData"
      />
      <template #footer>
        <el-button @click="printDialogVisible = false">关闭</el-button>
        <el-button type="primary" :icon="Printer" @click="handlePrint">打印</el-button>
      </template>
    </el-dialog>

    <!-- 报价详情对话框 -->
    <QuoteDetailDialog
      v-model="quoteDetailDialogVisible"
      :quote-id="currentQuoteId"
      @edit="handleQuoteEdit"
      @updated="handleQuoteUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Edit, Delete, Printer } from '@element-plus/icons-vue'
import quoteApi, {
  type Quote,
  type CreateQuoteDto,
  type UpdateQuoteDto,
  type QueryQuoteDto,
} from '@/api/quote'
import contractApi from '@/api/contract'
import QuoteForm from '@/components/quote/QuoteForm.vue'
import QuotePrint from '@/components/quote/QuotePrint.vue'
import QuoteDetailDialog from '@/components/quote/QuoteDetailDialog.vue'
import { getWorkflowTemplates, submitQuoteApproval, type WorkflowTemplate } from '@/api/workflow'

const router = useRouter()

// 搜索表单
const searchForm = reactive<{
  search: string
  status?: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'accepted' | 'rejected' | 'expired'
}>({
  search: '',
  status: undefined,
})

// 报价列表
const quotes = ref<Quote[]>([])
const loading = ref(false)

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
const quoteFormRef = ref<InstanceType<typeof QuoteForm>>()
const hasWorkflowTemplate = ref(false)
const currentQuote = ref<Quote | null>(null)
const submitStatus = ref<'draft' | 'pending_approval' | 'approved'>('draft')
const workflowTemplates = ref<WorkflowTemplate[]>([])

// 打印对话框相关
const printDialogVisible = ref(false)
const printQuoteData = ref<Quote | null>(null)
const quotePrintRef = ref<InstanceType<typeof QuotePrint>>()

// 报价详情对话框相关
const quoteDetailDialogVisible = ref(false)
const currentQuoteId = ref<string | number>()

// 获取状态类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    draft: 'info',
    pending_approval: 'warning',
    approved: 'success',
    active: 'success',
    rejected: 'danger',
    sent: 'warning',
    accepted: 'success',
    expired: 'default',
  }
  return typeMap[status] || 'default'
}

// 获取状态名称
const getStatusName = (status: string) => {
  const nameMap: Record<string, string> = {
    draft: '草稿',
    pending_approval: '审批中',
    approved: '已审批通过',
    active: '已生效',
    rejected: '已拒绝',
    sent: '已发送',
    accepted: '已接受',
    expired: '已过期',
  }
  return nameMap[status] || status
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 格式化日期时间（包含时分秒）
const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// 合计行方法
const getSummaries = (param: { columns: any[]; data: Quote[] }) => {
  const { columns, data } = param
  const sums: string[] = []
  
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    
    if (column.property === 'totalAmount') {
      const total = data.reduce((sum, item) => {
        const amount = Number(item.totalAmount) || 0
        return sum + amount
      }, 0)
      sums[index] = formatCurrency(total)
    } else {
      sums[index] = ''
    }
  })
  
  return sums
}

// 格式化货币
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// 加载报价列表
const loadQuotes = async () => {
  try {
    loading.value = true
    const params: QueryQuoteDto = {
      ...searchForm,
      page: pagination.page,
      limit: pagination.pageSize,
    }
    const response = await quoteApi.getList(params)

    if (response.code === 200) {
      quotes.value = response.data.quotes
      pagination.total = response.data.total
    }
  } catch (error) {
    console.error('加载报价列表失败:', error)
    ElMessage.error('加载报价列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadQuotes()
}

// 重置
const handleReset = () => {
  searchForm.search = ''
  searchForm.status = undefined
  handleSearch()
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadQuotes()
}

// 当前页变化
const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadQuotes()
}

// 检查是否有审批流模板
const checkWorkflowTemplate = async () => {
  try {
    const response = await getWorkflowTemplates('quote') as unknown as {
      code: number
      data?: WorkflowTemplate[]
    }
    if (response.code === 200) {
      const activeTemplates = (response.data || []).filter((t: WorkflowTemplate) => t.isActive)
      workflowTemplates.value = activeTemplates
      hasWorkflowTemplate.value = activeTemplates.length > 0
    } else {
      workflowTemplates.value = []
      hasWorkflowTemplate.value = false
    }
  } catch (error) {
    console.error('检查审批流模板失败:', error)
    workflowTemplates.value = []
    hasWorkflowTemplate.value = false
  }
}

// 新增报价
const goToCreate = async () => {
  dialogTitle.value = '新增报价'
  currentQuote.value = null
  await checkWorkflowTemplate()
  dialogVisible.value = true
  nextTick(() => {
    quoteFormRef.value?.resetForm()
  })
}

// 查看报价
const viewQuote = async (row: Quote) => {
  currentQuoteId.value = row.id
  quoteDetailDialogVisible.value = true
}

// 处理报价编辑
const handleQuoteEdit = (quote: Quote) => {
  editQuote(quote)
}

// 处理报价更新
const handleQuoteUpdated = () => {
  loadQuotes()
}

// 编辑报价
const editQuote = async (row: Quote) => {
  try {
    const response = await quoteApi.getDetail(row.id)
    if (response.code === 200) {
      dialogTitle.value = '编辑报价'
      currentQuote.value = response.data
      await checkWorkflowTemplate()
      dialogVisible.value = true
    }
  } catch (error) {
    console.error('获取报价详情失败:', error)
    ElMessage.error('获取报价详情失败')
  }
}

// 删除报价
const deleteQuote = async (row: Quote) => {
  try {
    await ElMessageBox.confirm('确定要删除该报价吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await quoteApi.delete(row.id)
    ElMessage.success('删除成功')
    loadQuotes()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除报价失败:', error)
      ElMessage.error('删除报价失败')
    }
  }
}

// 打印报价
const printQuote = async (row: Quote) => {
  try {
    // 加载完整的报价详情（包含明细）
    const response = await quoteApi.getDetail(row.id)
    if (response.code === 200 && response.data) {
      printQuoteData.value = response.data
      printDialogVisible.value = true
    } else {
      ElMessage.error('加载报价详情失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '加载报价详情失败')
  }
}


// 执行打印
const handlePrint = () => {
  nextTick(() => {
    if (quotePrintRef.value) {
      quotePrintRef.value.print()
    }
  })
}

const createContractFromQuote = async (row: Quote) => {
  try {
    await ElMessageBox.confirm('确定要从该报价创建合同吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    })

    const response = await contractApi.createFromQuote(row.id)
    if (response.code === 201) {
      ElMessage.success('合同创建成功')
      router.push({ name: 'Contracts' })
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('创建合同失败:', error)
      ElMessage.error('创建合同失败')
    }
  }
}

// 处理报价表单提交
const handleQuoteSubmit = async (data: CreateQuoteDto | UpdateQuoteDto, status?: 'draft' | 'pending_approval' | 'approved', needSubmitApproval = false) => {
  try {
    submitLoading.value = true

    // 设置状态
    if (status) {
      if ('status' in data) {
        (data as any).status = status
      } else {
        (data as any).status = status
      }
    }

    let quoteId: string | number | undefined

    if (currentQuote.value) {
      // 编辑模式
      await quoteApi.update(currentQuote.value.id, data as UpdateQuoteDto)
      quoteId = currentQuote.value.id
      ElMessage.success('更新成功')
    } else {
      // 新建模式
      const response = await quoteApi.create(data as CreateQuoteDto) as unknown as {
        code: number
        data?: Quote
      }
      if (response.code === 201 && response.data) {
        quoteId = response.data.id
        ElMessage.success('创建成功')
      }
    }

    // 如果需要提交审批，且报价已创建/更新成功
    if (needSubmitApproval && quoteId && workflowTemplates.value.length > 0) {
      try {
        // 如果只有一个启用的模板，直接提交
        if (workflowTemplates.value.length === 1) {
          await submitQuoteApproval(Number(quoteId), {
            templateId: workflowTemplates.value[0].id,
          }) as unknown as { code: number }
          ElMessage.success('提交审批成功')
        } else {
          // 如果有多个模板，需要用户选择（这里暂时使用第一个，后续可以优化为弹出选择对话框）
          await submitQuoteApproval(Number(quoteId), {
            templateId: workflowTemplates.value[0].id,
          }) as unknown as { code: number }
          ElMessage.success('提交审批成功')
        }
      } catch (error) {
        console.error('提交审批失败:', error)
        ElMessage.warning('报价已保存，但提交审批失败，请稍后手动提交审批')
      }
    }

    dialogVisible.value = false
    loadQuotes()
  } catch (error: any) {
    console.error('提交失败:', error)
    ElMessage.error(error.message || '提交失败')
  } finally {
    submitLoading.value = false
  }
}

// 处理报价表单提交（带状态）
const handleQuoteSubmitWithStatus = async (data: CreateQuoteDto | UpdateQuoteDto) => {
  let status: 'draft' | 'pending_approval' | 'approved' = 'draft'
  let needSubmitApproval = false
  
  if (hasWorkflowTemplate.value) {
    // 有审批流配置，根据按钮类型设置状态
    if (submitStatus.value === 'pending_approval') {
      // 提交审批时，先保存为草稿状态，然后通过API提交审批（API会将状态改为pending_approval）
      status = 'draft'
      needSubmitApproval = true
    } else {
      status = 'draft'
    }
  } else {
    // 没有审批流配置，直接设置为已审批
    status = 'approved'
  }
  
  await handleQuoteSubmit(data, status, needSubmitApproval)
  // 重置状态
  submitStatus.value = 'draft'
}

// 保存草稿
const handleSaveDraft = async () => {
  if (!quoteFormRef.value) {
    ElMessage.warning('表单未初始化')
    return
  }
  submitStatus.value = 'draft'
  const success = await quoteFormRef.value.submit()
  if (!success) {
    submitStatus.value = 'draft'
  }
}

// 提交审批
const handleSubmitApproval = async () => {
  if (!quoteFormRef.value) {
    ElMessage.warning('表单未初始化')
    return
  }
  submitStatus.value = 'pending_approval'
  const success = await quoteFormRef.value.submit()
  if (!success) {
    submitStatus.value = 'draft'
  }
}

// 提交表单（通过表单组件的submit方法）
const handleSubmit = async () => {
  if (!quoteFormRef.value) {
    ElMessage.warning('表单未初始化')
    return
  }
  const success = await quoteFormRef.value.submit()
  if (success) {
    // submit事件会在handleQuoteSubmit中处理
  }
}

// 初始化
onMounted(() => {
  loadQuotes()
})
</script>

<style scoped lang="scss">
@use '@/styles/common/table-layout.scss';

.quote-management {
  @extend .table-page;
}

.customer-name,
.opportunity-name {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  white-space: nowrap;

  .el-button {
    flex-shrink: 0;
  }
}

</style>

