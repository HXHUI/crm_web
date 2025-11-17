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
                placeholder="订单状态"
                clearable
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
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch"> 搜索 </el-button>
              <el-button :icon="Refresh" @click="handleReset"> 重置 </el-button>
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
        >
          <el-table-column prop="orderNumber" label="订单编号" min-width="150" />
          <el-table-column prop="customer.name" label="客户" width="150" />
          <el-table-column prop="quote.quoteNumber" label="关联报价" width="150">
            <template #default="{ row }">
              {{ row.quote?.quoteNumber || '-' }}
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
          <el-table-column prop="owner.username" label="负责人" width="120" />
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" :icon="View" @click="viewOrder(row)">
                查看
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
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="订单编号" prop="orderNumber">
              <el-input v-model="formData.orderNumber" placeholder="请输入订单编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户" prop="customerId">
              <el-select
                v-model="formData.customerId"
                placeholder="请选择客户"
                filterable
                style="width: 100%"
                @change="handleCustomerChange"
              >
                <el-option
                  v-for="customer in availableCustomers"
                  :key="customer.id"
                  :label="customer.name"
                  :value="parseInt(customer.id)"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联报价" prop="quoteId">
              <el-select
                v-model="formData.quoteId"
                placeholder="请选择关联报价（可选）"
                filterable
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="quote in availableQuotes"
                  :key="quote.id"
                  :label="quote.quoteNumber"
                  :value="parseInt(quote.id)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="待处理" value="pending" />
                <el-option label="已确认" value="confirmed" />
                <el-option label="处理中" value="processing" />
                <el-option label="已发货" value="shipped" />
                <el-option label="已交付" value="delivered" />
                <el-option label="已完成" value="completed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="下单日期" prop="orderDate">
              <el-date-picker
                v-model="formData.orderDate"
                type="date"
                placeholder="请选择下单日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交付日期" prop="deliveryDate">
              <el-date-picker
                v-model="formData.deliveryDate"
                type="date"
                placeholder="请选择交付日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 订单明细 -->
        <el-form-item label="订单明细" prop="items">
          <div class="order-items-section">
            <el-table :data="formData.items" border style="width: 100%">
              <el-table-column label="产品" min-width="200">
                <template #default="{ row, $index }">
                  <el-select
                    v-model="row.productId"
                    placeholder="请选择产品"
                    filterable
                    style="width: 100%"
                    @change="calculateItemAmount($index)"
                  >
                    <el-option
                      v-for="product in availableProducts"
                      :key="product.id"
                      :label="`${product.name} (${product.code || ''})`"
                      :value="parseInt(product.id)"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="数量" width="120">
                <template #default="{ row, $index }">
                  <el-input-number
                    v-model="row.quantity"
                    :min="0.01"
                    :precision="2"
                    :controls="false"
                    style="width: 100%"
                    @change="calculateItemAmount($index)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="单价" width="120">
                <template #default="{ row, $index }">
                  <el-input-number
                    v-model="row.unitPrice"
                    :min="0"
                    :precision="2"
                    :controls="false"
                    style="width: 100%"
                    @change="calculateItemAmount($index)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="折扣(%)" width="120">
                <template #default="{ row, $index }">
                  <el-input-number
                    v-model="row.discount"
                    :min="0"
                    :max="100"
                    :precision="2"
                    :controls="false"
                    style="width: 100%"
                    @change="calculateItemAmount($index)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="金额" width="120" align="right">
                <template #default="{ row }">
                  {{ formatCurrency(row.amount) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" align="center">
                <template #default="{ $index }">
                  <el-button
                    type="danger"
                    size="small"
                    :icon="Delete"
                    @click="removeItem($index)"
                  />
                </template>
              </el-table-column>
            </el-table>
            <el-button
              type="primary"
              :icon="Plus"
              @click="addItem"
              style="margin-top: 10px"
            >
              添加明细
            </el-button>
            <div class="total-amount">
              <strong>总金额：{{ formatCurrency(totalAmount) }}</strong>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="备注" prop="notes">
          <el-input
            v-model="formData.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Edit, Delete, View } from '@element-plus/icons-vue'
import orderApi, {
  type Order,
  type CreateOrderDto,
  type UpdateOrderDto,
  type QueryOrderDto,
  type CreateOrderItemDto,
} from '@/api/order'
import customerApi from '@/api/customer'
import productApi from '@/api/product'
import quoteApi from '@/api/quote'

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
  pageSize: 10,
  total: 0,
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const formRef = ref()
const isEdit = ref(false)
const currentId = ref<string>('')

// 表单数据
const formData = reactive<CreateOrderDto>({
  orderNumber: '',
  customerId: 0,
  quoteId: undefined,
  opportunityId: undefined,
  orderDate: '',
  deliveryDate: '',
  status: 'pending',
  notes: '',
  items: [],
})

// 可用客户、产品和报价列表
const availableCustomers = ref<Array<{ id: string; name: string }>>([])
const availableProducts = ref<Array<{ id: string; name: string; code?: string }>>([])
const availableQuotes = ref<Array<{ id: string; quoteNumber: string }>>([])

// 计算总金额
const totalAmount = computed(() => {
  return formData.items.reduce((sum, item) => {
    return sum + (item.amount || 0)
  }, 0)
})

// 表单验证规则
const formRules = {
  orderNumber: [{ required: true, message: '请输入订单编号', trigger: 'blur' }],
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  orderDate: [{ required: true, message: '请选择下单日期', trigger: 'change' }],
  items: [
    { required: true, message: '请至少添加一条订单明细', trigger: 'change' },
    {
      validator: (rule: any, value: any, callback: any) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少添加一条订单明细'))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
}

// 获取状态类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
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

// 格式化货币
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
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

// 加载客户列表
const loadCustomers = async () => {
  try {
    const response = await customerApi.getList({ page: 1, limit: 1000 })
    if (response.code === 200) {
      availableCustomers.value = response.data.customers
    }
  } catch (error) {
    console.error('加载客户列表失败:', error)
  }
}

// 加载产品列表
const loadProducts = async () => {
  try {
    const response = await productApi.getList({ page: 1, limit: 1000, status: 'active' })
    if (response.code === 200) {
      availableProducts.value = response.data.products
    }
  } catch (error) {
    console.error('加载产品列表失败:', error)
  }
}

// 加载报价列表
const loadQuotes = async () => {
  try {
    const response = await quoteApi.getList({ page: 1, limit: 1000 })
    if (response.code === 200) {
      availableQuotes.value = response.data.quotes
    }
  } catch (error) {
    console.error('加载报价列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadOrders()
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
  loadOrders()
}

// 当前页变化
const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadOrders()
}

// 新增订单
const goToCreate = () => {
  isEdit.value = false
  dialogTitle.value = '新增订单'
  resetForm()
  dialogVisible.value = true
}

// 查看订单
const viewOrder = async (row: Order) => {
  try {
    const response = await orderApi.getDetail(row.id)
    if (response.code === 200) {
      // 可以打开详情对话框或跳转到详情页
      ElMessage.info('查看订单详情功能待实现')
    }
  } catch (error) {
    console.error('获取订单详情失败:', error)
    ElMessage.error('获取订单详情失败')
  }
}

// 编辑订单
const editOrder = async (row: Order) => {
  try {
    const response = await orderApi.getDetail(row.id)
    if (response.code === 200) {
      isEdit.value = true
      currentId.value = row.id
      dialogTitle.value = '编辑订单'
      const order = response.data
      Object.assign(formData, {
        orderNumber: order.orderNumber,
        customerId: parseInt(order.customerId),
        quoteId: order.quoteId ? parseInt(order.quoteId) : undefined,
        opportunityId: order.opportunityId ? parseInt(order.opportunityId) : undefined,
        orderDate: order.orderDate,
        deliveryDate: order.deliveryDate || '',
        status: order.status,
        notes: order.notes || '',
        items: (order.items || []).map((item: any) => ({
          productId: parseInt(item.productId),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          amount: item.amount,
          notes: item.notes || '',
        })),
      })
      dialogVisible.value = true
    }
  } catch (error) {
    console.error('获取订单详情失败:', error)
    ElMessage.error('获取订单详情失败')
  }
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

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    orderNumber: '',
    customerId: 0,
    quoteId: undefined,
    opportunityId: undefined,
    orderDate: '',
    deliveryDate: '',
    status: 'pending',
    notes: '',
    items: [],
  })
  formRef.value?.clearValidate()
}

// 添加明细项
const addItem = () => {
  formData.items.push({
    productId: 0,
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    notes: '',
  })
}

// 移除明细项
const removeItem = (index: number) => {
  formData.items.splice(index, 1)
}

// 计算明细项金额
const calculateItemAmount = (index: number) => {
  const item = formData.items[index]
  if (item.quantity && item.unitPrice) {
    const discount = item.discount || 0
    item.amount = item.quantity * item.unitPrice * (1 - discount / 100)
  }
}

// 客户变化时加载相关报价（可选）
const handleCustomerChange = () => {
  // 可以在这里加载该客户的报价列表
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    submitLoading.value = true

    // 确保所有明细项都有金额
    formData.items.forEach((item, index) => {
      calculateItemAmount(index)
    })

    if (isEdit.value) {
      await orderApi.update(currentId.value, formData)
      ElMessage.success('更新成功')
    } else {
      await orderApi.create(formData)
      ElMessage.success('创建成功')
    }

    dialogVisible.value = false
    loadOrders()
  } catch (error: any) {
    if (error !== false) {
      console.error('提交失败:', error)
      ElMessage.error(error.message || '提交失败')
    }
  } finally {
    submitLoading.value = false
  }
}

// 初始化
onMounted(() => {
  loadOrders()
  loadCustomers()
  loadProducts()
  loadQuotes()
})
</script>

<style scoped lang="scss">
@use '@/styles/common/table-layout.scss';

.order-management {
  @extend .table-page;
}

.order-items-section {
  width: 100%;
}

.total-amount {
  margin-top: 10px;
  text-align: right;
  font-size: 16px;
  color: var(--el-color-primary);
}
</style>

