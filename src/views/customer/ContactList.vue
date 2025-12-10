<template>
  <div class="table-page">
    <div class="main-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :model="searchForm" :inline="true" size="default" class="search-form">
            <el-form-item>
              <el-input
                v-model="searchForm.search"
                placeholder="请输入联系人姓名、邮箱或手机号"
                clearable
                style="width: 250px"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item>
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
            <el-form-item>
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
          <el-table-column prop="name" label="姓名" min-width="120" show-overflow-tooltip>
            <template #default="{ row }">
              <el-link type="primary" @click="openContactDrawer(row)">{{ row.name }}</el-link>
            </template>
          </el-table-column>
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
        
        <el-form-item label="上级联系人" prop="parentId">
          <el-select
            v-model="formData.parentId"
            placeholder="请选择上级联系人（可选）"
            filterable
            clearable
            style="width: 100%"
            :disabled="!formData.customerId"
          >
            <el-option
              v-for="contact in parentContactOptions"
              :key="contact.id"
              :label="`${contact.name}${contact.position ? ' - ' + contact.position : ''}`"
              :value="contact.id"
            />
          </el-select>
          <div class="form-item-tip" style="font-size: 12px; color: #909399; margin-top: 4px;">
            选择同一客户下的其他联系人作为上级
          </div>
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

    <!-- 联系人详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      direction="rtl"
      size="60%"
      :with-header="false"
      class="detail-drawer"
      :before-close="handleDrawerClose"
    >
      <div v-if="selectedContact" class="detail-layout">
        <!-- 左侧导航 -->
        <div class="left-nav" :class="{ collapsed: menuCollapsed }">
          <!-- 收缩/展开按钮 -->
          <div class="menu-toggle" @click="menuCollapsed = !menuCollapsed">
            <el-icon>
              <Fold v-if="!menuCollapsed" />
              <Expand v-else />
            </el-icon>
          </div>
          <ul class="side-menu with-timeline">
            <!-- 顺序：基本信息、活动记录、拜访记录 -->
            <li
              class="side-item"
              :class="{ active: activeTab === 'basic' }"
              @click="handleNavClick('basic')"
            >
              <span class="item-btn" :title="menuCollapsed ? '基本信息' : ''">
                <el-icon class="item-icon"><User /></el-icon>
                <span v-show="!menuCollapsed" class="item-text">基本信息</span>
              </span>
            </li>
            <li
              class="side-item"
              :class="{ active: activeTab === 'activities' }"
              @click="handleNavClick('activities')"
            >
              <span class="item-btn" :title="menuCollapsed ? '活动记录' : ''">
                <el-icon class="item-icon"><Clock /></el-icon>
                <span v-show="!menuCollapsed" class="item-text">活动记录</span>
              </span>
            </li>
            <li
              class="side-item"
              :class="{ active: activeTab === 'visits' }"
              @click="handleNavClick('visits')"
            >
              <span class="item-btn" :title="menuCollapsed ? '拜访记录' : ''">
                <el-icon class="item-icon"><Location /></el-icon>
                <span v-show="!menuCollapsed" class="item-text">拜访记录</span>
              </span>
            </li>
          </ul>
        </div>

        <!-- 右侧内容 -->
        <div class="right-content">
          <!-- 可滚动内容区域（包含基本信息和各业务模块） -->
          <div class="dynamic-content-section detail-scroll-container" ref="detailContentRef">
            <!-- 基本信息 -->
            <el-card id="contact-section-basic" shadow="never" class="section-card basic-info-section detail-section">
              <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <h3 class="section-title" style="margin: 0">基本信息</h3>
                  <div class="action-buttons">
                    <el-button type="primary" :icon="Edit" @click="openEditContact">编辑</el-button>
                  </div>
                </div>
              </template>
              <div class="detail-header">
                <div class="detail-title">
                  <h2>{{ selectedContact.name }}</h2>
                  <el-tag
                    v-if="selectedContact.type"
                    :type="getTypeColor(selectedContact.type)"
                    size="small"
                  >
                    {{ getTypeName(selectedContact.type) }}
                  </el-tag>
                </div>
                <div class="detail-meta">
                  <div class="meta-item">
                    <span class="meta-label">关联客户:</span>
                    <span class="meta-value">{{ selectedContact.customer?.name || '-' }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">是否主联系人:</span>
                    <span class="meta-value">
                      <el-tag :type="selectedContact.isPrimary ? 'success' : 'info'" size="small">
                        {{ selectedContact.isPrimary ? '是' : '否' }}
                      </el-tag>
                    </span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">创建时间:</span>
                    <span class="meta-value">{{ formatDate((selectedContact as any).createdAt) }}</span>
                  </div>
                </div>
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <label>职位：</label>
                  <span>{{ selectedContact.position || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>部门：</label>
                  <span>{{ selectedContact.department || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>邮箱：</label>
                  <span>{{ selectedContact.email || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>手机号：</label>
                  <span>{{ selectedContact.phone || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>座机：</label>
                  <span>{{ selectedContact.telephone || '-' }}</span>
                </div>
                <div class="info-item full-width">
                  <label>备注：</label>
                  <span class="description">{{ selectedContact.notes || '-' }}</span>
                </div>
              </div>
            </el-card>

            <!-- 活动记录内容 -->
            <el-card shadow="never" id="contact-section-activities" class="tab-content detail-section section-card">
              <template #header>
                <h3 class="section-title" style="margin: 0">活动记录</h3>
              </template>
              <div class="list-padding">
                <ActivityList
                  v-if="selectedContact.id"
                  related-to-type="contact"
                  :related-to-id="String(selectedContact.id)"
                />
              </div>
            </el-card>

            <!-- 拜访记录内容 -->
            <el-card shadow="never" id="contact-section-visits" class="tab-content detail-section section-card">
              <template #header>
                <h3 class="section-title" style="margin: 0">拜访记录</h3>
              </template>
              <div class="list-padding">
                <ContactVisitList
                  v-if="selectedContact.id"
                  related-to-type="contact"
                  :related-to-id="String(selectedContact.id)"
                />
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, onBeforeUnmount, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Clock, Location, User, Fold, Expand, Edit } from '@element-plus/icons-vue'
import contactApi, { type Contact, type CreateContactDto, type UpdateContactDto } from '@/api/contact'
import customerApi from '@/api/customer'
import ActivityList from '@/components/activity/ActivityList.vue'
import ContactVisitList from '@/components/visit/ContactVisitList.vue'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const tableData = ref<Contact[]>([])
const selectedRows = ref<Contact[]>([])
const customerOptions = ref<any[]>([])
const parentContactOptions = ref<Contact[]>([])

// 搜索表单
const searchForm = reactive({
  search: '',
  type: '',
  customerId: ''
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 50,
  total: 0
})

// 详情抽屉
const drawerVisible = ref(false)
const activeTab = ref<'basic' | 'activities' | 'visits'>('basic')
const selectedContact = ref<Contact | null>(null)
const menuCollapsed = ref(false)
const detailContentRef = ref<HTMLElement | null>(null)

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
  customerId: '',
  parentId: undefined
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

// 获取客户下的联系人列表（用于上级联系人选择）
const getContactsByCustomer = async (customerId: string | number) => {
  if (!customerId) {
    parentContactOptions.value = []
    return
  }
  
  try {
    const response = await contactApi.getContactsByCustomer(Number(customerId))
    // 编辑时，排除当前联系人自己
    const contacts = isEdit.value && currentId.value
      ? response.data.filter((c: Contact) => c.id !== currentId.value)
      : response.data
    parentContactOptions.value = contacts
  } catch (error) {
    console.error('获取客户联系人失败:', error)
    parentContactOptions.value = []
  }
}

// 客户选择变化
const handleCustomerChange = (customerId: string | number) => {
  formData.parentId = undefined // 清空上级联系人选择
  getContactsByCustomer(customerId)
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  getContactList()
}

// 重置
const handleReset = () => {
  searchForm.search = ''
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
    customerId: '',
    parentId: undefined
  })
  parentContactOptions.value = []
  dialogVisible.value = true
  formRef.value?.clearValidate()
}

// 编辑联系人
const editContact = async (contact: Contact) => {
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
    customerId: contact.customerId,
    parentId: (contact as any).parentId || undefined
  })
  
  // 加载该客户下的其他联系人（排除自己）
  if (contact.customerId) {
    await getContactsByCustomer(contact.customerId)
  }
  
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

// 打开联系人详情抽屉
const openContactDrawer = (contact: Contact) => {
  selectedContact.value = contact
  activeTab.value = 'basic'
  drawerVisible.value = true
  // 等待DOM更新后滚动到基本信息
  nextTick(() => {
    scrollToSection('basic')
  })
}

// 关闭抽屉
const handleDrawerClose = () => {
  drawerVisible.value = false
  selectedContact.value = null
  activeTab.value = 'basic'
}

// 锚点导航点击处理
const handleNavClick = (tab: 'basic' | 'activities' | 'visits') => {
  activeTab.value = tab
  scrollToSection(tab)
}

// 滚动到指定section
const scrollToSection = (tab: string) => {
  nextTick(() => {
    const sectionId = `contact-section-${tab}`
    const section = document.getElementById(sectionId)
    if (section && detailContentRef.value) {
      const container = detailContentRef.value
      const sectionTop = section.offsetTop - container.offsetTop - 20 // 20px offset
      container.scrollTo({
        top: sectionTop,
        behavior: 'smooth',
      })
    }
  })
}

// 处理详情页滚动，更新activeTab
const handleDetailScroll = () => {
  if (!detailContentRef.value) return

  const container = detailContentRef.value
  const scrollTop = container.scrollTop + 100 // 100px offset for header

  const sections = [
    { id: 'contact-section-basic', tab: 'basic' },
    { id: 'contact-section-activities', tab: 'activities' },
    { id: 'contact-section-visits', tab: 'visits' },
  ]

  for (let i = sections.length - 1; i >= 0; i--) {
    const section = document.getElementById(sections[i].id)
    if (section) {
      const sectionTop = section.offsetTop - container.offsetTop
      if (scrollTop >= sectionTop) {
        activeTab.value = sections[i].tab as any
        break
      }
    }
  }
}

// 编辑联系人
const openEditContact = () => {
  if (!selectedContact.value) return
  dialogTitle.value = '编辑联系人'
  isEdit.value = true
  currentId.value = String(selectedContact.value.id)
  Object.assign(formData, {
    name: selectedContact.value.name,
    position: selectedContact.value.position || '',
    department: selectedContact.value.department || '',
    email: selectedContact.value.email || '',
    phone: selectedContact.value.phone || '',
    telephone: selectedContact.value.telephone || '',
    type: selectedContact.value.type || 'secondary',
    isPrimary: selectedContact.value.isPrimary || false,
    notes: selectedContact.value.notes || '',
    customerId: selectedContact.value.customerId ? String(selectedContact.value.customerId) : '',
    parentId: selectedContact.value.parentId,
  })
  dialogVisible.value = true
}

// 监听抽屉显示状态，添加滚动监听
watch(drawerVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      if (detailContentRef.value) {
        detailContentRef.value.addEventListener('scroll', handleDetailScroll)
      }
    })
  } else {
    if (detailContentRef.value) {
      detailContentRef.value.removeEventListener('scroll', handleDetailScroll)
    }
  }
})

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

onBeforeUnmount(() => {
  // 移除滚动监听
  if (detailContentRef.value) {
    detailContentRef.value.removeEventListener('scroll', handleDetailScroll)
  }
})
</script>

<style lang="scss" scoped>
@use '@/styles/common/table-layout.scss';
</style>

<style lang="scss">
@use '@/styles/common/detail-drawer.scss';

// 联系人详情页特定样式
.detail-layout {
  .right-content {
    height: 100%;

    .dynamic-content-section.detail-scroll-container {
      height: 100%;
      overflow-y: auto;
      padding-right: 8px;
      scroll-behavior: smooth;
    }

    .detail-section {
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-card {
        border: 1px solid #ebeef5;
        border-radius: 4px;

        :deep(.el-card__header) {
          padding: 16px 20px;
          border-bottom: 1px solid #ebeef5;
          background-color: #fafafa;
        }

        :deep(.el-card__body) {
          padding: 20px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
        }
      }
    }

    .basic-info-section {
      .detail-header {
        margin-bottom: 20px;

        .detail-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;

          h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: #262626;
          }
        }

        .detail-meta {
          display: flex;
          align-items: center;
          gap: 24px;
          color: #666;
          font-size: 14px;
          margin-bottom: 16px;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;

            .meta-label {
              color: #999;
            }

            .meta-value {
              color: #303133;
            }
          }
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;

        .info-item {
          display: flex;
          align-items: flex-start;

          &.full-width {
            grid-column: 1 / -1;
          }

          label {
            font-weight: 500;
            color: #606266;
            min-width: 100px;
            margin-right: 8px;
            flex-shrink: 0;
          }

          span {
            color: #303133;
            word-break: break-all;
          }

          .description {
            color: #606266;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
          }
        }
      }
    }

  }
}
</style>

