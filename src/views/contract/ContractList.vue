<template>
  <div class="contract-management">
    <div class="main-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item>
              <el-input
                v-model="searchForm.search"
                placeholder="搜索合同编号/客户名称"
                clearable
                @input="handleSearchDebounced"
                @clear="handleSearch"
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
                placeholder="合同类型"
                clearable
                @change="handleSearch"
                style="width: 120px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="销售合同" value="sales" />
                <el-option label="服务合同" value="service" />
                <el-option label="维护合同" value="maintenance" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="searchForm.status"
                placeholder="合同状态"
                clearable
                @change="handleSearch"
                style="width: 120px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="草稿" value="draft" />
                <el-option label="审批中" value="pending_approval" />
                <el-option label="已审批通过" value="approved" />
                <el-option label="已拒绝" value="rejected" />
                <el-option label="待签署" value="pending_sign" />
                <el-option label="已签署" value="signed" />
                <el-option label="已生效" value="active" />
                <el-option label="已到期" value="expired" />
                <el-option label="已终止" value="terminated" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" :icon="Plus" @click="goToCreate"> 新增合同 </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="table-section">
        <el-table
          :data="contracts"
          v-loading="loading"
          style="width: 100%"
          border
          show-summary
          :summary-method="getSummaries"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="contractNumber" label="合同编号" min-width="150">
            <template #default="{ row }">
              <el-link type="primary" :underline="false" @click="viewContract(row)" style="cursor: pointer">
                {{ row.contractNumber }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column prop="customer.name" label="客户" width="150" show-overflow-tooltip />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getTypeType(row.type)">
                {{ getTypeName(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="totalAmount" label="合同金额" width="120" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.totalAmount) }}
            </template>
          </el-table-column>
          <el-table-column prop="signDate" label="签署日期" width="120">
            <template #default="{ row }">
              {{ row.signDate ? formatDate(row.signDate) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="effectiveDate" label="生效日期" width="120">
            <template #default="{ row }">
              {{ row.effectiveDate ? formatDate(row.effectiveDate) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="expiryDate" label="到期日期" width="120">
            <template #default="{ row }">
              {{ row.expiryDate ? formatDate(row.expiryDate) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusName(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="owner.username" label="负责人" width="120">
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
          <el-table-column label="操作" width="400" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'draft'"
                type="warning"
                size="small"
                :icon="Edit"
                @click="editContract(row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="row.status === 'draft' || row.status === 'rejected'"
                type="success"
                size="small"
                @click="viewContract(row)"
              >
                {{ row.status === 'rejected' ? '重新提交审批' : '提交审批' }}
              </el-button>
              <el-button type="info" size="small" :icon="Printer" @click="printContract(row)">
                打印
              </el-button>
              <el-button
                v-if="row.status === 'signed' || row.status === 'active'"
                type="info"
                size="small"
                @click="createOrderFromContract(row)"
              >
                创建订单
              </el-button>
              <el-button type="danger" size="small" :icon="Delete" @click="deleteContract(row)">
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

    <!-- 合同表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="1200px"
      :close-on-click-modal="false"
    >
      <ContractForm
        ref="contractFormRef"
        :contract="currentContract"
        @submit="(data) => handleContractSubmitWithStatus(data)"
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
      title="打印合同"
      width="90%"
      :close-on-click-modal="false"
      class="print-dialog"
    >
      <ContractPrint
        v-if="printContractData"
        ref="contractPrintRef"
        :contract="printContractData"
      />
      <template #footer>
        <el-button @click="printDialogVisible = false">关闭</el-button>
        <el-button type="primary" :icon="Printer" @click="handlePrint">打印</el-button>
      </template>
    </el-dialog>

    <!-- 合同详情对话框 -->
    <ContractDetailDialog
      v-model="contractDetailDialogVisible"
      :contract-id="currentContractId"
      @edit="handleContractEdit"
      @updated="handleContractUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Edit, Delete, Printer } from '@element-plus/icons-vue'
import type { UploadFile, UploadProps } from 'element-plus'
import contractApi, {
  type Contract,
  type CreateContractDto,
  type UpdateContractDto,
  type QueryContractDto,
} from '@/api/contract'
import ContractPrint from '@/components/contract/ContractPrint.vue'
import ContractForm from '@/components/contract/ContractForm.vue'
import orderApi from '@/api/order'
import ContractDetailDialog from '@/components/contract/ContractDetailDialog.vue'
import { getWorkflowTemplates, submitContractApproval, type WorkflowTemplate } from '@/api/workflow'

const router = useRouter()

// 搜索表单
const searchForm = reactive({
  search: '',
  type: undefined as string | undefined,
  status: undefined as string | undefined,
})

// 防抖定时器
let searchTimer: ReturnType<typeof setTimeout> | null = null

// 合同列表
const contracts = ref<Contract[]>([])
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
const contractFormRef = ref<InstanceType<typeof ContractForm>>()
const currentContract = ref<Contract | null>(null)

// 打印对话框相关
const printDialogVisible = ref(false)
const printContractData = ref<Contract | null>(null)
const contractPrintRef = ref<InstanceType<typeof ContractPrint>>()

// 合同详情对话框
const contractDetailDialogVisible = ref(false)
const currentContractId = ref<string | number | undefined>(undefined)

// 审批流模板相关
const hasWorkflowTemplate = ref(false)
const workflowTemplates = ref<WorkflowTemplate[]>([])
const submitStatus = ref<'draft' | 'pending_approval' | 'approved'>('draft')

// 合计行方法
const getSummaries = (param: { columns: any[]; data: Contract[] }) => {
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
const formatCurrency = (value: number | string | null | undefined) => {
  if (!value && value !== 0) return '¥0.00'
  const numValue = typeof value === 'string' ? parseFloat(value) : Number(value)
  if (isNaN(numValue)) return '¥0.00'
  return `¥${numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

// 格式化日期
const formatDate = (date: string | Date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN')
}

// 格式化日期时间
const formatDateTime = (date: string | Date) => {
  if (!date) return '-'
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: 'info',
    pending_approval: 'warning',
    approved: 'success',
    rejected: 'danger',
    pending_sign: 'warning',
    signed: 'success',
    active: 'success',
    expired: 'danger',
    terminated: 'danger',
  }
  return statusMap[status] || 'info'
}

// 获取状态名称
const getStatusName = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    pending_approval: '审批中',
    approved: '已审批通过',
    rejected: '已拒绝',
    pending_sign: '待签署',
    signed: '已签署',
    active: '已生效',
    expired: '已到期',
    terminated: '已终止',
  }
  return statusMap[status] || status
}

// 获取类型类型
const getTypeType = (type: string) => {
  const typeMap: Record<string, string> = {
    sales: 'primary',
    service: 'success',
    maintenance: 'warning',
    other: 'info',
  }
  return typeMap[type] || 'info'
}

// 获取类型名称
const getTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    sales: '销售合同',
    service: '服务合同',
    maintenance: '维护合同',
    other: '其他',
  }
  return typeMap[type] || type
}

// 加载合同列表
const loadContracts = async () => {
  try {
    loading.value = true
    const query: QueryContractDto = {
      search: searchForm.search || undefined,
      type: searchForm.type as any,
      status: searchForm.status as any,
      page: pagination.page,
      limit: pagination.pageSize,
    }
    const response = await contractApi.getList(query)
    if (response.code === 200) {
      contracts.value = response.data.contracts
      pagination.total = response.data.total
    }
  } catch (error) {
    console.error('加载合同列表失败:', error)
    ElMessage.error('加载合同列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索（带防抖，用于输入框）
const handleSearchDebounced = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    pagination.page = 1
    loadContracts()
  }, 300)
}

// 搜索（立即执行，用于下拉选择）
const handleSearch = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  pagination.page = 1
  loadContracts()
}

// 重置
const handleReset = () => {
  searchForm.search = ''
  searchForm.type = undefined
  searchForm.status = undefined
  pagination.page = 1
  loadContracts()
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadContracts()
}

// 当前页变化
const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadContracts()
}

// 检查是否有审批流模板
const checkWorkflowTemplate = async () => {
  try {
    const response = await getWorkflowTemplates('contract') as unknown as {
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

// 新增合同
const goToCreate = async () => {
  dialogTitle.value = '新增合同'
  currentContract.value = null
  await checkWorkflowTemplate()
  dialogVisible.value = true
  nextTick(() => {
    contractFormRef.value?.resetForm()
  })
}

// 查看合同
const viewContract = (row: Contract) => {
  currentContractId.value = row.id
  contractDetailDialogVisible.value = true
}

// 处理合同编辑
const handleContractEdit = (contract: Contract) => {
  contractDetailDialogVisible.value = false
  editContract(contract)
}

// 处理合同更新
const handleContractUpdated = () => {
  loadContracts()
}

// 处理合同表单提交（带状态）
const handleContractSubmitWithStatus = async (data: CreateContractDto | UpdateContractDto) => {
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
  
  await handleContractSubmit(data, status, needSubmitApproval)
  // 重置状态
  submitStatus.value = 'draft'
}

// 处理合同表单提交
const handleContractSubmit = async (data: CreateContractDto | UpdateContractDto, status?: 'draft' | 'pending_approval' | 'approved', needSubmitApproval = false) => {
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

    let contractId: string | number | undefined

    if (currentContract.value) {
      // 编辑模式
      await contractApi.update(currentContract.value.id, data as UpdateContractDto)
      contractId = currentContract.value.id
      ElMessage.success('更新成功')
    } else {
      // 创建模式
      const response = await contractApi.create(data as CreateContractDto) as unknown as { code: number; data?: Contract }
      if (response.code === 201 && response.data) {
        contractId = response.data.id
        ElMessage.success('创建成功')
      }
    }

    // 如果需要提交审批
    if (needSubmitApproval && contractId && workflowTemplates.value.length > 0) {
      try {
        const templateId = workflowTemplates.value[0].id
        await submitContractApproval(Number(contractId), {
          templateId,
        })
        ElMessage.success('提交审批成功')
      } catch (error) {
        console.error('提交审批失败:', error)
        ElMessage.error('提交审批失败')
      }
    }

    dialogVisible.value = false
    loadContracts()
  } catch (error: any) {
    console.error('提交失败:', error)
    ElMessage.error(error?.response?.data?.message || error?.message || '提交失败')
  } finally {
    submitLoading.value = false
  }
}

// 保存草稿
const handleSaveDraft = async () => {
  if (!contractFormRef.value) {
    ElMessage.warning('表单未初始化')
    return
  }
  submitStatus.value = 'draft'
  const success = await contractFormRef.value.submit()
  if (!success) {
    submitStatus.value = 'draft'
  }
}

// 提交审批
const handleSubmitApproval = async () => {
  if (!contractFormRef.value) {
    ElMessage.warning('表单未初始化')
    return
  }
  submitStatus.value = 'pending_approval'
  const success = await contractFormRef.value.submit()
  if (!success) {
    submitStatus.value = 'draft'
  }
}

// 提交表单（通过表单组件的submit方法）
const handleSubmit = async () => {
  if (!contractFormRef.value) {
    ElMessage.warning('表单未初始化')
    return
  }
  const success = await contractFormRef.value.submit()
  if (success) {
    // submit事件会在handleContractSubmit中处理
  }
}

// 编辑合同
const editContract = async (row: Contract) => {
  try {
    const response = await contractApi.getDetail(row.id)
    if (response.code === 200) {
      dialogTitle.value = '编辑合同'
      currentContract.value = response.data
      await checkWorkflowTemplate()
      dialogVisible.value = true
    }
  } catch (error) {
    console.error('获取合同详情失败:', error)
    ElMessage.error('获取合同详情失败')
  }
}

// 删除合同
// 打印合同
const printContract = async (row: Contract) => {
  try {
    // 加载完整的合同详情（包含明细）
    const response = await contractApi.getDetail(row.id)
    if (response.code === 200 && response.data) {
      printContractData.value = response.data
      printDialogVisible.value = true
    } else {
      ElMessage.error('加载合同详情失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '加载合同详情失败')
  }
}

// 执行打印
const handlePrint = () => {
  nextTick(() => {
    if (contractPrintRef.value) {
      contractPrintRef.value.print()
    }
  })
}

const deleteContract = async (row: Contract) => {
  try {
    await ElMessageBox.confirm('确定要删除该合同吗？', '提示', {
      type: 'warning',
    })
    await contractApi.delete(row.id)
    ElMessage.success('删除成功')
    loadContracts()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除合同失败:', error)
      ElMessage.error('删除合同失败')
    }
  }
}

// 从合同创建订单
const createOrderFromContract = async (row: Contract) => {
  try {
    await ElMessageBox.confirm('确定要从该合同创建订单吗？', '提示', {
      type: 'info',
    })
    const response = await orderApi.createFromContract(row.id)
    if (response.code === 201) {
      ElMessage.success('创建订单成功')
      router.push('/orders')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('创建订单失败:', error)
      ElMessage.error('创建订单失败')
    }
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    customerId: undefined,
    contactId: undefined,
    quoteId: undefined,
    opportunityId: undefined,
    type: 'sales',
    status: 'draft',
    signDate: '',
    effectiveDate: '',
    expiryDate: '',
    content: '',
    attachments: [],
    templateId: undefined,
    notes: '',
    items: [],
  })
  availableContacts.value = []
  attachmentList.value = []
  formRef.value?.clearValidate()
}

// 添加明细项
const addItem = () => {
  const newItem: CreateContractItemDto & { amount?: number; priceComponents?: Record<string, number>; taxRate?: number; unitPriceExclTax?: number; taxAmount?: number; amountExclTax?: number; packagingUnit?: string; packagingSpec?: string; _product?: ProductInfo } = {
    productId: 0,
    quantity: 1,
    packagingUnit: undefined,
    packagingSpec: undefined,
    unitPrice: 0,
    discount: 0,
    taxRate: defaultTaxRate.value,
    unitPriceExclTax: 0,
    taxAmount: 0,
    amountExclTax: 0,
    notes: '',
  }

  // 复杂模式下初始化价格组成项
  if (pricingConfig.value.pricingMode === 'complex' && pricingConfig.value.priceComponents) {
    newItem.priceComponents = {}
    pricingConfig.value.priceComponents.forEach((component) => {
      newItem.priceComponents![component.key] = component.defaultValue || 0
    })
    // 计算初始单价
    newItem.unitPrice = Object.values(newItem.priceComponents).reduce(
      (sum, val) => sum + (Number(val) || 0),
      0,
    )
  }

  formData.items.push(newItem)
  // 初始化时计算税额相关字段
  calculateItemTaxAmounts(formData.items.length - 1)
}

// 移除明细项
const removeItem = (index: number) => {
  formData.items.splice(index, 1)
  // 重新计算总金额
  formData.items.forEach((item, idx) => {
    calculateItemAmount(idx)
  })
}

// 计算明细项的价格组成项（复杂模式）
const calculateItemPriceComponents = (index: number) => {
  const item = formData.items[index]
  if (pricingConfig.value.pricingMode === 'complex') {
    // 确保 priceComponents 存在
    if (!item.priceComponents) {
      item.priceComponents = {}
    }
    // 计算单价：所有价格组成项之和
    const total = Object.values(item.priceComponents).reduce((sum, value) => {
      return sum + (Number(value) || 0)
    }, 0)
    item.unitPrice = total
  }
  // 重新计算金额
  calculateItemAmount(index)
}

// 计算明细项金额
const calculateItemAmount = (index: number) => {
  const item = formData.items[index]
  if (item && item.quantity && item.unitPrice) {
    const discount = item.discount || 0
    item.amount = item.quantity * item.unitPrice * (1 - discount / 100)
  } else {
    item.amount = 0
  }
  // 重新计算税额相关字段
  calculateItemTaxAmounts(index)
}

// 计算明细项的税额相关字段
const calculateItemTaxAmounts = (index: number) => {
  const item = formData.items[index]
  if (!item) return

  const quantity = Number(item.quantity) || 0
  const unitPrice = Number(item.unitPrice) || 0  // 含税单价
  const discount = Number(item.discount) || 0
  const taxRate = Number(item.taxRate) || 0  // 税率(%)

  // 计算含税金额
  const amount = quantity > 0 && unitPrice > 0
    ? quantity * unitPrice * (1 - discount / 100)
    : 0
  item.amount = Math.round(amount * 100) / 100

  // 计算不含税单价
  if (taxRate > 0 && taxRate !== -100) {
    item.unitPriceExclTax = unitPrice / (1 + taxRate / 100)
  } else {
    item.unitPriceExclTax = unitPrice
  }
  item.unitPriceExclTax = Math.round(item.unitPriceExclTax * 100) / 100

  // 计算不含税金额
  if (taxRate > 0 && taxRate !== -100) {
    item.amountExclTax = amount / (1 + taxRate / 100)
  } else {
    item.amountExclTax = amount
  }
  item.amountExclTax = Math.round(item.amountExclTax * 100) / 100

  // 计算税金
  item.taxAmount = amount - item.amountExclTax
  item.taxAmount = Math.round(item.taxAmount * 100) / 100
}

// 获取可用的辅助单位列表（仅销售用途）
const getAvailableAuxiliaryUnitsForItem = (index: number) => {
  const item = formData.items[index]
  return getAvailableAuxiliaryUnits(item._product, 'sales')
}

// 获取显示用的数量（根据包装单位转换）
const getDisplayQuantityForItem = (index: number): number => {
  const item = formData.items[index]
  return getDisplayQuantity(item)
}

// 处理数量输入（转换为主单位存储）
const handleQuantityInput = (index: number, displayValue: number) => {
  const item = formData.items[index]
  if (!item) return
  item.quantity = convertQuantityToMainUnit(item, displayValue)
  calculateItemAmount(index)
}

// 处理包装数量输入（从包装单位转换为主单位存储）
const handlePackagingQuantityInput = (index: number, displayValue: number) => {
  const item = formData.items[index]
  if (!item) return
  // 将包装数量转换为主单位数量
  item.quantity = convertQuantityToMainUnit(item, displayValue)
  calculateItemAmount(index)
}

// 格式化数字（保留2位小数）
const formatNumber = (value: number) => {
  if (value === undefined || value === null) return '0.00'
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// 加载单位选项（从系统字典）
const loadUnitOptions = async () => {
  try {
    const res = await dictionaryApi.getItemsTree('product_unit')
    if (res.code === 200 && res.data) {
      // 扁平化字典树
      const flattenItems = (nodes: DictItemTreeNode[]): { label: string; value: string }[] => {
        const result: { label: string; value: string }[] = []
        nodes.forEach((node) => {
          result.push({
            label: node.label,
            value: node.value || String(node.id),
          })
          if (node.children && node.children.length > 0) {
            result.push(...flattenItems(node.children))
          }
        })
        return result
      }
      unitOptions.value = flattenItems(res.data)
    }
  } catch (error) {
    console.error('加载单位选项失败:', error)
    unitOptions.value = []
  }
}

// 获取单位的中文标签
const getUnitLabel = (unitValue: string): string => {
  if (!unitValue) return ''
  const unitOption = unitOptions.value.find(opt => opt.value === unitValue)
  return unitOption ? unitOption.label : unitValue
}

// 获取包装单位标签（只显示用途为销售的单位）
const getPackagingUnitLabel = (row: ContractFormData['items'][0]): string => {
  if (!row.packagingUnit) return ''
  return getUnitLabel(row.packagingUnit)
}

// 获取显示用的单价（根据包装单位转换）
const getDisplayUnitPriceForItem = (index: number): number => {
  const item = formData.items[index]
  return getDisplayUnitPrice(item)
}

// 处理单价输入（转换为主单位存储）
const handleUnitPriceInput = (index: number, displayValue: number) => {
  const item = formData.items[index]
  if (!item) return
  item.unitPrice = convertUnitPriceToMainUnit(item, displayValue)
  calculateItemAmount(index)
}

// 处理包装单位变化
const handlePackagingUnitChangeForItem = (index: number, unit: string) => {
  const item = formData.items[index]
  if (!item) return
  item.packagingUnit = unit
  item.packagingSpec = handlePackagingUnitChange(item, unit)
  // 重新计算显示值（数量保持不变，只是显示转换）
  calculateItemAmount(index)
}

// 处理产品选择变化
const handleProductChange = async (index: number, productId: number) => {
  const item = formData.items[index]
  if (!item || !productId) return

  // 加载产品详情（包含辅助单位）
  try {
    const res = await productApi.getDetail(String(productId))
    if (res.code === 200 && res.data) {
      item._product = {
        unit: res.data.unit,
        auxiliaryUnits: (res.data.auxiliaryUnits || []) as ProductInfo['auxiliaryUnits']
      }

      // 优先使用用途为"销售"的辅助单位，如果没有则使用主单位
      const salesAuxUnit = item._product.auxiliaryUnits?.find(aux => aux.purpose === 'sales')
      if (salesAuxUnit) {
        item.packagingUnit = salesAuxUnit.unit
        item.packagingSpec = salesAuxUnit.description || `${salesAuxUnit.conversionRate}${res.data.unit}/${salesAuxUnit.unit}`
      } else {
        // 默认使用主单位
        item.packagingUnit = res.data.unit
        item.packagingSpec = ''
      }

      // 如果产品有价格，自动填充单价
      if (res.data.price) {
        item.unitPrice = res.data.price
      }
    }
  } catch (error) {
    console.error('加载产品详情失败:', error)
  }

  calculateItemAmount(index)
}

// 客户变化时加载联系人
const handleCustomerChange = async () => {
  formData.contactId = undefined
  availableContacts.value = []

  if (formData.customerId) {
    try {
      const response = await customerApi.getDetail(formData.customerId.toString())
      if (response.code === 200 && response.data.contacts) {
        availableContacts.value = response.data.contacts.map((contact: any) => ({
          id: contact.id,
          name: contact.name,
          position: contact.position,
        }))
      }
    } catch (error) {
      console.error('加载联系人列表失败:', error)
      availableContacts.value = []
    }
  }
}


// 附件上传前检查
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isValidType = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
  ].includes(file.type)
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isValidType) {
    ElMessage.error('只支持PDF、Word、Excel、图片格式')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过10MB')
    return false
  }
  return true
}

// 附件上传成功
const handleAttachmentSuccess: UploadProps['onSuccess'] = (response: any, file: UploadFile) => {
  const url = response?.data?.url || response?.url || response
  if (url) {
    file.url = url
    ElMessage.success('附件上传成功')
  } else {
    ElMessage.error('上传失败：未获取到文件URL')
  }
}

// 附件移除
const handleAttachmentRemove: UploadProps['onRemove'] = (file: UploadFile) => {
  // 从附件列表中移除
  const resp: any = file.response || {}
  const url = file.url || resp.data?.url || resp.url || resp
  if (url) {
    formData.attachments = (formData.attachments || []).filter((att) => att !== url)
  }
}

// 加载客户和产品列表
const loadCustomers = async () => {
  try {
    const response = await customerApi.getList({ page: 1, limit: 1000 })
    if (response.code === 200) {
      availableCustomers.value = response.data.customers.map((c: any) => ({
        id: c.id,
        name: c.name,
      }))
    }
  } catch (error) {
    console.error('加载客户列表失败:', error)
  }
}

const loadProducts = async () => {
  try {
    const response = await productApi.getList({ page: 1, limit: 1000 })
    if (response.code === 200) {
      availableProducts.value = response.data.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        code: p.code,
      }))
    }
  } catch (error) {
    console.error('加载产品列表失败:', error)
  }
}

// 加载默认税率
const loadDefaultTaxRate = async () => {
  const tenantId = authStore.currentTenant?.id
  if (!tenantId) {
    return
  }
  try {
    const tenant = authStore.currentTenant
    if (tenant && typeof (tenant as any).defaultTaxRate === 'number') {
      defaultTaxRate.value = (tenant as any).defaultTaxRate
    } else {
      // 如果租户信息中没有，尝试从租户详情中获取
      try {
        const tenantResponse = await tenantApi.getDetail(tenantId)
        if (tenantResponse.code === 200 && tenantResponse.data && typeof (tenantResponse.data as any).defaultTaxRate === 'number') {
          defaultTaxRate.value = (tenantResponse.data as any).defaultTaxRate
        }
      } catch {
        // 如果获取失败，使用默认值 0
        defaultTaxRate.value = 0
      }
    }
  } catch (error) {
    console.error('加载默认税率失败:', error)
    defaultTaxRate.value = 0
  }
}

// 加载价格配置
const loadPricingConfig = async () => {
  const tenantId = authStore.currentTenant?.id
  if (!tenantId) {
    return
  }
  try {
    pricingConfigLoading.value = true
    const response = await tenantApi.getPricingConfig(tenantId)
    if (response.code === 200) {
      pricingConfig.value = response.data
    } else {
      pricingConfig.value = {
        pricingMode: 'simple',
        priceComponents: [],
      }
    }
  } catch (error) {
    console.error('加载价格配置失败:', error)
    pricingConfig.value = {
      pricingMode: 'simple',
      priceComponents: [],
    }
  } finally {
    pricingConfigLoading.value = false
  }
}

// 初始化
onMounted(async () => {
  // 优先加载合同列表数据
  await loadContracts()

  // 并行加载其他数据（即使失败也不影响合同列表显示）
  Promise.all([
    loadPricingConfig(),
    loadDefaultTaxRate(),
    loadUnitOptions(),
    loadCustomers(),
    loadProducts(),
  ]).catch((error) => {
    console.error('加载辅助数据失败:', error)
  })
})
</script>

<style scoped lang="scss">
@use '@/styles/common/table-layout.scss';

.contract-management {
  @extend .table-page;
}

.contract-items-section {
  width: 100%;
}

.total-amount {
  margin-top: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  text-align: right;

  .total-row {
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    strong {
  font-size: 16px;
      color: #303133;
    }
  }
  color: var(--el-color-primary);
}
</style>

