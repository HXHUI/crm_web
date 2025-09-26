<template>
  <div class="table-page">
    <div class="main-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :model="searchForm" :inline="true" size="default" class="search-form">
            <el-form-item label="联系人姓名">
              <el-input
                v-model="searchForm.name"
                placeholder="请输入联系人姓名"
                clearable
                style="width: 200px"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input
                v-model="searchForm.email"
                placeholder="请输入邮箱"
                clearable
                style="width: 200px"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input
                v-model="searchForm.phone"
                placeholder="请输入手机号"
                clearable
                style="width: 200px"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item label="联系人类型">
              <el-select
                v-model="searchForm.type"
                placeholder="请选择类型"
                clearable
                style="width: 150px"
              >
                <el-option
                  v-for="type in typeOptions"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="关联客户">
              <el-select
                v-model="searchForm.customerId"
                placeholder="请选择客户"
                clearable
                filterable
                style="width: 200px"
              >
                <el-option
                  v-for="customer in customerOptions"
                  :key="customer.id"
                  :label="customer.name"
                  :value="customer.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">搜索</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" @click="goToCreate">
            <el-icon><Plus /></el-icon>
            新建联系人
          </el-button>
          <el-button
            type="danger"
            :disabled="selectedRows.length === 0"
            @click="handleBatchDelete"
          >
            <el-icon><Delete /></el-icon>
            批量删除
          </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="table-section">
        <el-table
          v-loading="loading"
          :data="tableData"
          @selection-change="handleSelectionChange"
          style="width: 100%"
          height="100%"
          border
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="name" label="姓名" min-width="120" show-overflow-tooltip />
          <el-table-column prop="position" label="职位" min-width="120" show-overflow-tooltip />
          <el-table-column prop="department" label="部门" min-width="120" show-overflow-tooltip />
          <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
          <el-table-column prop="phone" label="手机号" width="130" show-overflow-tooltip />
          <el-table-column prop="telephone" label="座机" width="130" show-overflow-tooltip />
          <el-table-column prop="type" label="类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getTypeColor(row.type)" size="small">
                {{ getTypeName(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="isPrimary" label="主要联系人" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isPrimary" type="success" size="small">是</el-tag>
              <el-tag v-else type="info" size="small">否</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="关联客户" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.customer?.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="editContact(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="deleteContact(row)">删除</el-button>
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
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新建/编辑联系人对话框 -->
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
        <el-form-item label="联系人姓名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入联系人姓名" />
        </el-form-item>
        
        <el-form-item label="职位" prop="position">
          <el-input v-model="formData.position" placeholder="请输入职位" />
        </el-form-item>
        
        <el-form-item label="部门" prop="department">
          <el-input v-model="formData.department" placeholder="请输入部门" />
        </el-form-item>
        
        <el-form-item label="联系人类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择类型" style="width: 100%">
            <el-option
              v-for="type in typeOptions"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>
        
        <el-form-item label="座机" prop="telephone">
          <el-input v-model="formData.telephone" placeholder="请输入座机" />
        </el-form-item>
        
        <el-form-item label="关联客户" prop="customerId">
          <el-select
            v-model="formData.customerId"
            placeholder="请选择客户"
            filterable
            style="width: 100%"
            :disabled="isEdit"
          >
            <el-option
              v-for="customer in customerOptions"
              :key="customer.id"
              :label="customer.name"
              :value="customer.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="是否主要联系人" prop="isPrimary">
          <el-switch v-model="formData.isPrimary" />
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
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import contactApi, { type Contact, type CreateContactDto, type UpdateContactDto } from '@/api/contact'
import customerApi from '@/api/customer'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const tableData = ref<Contact[]>([])
const selectedRows = ref<Contact[]>([])
const customerOptions = ref<any[]>([])

// 搜索表单
const searchForm = reactive({
  name: '',
  email: '',
  phone: '',
  type: '',
  customerId: ''
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const currentId = ref('')

// 表单
const formRef = ref()
const formData = reactive<CreateContactDto & UpdateContactDto>({
  name: '',
  position: '',
  department: '',
  email: '',
  phone: '',
  telephone: '',
  type: 'secondary',
  isPrimary: false,
  notes: '',
  customerId: ''
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入联系人姓名', trigger: 'blur' }
  ],
  email: [
    { 
      validator: (rule: any, value: string, callback: Function) => {
        if (!value || value.trim() === '') {
          callback()
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            callback(new Error('请输入有效的邮箱地址'))
          } else {
            callback()
          }
        }
      }, 
      trigger: 'blur' 
    }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号', trigger: 'blur' }
  ],
  customerId: [
    { required: true, message: '请选择关联客户', trigger: 'change' }
  ]
}

// 联系人类型选项
const typeOptions = [
  { label: '主要联系人', value: 'primary' },
  { label: '次要联系人', value: 'secondary' },
  { label: '决策者', value: 'decision_maker' },
  { label: '影响者', value: 'influencer' },
  { label: '使用者', value: 'user' }
]

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取类型颜色
const getTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    primary: 'success',
    secondary: 'info',
    decision_maker: 'warning',
    influencer: 'danger',
    user: 'info'
  }
  return colorMap[type] || 'info'
}

// 获取类型名称
const getTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    primary: '主要联系人',
    secondary: '次要联系人',
    decision_maker: '决策者',
    influencer: '影响者',
    user: '使用者'
  }
  return typeMap[type] || type
}

// 获取联系人列表
const getContactList = async () => {
  try {
    loading.value = true
    const params = {
      ...searchForm,
      page: Number(pagination.page),
      limit: Number(pagination.limit)
    }
    
    // 过滤掉空字符串参数
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })
    
    console.log('Loading contacts with params:', params)
    const response = await contactApi.getList(params)
    console.log('Contact API response:', response)
    
    tableData.value = response.data.contacts
    pagination.total = response.data.total
    console.log('Contacts loaded:', tableData.value)
  } catch (error) {
    console.error('获取联系人列表失败:', error)
    ElMessage.error('获取联系人列表失败')
  } finally {
    loading.value = false
  }
}

// 获取客户列表
const getCustomerList = async () => {
  try {
    const response = await customerApi.getList({ page: 1, limit: 1000 })
    customerOptions.value = response.data.customers
  } catch (error) {
    console.error('获取客户列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  getContactList()
}

// 重置
const handleReset = () => {
  searchForm.name = ''
  searchForm.email = ''
  searchForm.phone = ''
  searchForm.type = ''
  searchForm.customerId = ''
  pagination.page = 1
  getContactList()
}

// 新建联系人
const goToCreate = () => {
  dialogTitle.value = '新建联系人'
  isEdit.value = false
  currentId.value = ''
  Object.assign(formData, {
    name: '',
    position: '',
    department: '',
    email: '',
    phone: '',
    telephone: '',
    type: 'secondary',
    isPrimary: false,
    notes: '',
    customerId: ''
  })
  dialogVisible.value = true
  formRef.value?.clearValidate()
}

// 编辑联系人
const editContact = (contact: Contact) => {
  dialogTitle.value = '编辑联系人'
  isEdit.value = true
  currentId.value = contact.id
  Object.assign(formData, {
    name: contact.name,
    position: contact.position || '',
    department: contact.department || '',
    email: contact.email || '',
    phone: contact.phone || '',
    telephone: contact.telephone || '',
    type: contact.type,
    isPrimary: contact.isPrimary,
    notes: contact.notes || '',
    customerId: contact.customerId
  })
  dialogVisible.value = true
  formRef.value?.clearValidate()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (isEdit.value) {
      // 编辑时排除customerId字段
      const { customerId, ...updateData } = formData
      await contactApi.update(currentId.value, updateData)
      ElMessage.success('联系人更新成功')
    } else {
      await contactApi.create(formData as CreateContactDto)
      ElMessage.success('联系人创建成功')
    }
    
    dialogVisible.value = false
    getContactList()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error(isEdit.value ? '联系人更新失败' : '联系人创建失败')
  } finally {
    submitting.value = false
  }
}

// 删除联系人
const deleteContact = async (contact: Contact) => {
  try {
    await ElMessageBox.confirm(`确定要删除联系人"${contact.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await contactApi.delete(contact.id)
    ElMessage.success('联系人删除成功')
    getContactList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除联系人失败:', error)
      ElMessage.error('联系人删除失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个联系人吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const ids = selectedRows.value.map(row => row.id)
    await contactApi.deleteBatch(ids)
    ElMessage.success('批量删除成功')
    getContactList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 选择变化
const handleSelectionChange = (selection: Contact[]) => {
  selectedRows.value = selection
}

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  getContactList()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  getContactList()
}

// 初始化
onMounted(() => {
  getContactList()
  getCustomerList()
})
</script>

<style lang="scss" scoped>
@use '@/styles/common/table-layout.scss';
</style>
