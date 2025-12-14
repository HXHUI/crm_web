<template>
  <div class="order-management">
    <div class="main-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item>
              <el-input
                v-model="searchForm.search"
                placeholder="搜索订单编号/客户名称"
                clearable
                @input="handleSearch"
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
                placeholder="订单状态"
                clearable
                @change="handleSearch"
                style="width: 120px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="待处理" value="pending" />
                <el-option label="已确认" value="confirmed" />
                <el-option label="处理中" value="processing" />
                <el-option label="已发货" value="shipped" />
                <el-option label="已交付" value="delivered" />
                <el-option label="已完成" value="completed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" :icon="Plus" @click="goToCreate"> 新增订单 </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="table-section">
        <el-table
          :data="orders"
          v-loading="loading"
          style="width: 100%"
          border
          show-summary
          :summary-method="getSummaries"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="orderNumber" label="订单编号" min-width="150">
            <template #default="{ row }">
              <el-link type="primary" :underline="false" @click="viewOrder(row)" style="cursor: pointer">
                {{ row.orderNumber }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column prop="customer.name" label="客户" width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="customer-name">{{ row.customer?.name || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="contract.contractNumber" label="关联合同" width="150">
            <template #default="{ row }">
              {{ row.contract?.contractNumber || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="totalAmount" label="订单金额" width="120" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.totalAmount) }}
            </template>
          </el-table-column>
          <el-table-column prop="orderDate" label="下单日期" width="120">
            <template #default="{ row }">
              {{ formatDate(row.orderDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="deliveryDate" label="交付日期" width="120">
            <template #default="{ row }">
              {{ row.deliveryDate ? formatDate(row.deliveryDate) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
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
          <el-table-column label="操作" width="250" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'draft' || row.status === 'rejected'"
                type="success"
                size="small"
                @click="viewOrder(row)"
              >
                {{ row.status === 'rejected' ? '重新提交审批' : '提交审批' }}
              </el-button>
              <el-button type="info" size="small" :icon="Printer" @click="printOrder(row)">
                打印
              </el-button>
              <el-button type="warning" size="small" :icon="Edit" @click="editOrder(row)">
                编辑
              </el-button>
              <el-button type="danger" size="small" :icon="Delete" @click="deleteOrder(row)">
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

    <!-- 订单表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="1000px"
      :close-on-click-modal="false"
      @opened="handleDialogOpened"
    >
      <OrderForm
        :key="dialogKey"
        ref="orderFormRef"
        :default-customer-id="defaultCustomerId"
        :order="currentOrder"
        @submit="(data) => handleOrderSubmitWithStatus(data)"
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

    <!-- 订单详情对话框 -->
    <OrderDetailDialog
      v-model="orderDetailDialogVisible"
      :order-id="currentOrderId"
      @edit="handleOrderEdit"
      @updated="handleOrderUpdated"
    />

    <!-- 打印对话框 -->
    <el-dialog
      v-model="printDialogVisible"
      title="打印订单"
      width="90%"
      :close-on-click-modal="false"
      class="print-dialog"
    >
      <OrderPrint
        v-if="printOrderData"
        ref="orderPrintRef"
        :order="printOrderData"
      />
      <template #footer>
        <el-button @click="printDialogVisible = false">关闭</el-button>
        <el-button type="primary" :icon="Printer" @click="handlePrint">打印</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Edit, Delete, Printer } from '@element-plus/icons-vue'
import orderApi, {
  type Order,
  type CreateOrderDto,
  type UpdateOrderDto,
  type QueryOrderDto,
} from '@/api/order'
import OrderForm from '@/components/order/OrderForm.vue'
import OrderDetailDialog from '@/components/order/OrderDetailDialog.vue'
import OrderPrint from '@/components/order/OrderPrint.vue'
import { tenantApi, type TenantPricingConfig } from '@/api/tenant'
import { useAuthStore } from '@/stores/modules/auth'
import { getWorkflowTemplates, submitOrderApproval, type WorkflowTemplate } from '@/api/workflow'

// 搜索表单
const searchForm = reactive({
  search: '',
  status: undefined as string | undefined,
})

// 订单列表
const orders = ref<Order[]>([])
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
const orderFormRef = ref<InstanceType<typeof OrderForm>>()
const currentOrder = ref<Order | null>(null)
const defaultCustomerId = ref<number | undefined>(undefined)
const dialogKey = ref(0) // 用于强制重新渲染组件
const authStore = useAuthStore()

// 价格配置（用于显示价格组成信息）
const pricingConfig = ref<TenantPricingConfig>({
  pricingMode: 'simple',
  priceComponents: [],
})

// 获取状态类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    draft: 'info',
    pending_approval: 'warning',
    approved: 'success',
    active: 'success',
    rejected: 'danger',
    pending: 'info',
    confirmed: 'warning',
    processing: 'primary',
    shipped: 'success',
    delivered: 'success',
    completed: 'success',
    cancelled: 'danger',
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
    pending: '待处理',
    confirmed: '已确认',
    processing: '处理中',
    shipped: '已发货',
    delivered: '已交付',
    completed: '已完成',
    cancelled: '已取消',
  }
  return nameMap[status] || status
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 格式化日期时间
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

// 格式化货币
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// 合计行方法
const getSummaries = (param: { columns: any[]; data: Order[] }) => {
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

// 加载订单列表
const loadOrders = async () => {
  try {
    loading.value = true
    const params: QueryOrderDto = {
      ...searchForm,
      page: pagination.page,
      limit: pagination.pageSize,
    }
    const response = await orderApi.getList(params)

    if (response.code === 200) {
      orders.value = response.data.orders
      pagination.total = response.data.total
    }
  } catch (error) {
    console.error('加载订单列表失败:', error)
    ElMessage.error('加载订单列表失败')
  } finally {
    loading.value = false
  }
}


// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadOrders()
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadOrders()
}

// 当前页变化
const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadOrders()
}

// 新增订单
const goToCreate = async () => {
  currentOrder.value = null
  defaultCustomerId.value = undefined
  dialogTitle.value = '新增订单'
  await checkWorkflowTemplate()
  dialogKey.value++ // 增加 key 值，强制重新渲染组件
  dialogVisible.value = true
}

// 加载价格配置
const loadPricingConfig = async () => {
  const tenantId = authStore.currentTenant?.id
  if (!tenantId) {
    return
  }
  try {
    const response = await tenantApi.getPricingConfig(tenantId)
    if (response.code === 200) {
      pricingConfig.value = response.data
    }
  } catch (error) {
    console.error('加载价格配置失败:', error)
  }
}

// 订单详情对话框
const orderDetailDialogVisible = ref(false)
const currentOrderId = ref<string | number | undefined>(undefined)

// 打印对话框相关
const printDialogVisible = ref(false)
const printOrderData = ref<Order | null>(null)
const orderPrintRef = ref<InstanceType<typeof OrderPrint>>()

// 审批流模板相关
const hasWorkflowTemplate = ref(false)
const workflowTemplates = ref<WorkflowTemplate[]>([])
const submitStatus = ref<'draft' | 'pending_approval' | 'approved'>('draft')

// 检查是否有审批流模板
const checkWorkflowTemplate = async () => {
  try {
    const response = await getWorkflowTemplates('order') as unknown as {
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

// 查看订单
const viewOrder = (row: Order) => {
  currentOrderId.value = row.id
  orderDetailDialogVisible.value = true
}

// 处理订单编辑
const handleOrderEdit = (order: Order) => {
  orderDetailDialogVisible.value = false
  editOrder(order)
}

// 处理订单更新
const handleOrderUpdated = () => {
  loadOrders()
}

// 编辑订单
const editOrder = async (row: Order) => {
  try {
    const response = await orderApi.getDetail(row.id)
    if (response.code === 200) {
      currentOrder.value = response.data
      defaultCustomerId.value = undefined
      dialogTitle.value = '编辑订单'
      await checkWorkflowTemplate()
      dialogKey.value++ // 增加 key 值，强制重新渲染组件
      dialogVisible.value = true
    }
  } catch (error) {
    console.error('获取订单详情失败:', error)
    ElMessage.error('获取订单详情失败')
  }
}

// 对话框打开后的处理
const handleDialogOpened = () => {
  // 对话框打开后，确保表单已重置
  nextTick(() => {
    orderFormRef.value?.resetForm()
  })
}

// 打印订单
const printOrder = async (row: Order) => {
  try {
    // 加载完整的订单详情（包含明细）
    const response = await orderApi.getDetail(row.id)
    if (response.code === 200 && response.data) {
      printOrderData.value = response.data
      printDialogVisible.value = true
    } else {
      ElMessage.error('加载订单详情失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '加载订单详情失败')
  }
}

// 执行打印
const handlePrint = () => {
  nextTick(() => {
    if (orderPrintRef.value) {
      orderPrintRef.value.print()
    }
  })
}

// 删除订单
const deleteOrder = async (row: Order) => {
  try {
    await ElMessageBox.confirm('确定要删除该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await orderApi.delete(row.id)
    ElMessage.success('删除成功')
    loadOrders()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除订单失败:', error)
      ElMessage.error('删除订单失败')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!orderFormRef.value) {
    ElMessage.warning('表单未初始化')
    return
  }

  submitLoading.value = true
  try {
    const success = await orderFormRef.value.submit()
    if (!success) {
      submitLoading.value = false
    }
    // 如果成功，会触发 handleFormSubmit 事件处理函数
  } catch (error: any) {
    console.error('提交失败:', error)
    ElMessage.error(error.message || '提交失败')
    submitLoading.value = false
  }
}

// 处理订单表单提交（带状态）
const handleOrderSubmitWithStatus = async (data: CreateOrderDto | UpdateOrderDto) => {
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
  
  await handleOrderSubmit(data, status, needSubmitApproval)
  // 重置状态
  submitStatus.value = 'draft'
}

// 处理订单表单提交
const handleOrderSubmit = async (data: CreateOrderDto | UpdateOrderDto, status?: 'draft' | 'pending_approval' | 'approved', needSubmitApproval = false) => {
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

    let orderId: string | number | undefined

    if (currentOrder.value) {
      // 编辑模式
      await orderApi.update(currentOrder.value.id, data as UpdateOrderDto)
      orderId = currentOrder.value.id
      ElMessage.success('更新成功')
    } else {
      // 创建模式
      const response = await orderApi.create(data as CreateOrderDto) as unknown as { code: number; data?: Order }
      if (response.code === 201 && response.data) {
        orderId = response.data.id
        ElMessage.success('创建成功')
      }
    }

    // 如果需要提交审批
    if (needSubmitApproval && orderId && workflowTemplates.value.length > 0) {
      try {
        const templateId = workflowTemplates.value[0].id
        await submitOrderApproval(Number(orderId), {
          templateId,
        })
        ElMessage.success('提交审批成功')
      } catch (error) {
        console.error('提交审批失败:', error)
        ElMessage.error('提交审批失败')
      }
    }

    dialogVisible.value = false
    loadOrders()
  } catch (error: any) {
    console.error('提交失败:', error)
    ElMessage.error(error?.response?.data?.message || error?.message || '提交失败')
  } finally {
    submitLoading.value = false
  }
}

// 保存草稿
const handleSaveDraft = async () => {
  if (!orderFormRef.value) {
    ElMessage.warning('表单未初始化')
    return
  }
  submitStatus.value = 'draft'
  const success = await orderFormRef.value.submit()
  if (!success) {
    submitStatus.value = 'draft'
  }
}

// 提交审批
const handleSubmitApproval = async () => {
  if (!orderFormRef.value) {
    ElMessage.warning('表单未初始化')
    return
  }
  submitStatus.value = 'pending_approval'
  const success = await orderFormRef.value.submit()
  if (!success) {
    submitStatus.value = 'draft'
  }
}

// 初始化
onMounted(() => {
  loadOrders()
  loadPricingConfig()
})
</script>

<style scoped lang="scss">
@use '@/styles/common/table-layout.scss';

.order-management {
  @extend .table-page;
}

.customer-name {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

