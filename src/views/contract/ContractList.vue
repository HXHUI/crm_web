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
                placeholder="合同类型"
                clearable
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
                style="width: 120px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="草稿" value="draft" />
                <el-option label="待签署" value="pending_sign" />
                <el-option label="已签署" value="signed" />
                <el-option label="已生效" value="active" />
                <el-option label="已到期" value="expired" />
                <el-option label="已终止" value="terminated" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch"> 搜索 </el-button>
              <el-button :icon="Refresh" @click="handleReset"> 重置 </el-button>
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
        >
          <el-table-column prop="contractNumber" label="合同编号" min-width="150" />
          <el-table-column prop="customer.name" label="客户" width="150" />
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
          <el-table-column prop="owner.username" label="负责人" width="120" />
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="320" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" :icon="View" @click="viewContract(row)">
                查看
              </el-button>
              <el-button type="warning" size="small" :icon="Edit" @click="editContract(row)">
                编辑
              </el-button>
              <el-button
                v-if="row.status === 'signed' || row.status === 'active'"
                type="success"
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
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合同编号" prop="contractNumber">
              <el-input v-model="formData.contractNumber" placeholder="请输入合同编号" />
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
          <el-col :span="12">
            <el-form-item label="合同类型" prop="type">
              <el-select v-model="formData.type" placeholder="请选择合同类型" style="width: 100%">
                <el-option label="销售合同" value="sales" />
                <el-option label="服务合同" value="service" />
                <el-option label="维护合同" value="maintenance" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="签署日期" prop="signDate">
              <el-date-picker
                v-model="formData.signDate"
                type="date"
                placeholder="请选择签署日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生效日期" prop="effectiveDate">
              <el-date-picker
                v-model="formData.effectiveDate"
                type="date"
                placeholder="请选择生效日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="到期日期" prop="expiryDate">
              <el-date-picker
                v-model="formData.expiryDate"
                type="date"
                placeholder="请选择到期日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="草稿" value="draft" />
                <el-option label="待签署" value="pending_sign" />
                <el-option label="已签署" value="signed" />
                <el-option label="已生效" value="active" />
                <el-option label="已到期" value="expired" />
                <el-option label="已终止" value="terminated" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 合同明细 -->
        <el-form-item label="合同明细" prop="items">
          <div class="contract-items-section">
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

        <!-- 合同内容 -->
        <el-form-item label="合同内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="6"
            placeholder="请输入合同内容/条款"
          />
        </el-form-item>

        <!-- 合同附件 -->
        <el-form-item label="合同附件">
          <el-upload
            :action="uploadAction"
            :headers="uploadHeaders"
            :file-list="attachmentList"
            :on-success="handleAttachmentSuccess"
            :on-remove="handleAttachmentRemove"
            :before-upload="beforeUpload"
            multiple
            list-type="text"
          >
            <el-button type="primary" :icon="Plus">上传附件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持PDF、Word、Excel等格式，单个文件不超过10MB</div>
            </template>
          </el-upload>
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
import type { UploadFile, UploadProps } from 'element-plus'
import contractApi, {
  type Contract,
  type CreateContractDto,
  type UpdateContractDto,
  type QueryContractDto,
  type CreateContractItemDto,
} from '@/api/contract'
import customerApi from '@/api/customer'
import productApi from '@/api/product'
import orderApi from '@/api/order'

const router = useRouter()

// 搜索表单
const searchForm = reactive({
  search: '',
  type: undefined as string | undefined,
  status: undefined as string | undefined,
})

// 合同列表
const contracts = ref<Contract[]>([])
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
const formData = reactive<CreateContractDto & { contactId?: number }>({
  contractNumber: '',
  customerId: 0,
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

// 可用客户、联系人和产品列表
const availableCustomers = ref<Array<{ id: string; name: string }>>([])
const availableContacts = ref<Array<{ id: string; name: string; position?: string }>>([])
const availableProducts = ref<Array<{ id: string; name: string; code?: string }>>([])

// 附件列表
const attachmentList = ref<UploadFile[]>([])

// 上传地址
const uploadAction = computed(() => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'
  return `${baseURL}/upload`
})

// 上传请求头（包含认证token）
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return {
    Authorization: token ? `Bearer ${token}` : '',
  }
})

// 计算总金额
const totalAmount = computed(() => {
  return formData.items.reduce((sum, item) => {
    return sum + (item.amount || 0)
  }, 0)
})

// 表单验证规则
const formRules = {
  contractNumber: [{ required: true, message: '请输入合同编号', trigger: 'blur' }],
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  items: [
    { required: true, message: '请至少添加一条合同明细', trigger: 'change' },
    {
      validator: (rule: any, value: any, callback: any) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少添加一条合同明细'))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
}

// 格式化货币
const formatCurrency = (value: number) => {
  if (!value) return '¥0.00'
  return `¥${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

// 格式化日期
const formatDate = (date: string | Date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN')
}

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: 'info',
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

// 搜索
const handleSearch = () => {
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

// 新增合同
const goToCreate = () => {
  isEdit.value = false
  dialogTitle.value = '新增合同'
  resetForm()
  dialogVisible.value = true
}

// 查看合同
const viewContract = async (row: Contract) => {
  try {
    const response = await contractApi.getDetail(row.id)
    if (response.code === 200) {
      ElMessage.info('查看合同详情功能待实现')
    }
  } catch (error) {
    console.error('获取合同详情失败:', error)
    ElMessage.error('获取合同详情失败')
  }
}

// 编辑合同
const editContract = async (row: Contract) => {
  try {
    const response = await contractApi.getDetail(row.id)
    if (response.code === 200) {
      isEdit.value = true
      currentId.value = row.id
      dialogTitle.value = '编辑合同'
      const contract = response.data
      Object.assign(formData, {
        contractNumber: contract.contractNumber,
        customerId: parseInt(contract.customerId),
        contactId: contract.contactId ? parseInt(contract.contactId) : undefined,
        quoteId: contract.quoteId ? parseInt(contract.quoteId) : undefined,
        opportunityId: contract.opportunityId ? parseInt(contract.opportunityId) : undefined,
        type: contract.type,
        status: contract.status,
        signDate: contract.signDate || '',
        effectiveDate: contract.effectiveDate || '',
        expiryDate: contract.expiryDate || '',
        content: contract.content || '',
        attachments: contract.attachments || [],
        templateId: contract.templateId ? parseInt(contract.templateId) : undefined,
        notes: contract.notes || '',
        items: (contract.items || []).map((item: any) => ({
          productId: parseInt(item.productId),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          amount: item.amount,
          notes: item.notes || '',
        })),
      })
      // 加载该客户的联系人列表
      await handleCustomerChange()
      // 恢复联系人选择
      if (contract.contactId) {
        formData.contactId = parseInt(contract.contactId)
      }
      // 设置附件列表
      attachmentList.value = (contract.attachments || []).map((url: string) => ({
        name: url.split('/').pop() || '附件',
        url,
      }))
      dialogVisible.value = true
    }
  } catch (error) {
    console.error('获取合同详情失败:', error)
    ElMessage.error('获取合同详情失败')
  }
}

// 删除合同
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
    contractNumber: '',
    customerId: 0,
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
  formData.items.push({
    productId: 0,
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    amount: 0,
    notes: '',
  })
}

// 移除明细项
const removeItem = (index: number) => {
  formData.items.splice(index, 1)
  // 重新计算总金额
  formData.items.forEach((item, idx) => {
    calculateItemAmount(idx)
  })
}

// 计算明细项金额
const calculateItemAmount = (index: number) => {
  const item = formData.items[index]
  if (item && item.quantity && item.unitPrice) {
    const discount = item.discount || 0
    item.amount = item.quantity * item.unitPrice * (1 - discount / 100)
  }
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

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    submitLoading.value = true

    // 确保所有明细项都有金额
    formData.items.forEach((item, index) => {
      calculateItemAmount(index)
    })

    // 从附件列表获取URL
    formData.attachments = attachmentList.value.map((file) => file.url || file.response?.data?.url || '').filter(Boolean)

    if (isEdit.value) {
      await contractApi.update(currentId.value, formData)
      ElMessage.success('更新成功')
    } else {
      await contractApi.create(formData)
      ElMessage.success('创建成功')
    }

    dialogVisible.value = false
    loadContracts()
  } catch (error: any) {
    if (error !== false) {
      console.error('提交失败:', error)
      ElMessage.error(error.message || '提交失败')
    }
  } finally {
    submitLoading.value = false
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
  const url = file.url || (file.response?.data?.url || file.response?.url || file.response)
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

// 初始化
onMounted(() => {
  loadContracts()
  loadCustomers()
  loadProducts()
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
  margin-top: 10px;
  text-align: right;
  font-size: 16px;
  color: var(--el-color-primary);
}
</style>

