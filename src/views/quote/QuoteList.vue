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
        >
          <el-table-column prop="quoteNumber" label="报价单号" min-width="150" />
          <el-table-column prop="customer.name" label="客户" width="150" />
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
              <el-button type="primary" size="small" :icon="View" @click="viewQuote(row)">
                查看
              </el-button>
              <el-button type="warning" size="small" :icon="Edit" @click="editQuote(row)">
                编辑
              </el-button>
              <el-button type="info" size="small" @click="createContractFromQuote(row)">
                创建合同
              </el-button>
              <el-button type="success" size="small" @click="createOrderFromQuote(row)">
                创建订单
              </el-button>
              <el-button type="danger" size="small" :icon="Delete" @click="deleteQuote(row)">
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

    <!-- 报价表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="1000px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报价单号" prop="quoteNumber">
              <el-input v-model="formData.quoteNumber" placeholder="请输入报价单号" />
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
            <el-form-item label="联系人" prop="contactId">
              <el-select
                v-model="formData.contactId"
                placeholder="请选择联系人（可选）"
                filterable
                clearable
                style="width: 100%"
                :disabled="!formData.customerId"
              >
                <el-option
                  v-for="contact in availableContacts"
                  :key="contact.id"
                  :label="`${contact.name}${contact.position ? ' - ' + contact.position : ''}`"
                  :value="parseInt(contact.id)"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报价日期" prop="quoteDate">
              <el-date-picker
                v-model="formData.quoteDate"
                type="date"
                placeholder="请选择报价日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效期" prop="expiryDate">
              <el-date-picker
                v-model="formData.expiryDate"
                type="date"
                placeholder="请选择有效期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态" style="width: 200px">
            <el-option label="草稿" value="draft" />
            <el-option label="已发送" value="sent" />
            <el-option label="已接受" value="accepted" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="已过期" value="expired" />
          </el-select>
        </el-form-item>

        <!-- 报价明细 -->
        <el-form-item label="报价明细" prop="items">
          <div class="quote-items-section">
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
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Edit, Delete, View } from '@element-plus/icons-vue'
import quoteApi, {
  type Quote,
  type CreateQuoteDto,
  type UpdateQuoteDto,
  type QueryQuoteDto,
  type CreateQuoteItemDto,
} from '@/api/quote'
import customerApi from '@/api/customer'
import productApi from '@/api/product'
import orderApi from '@/api/order'
import contractApi from '@/api/contract'

const router = useRouter()

// 搜索表单
const searchForm = reactive({
  search: '',
  status: undefined as string | undefined,
})

// 报价列表
const quotes = ref<Quote[]>([])
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
const formData = reactive<CreateQuoteDto & { contactId?: number }>({
  quoteNumber: '',
  customerId: 0,
  contactId: undefined,
  opportunityId: undefined,
  quoteDate: '',
  expiryDate: '',
  status: 'draft',
  notes: '',
  items: [],
})

// 可用客户、联系人和产品列表
const availableCustomers = ref<Array<{ id: string; name: string }>>([])
const availableContacts = ref<Array<{ id: string; name: string; position?: string }>>([])
const availableProducts = ref<Array<{ id: string; name: string; code?: string }>>([])

// 计算总金额
const totalAmount = computed(() => {
  return formData.items.reduce((sum, item) => {
    return sum + (item.amount || 0)
  }, 0)
})

// 表单验证规则
const formRules = {
  quoteNumber: [{ required: true, message: '请输入报价单号', trigger: 'blur' }],
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  quoteDate: [{ required: true, message: '请选择报价日期', trigger: 'change' }],
  items: [
    { required: true, message: '请至少添加一条报价明细', trigger: 'change' },
    {
      validator: (rule: any, value: any, callback: any) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少添加一条报价明细'))
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
    draft: 'info',
    sent: 'warning',
    accepted: 'success',
    rejected: 'danger',
    expired: 'default',
  }
  return typeMap[status] || 'default'
}

// 获取状态名称
const getStatusName = (status: string) => {
  const nameMap: Record<string, string> = {
    draft: '草稿',
    sent: '已发送',
    accepted: '已接受',
    rejected: '已拒绝',
    expired: '已过期',
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

// 新增报价
const goToCreate = () => {
  isEdit.value = false
  dialogTitle.value = '新增报价'
  resetForm()
  dialogVisible.value = true
}

// 查看报价
const viewQuote = async (row: Quote) => {
  try {
    const response = await quoteApi.getDetail(row.id)
    if (response.code === 200) {
      // 可以打开详情对话框或跳转到详情页
      ElMessage.info('查看报价详情功能待实现')
    }
  } catch (error) {
    console.error('获取报价详情失败:', error)
    ElMessage.error('获取报价详情失败')
  }
}

// 编辑报价
const editQuote = async (row: Quote) => {
  try {
    const response = await quoteApi.getDetail(row.id)
    if (response.code === 200) {
      isEdit.value = true
      currentId.value = row.id
      dialogTitle.value = '编辑报价'
      const quote = response.data
      Object.assign(formData, {
        quoteNumber: quote.quoteNumber,
        customerId: parseInt(quote.customerId),
        contactId: quote.contactId ? parseInt(quote.contactId) : undefined,
        opportunityId: quote.opportunityId ? parseInt(quote.opportunityId) : undefined,
        quoteDate: quote.quoteDate,
        expiryDate: quote.expiryDate || '',
        status: quote.status,
        notes: quote.notes || '',
        items: (quote.items || []).map((item: any) => ({
          productId: parseInt(item.productId),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          amount: item.amount,
          notes: item.notes || '',
        })),
      })
      // 先设置联系人ID（如果有），再加载联系人列表
      const savedContactId = quote.contactId ? parseInt(quote.contactId) : undefined
      // 加载该客户的联系人列表
      await handleCustomerChange()
      // 恢复联系人选择（在加载联系人列表后）
      if (savedContactId) {
        formData.contactId = savedContactId
      }
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

// 从报价创建订单
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

const createOrderFromQuote = async (row: Quote) => {
  try {
    await ElMessageBox.confirm('确定要从该报价创建订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    })

    const response = await orderApi.createFromQuote(row.id)
    if (response.code === 201) {
      ElMessage.success('订单创建成功')
      router.push({ name: 'Orders' })
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('创建订单失败:', error)
      ElMessage.error('创建订单失败')
    }
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    quoteNumber: '',
    customerId: 0,
    contactId: undefined,
    opportunityId: undefined,
    quoteDate: '',
    expiryDate: '',
    status: 'draft',
    notes: '',
    items: [],
  })
  availableContacts.value = []
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

// 客户变化时加载联系人
const handleCustomerChange = async () => {
  // 清空联系人选择
  formData.contactId = undefined
  availableContacts.value = []
  
  if (formData.customerId) {
    try {
      // 获取客户详情，包含联系人列表
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
      await quoteApi.update(currentId.value, formData)
      ElMessage.success('更新成功')
    } else {
      await quoteApi.create(formData)
      ElMessage.success('创建成功')
    }

    dialogVisible.value = false
    loadQuotes()
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
  loadQuotes()
  loadCustomers()
  loadProducts()
})
</script>

<style scoped lang="scss">
@use '@/styles/common/table-layout.scss';

.quote-management {
  @extend .table-page;
}

.quote-items-section {
  width: 100%;
}

.total-amount {
  margin-top: 10px;
  text-align: right;
  font-size: 16px;
  color: var(--el-color-primary);
}
</style>

