<template>
  <div class="tenant-management">
    <!-- 主容器 -->
    <div class="main-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item>
              <el-input
                v-model="searchForm.search"
                placeholder="搜索租户名称"
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
                placeholder="状态筛选"
                clearable
                style="width: 120px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="启用" value="active" />
                <el-option label="禁用" value="inactive" />
                <el-option label="暂停" value="suspended" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">
                搜索
              </el-button>
              <el-button :icon="Refresh" @click="handleReset">
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" :icon="Plus" @click="handleCreate">
            新建租户
          </el-button>
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
          :data="tableData"
          v-loading="loading"
          @selection-change="handleSelectionChange"
          style="width: 100%"
          border
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="name" label="租户名称" min-width="150" />
          <el-table-column prop="slug" label="租户标识" min-width="120" />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="memberCount" label="成员数量" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="info">
                {{ row.memberCount || 0 }}人
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="260" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                :icon="Edit"
                @click="handleEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                :type="row.status === 'active' ? 'warning' : 'success'"
                size="small"
                :icon="row.status === 'active' ? 'Lock' : 'Unlock'"
                @click="handleToggleStatus(row)"
              >
                {{ row.status === 'active' ? '禁用' : '启用' }}
              </el-button>
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-section">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>

    <!-- 租户表单对话框 -->
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
        <el-form-item label="租户名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入租户名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="租户标识" prop="slug">
          <el-input
            v-model="formData.slug"
            placeholder="请输入租户标识（可选，系统自动生成）"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态" style="width: 200px">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
            <el-option label="暂停" value="suspended" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Edit, Delete } from '@element-plus/icons-vue'
import tenantApi, { type Tenant, type CreateTenantDto, type UpdateTenantDto, type QueryTenantDto } from '@/api/tenant'

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref<Tenant[]>([])
const selectedRows = ref<Tenant[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()

// 搜索表单
const searchForm = reactive<QueryTenantDto>({
  search: '',
  status: undefined,
  page: 1,
  limit: 50
})

// 分页信息
const pagination = reactive({
  page: 1,
  limit: 50,
  total: 0
})

// 表单数据
const formData = reactive<CreateTenantDto & { id?: string }>({
  name: '',
  slug: '',
  status: 'active'
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入租户名称', trigger: 'blur' },
    { min: 2, max: 50, message: '租户名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 计算属性
const isEdit = computed(() => !!formData.id)

// 方法
const loadData = async () => {
  try {
    loading.value = true
    const params = {
      ...searchForm,
      page: pagination.page,
      limit: pagination.limit
    }
    const response = await tenantApi.getList(params)
    
    if (response.code === 200) {
      tableData.value = response.data.tenants
      pagination.total = response.data.total
    }
  } catch (error) {
    console.error('加载租户列表失败:', error)
    ElMessage.error('加载租户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    search: '',
    status: undefined,
    page: 1,
    limit: 50
  })
  pagination.page = 1
  loadData()
}

const handleCreate = () => {
  dialogTitle.value = '新建租户'
  Object.assign(formData, {
    id: undefined,
    name: '',
    slug: '',
    status: 'active'
  })
  dialogVisible.value = true
}

const handleEdit = (row: Tenant) => {
  dialogTitle.value = '编辑租户'
  Object.assign(formData, {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    if (isEdit.value) {
      const { id, ...updateData } = formData
      await tenantApi.update(id!, updateData as UpdateTenantDto)
      ElMessage.success('更新租户成功')
    } else {
      await tenantApi.create(formData as CreateTenantDto)
      ElMessage.success('创建租户成功')
    }
    
    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleToggleStatus = async (row: Tenant) => {
  try {
    const newStatus = row.status === 'active' ? 'inactive' : 'active'
    await tenantApi.update(row.id, { status: newStatus })
    ElMessage.success(`${row.status === 'active' ? '禁用' : '启用'}租户成功`)
    loadData()
  } catch (error) {
    console.error('更新状态失败:', error)
  }
}

const handleDelete = async (row: Tenant) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除租户 "${row.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await tenantApi.delete(row.id)
    ElMessage.success('删除租户成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除租户失败:', error)
    }
  }
}

const handleSelectionChange = (selection: Tenant[]) => {
  selectedRows.value = selection
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个租户吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 批量删除
    for (const tenant of selectedRows.value) {
      await tenantApi.delete(tenant.id)
    }
    
    ElMessage.success('批量删除租户成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除租户失败:', error)
    }
  }
}

const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  loadData()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadData()
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'inactive': return 'danger'
    case 'suspended': return 'warning'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return '启用'
    case 'inactive': return '禁用'
    case 'suspended': return '暂停'
    default: return '未知'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
@use '@/styles/common/table-layout.scss';

.tenant-management {
  @extend .table-page;
}
</style>
