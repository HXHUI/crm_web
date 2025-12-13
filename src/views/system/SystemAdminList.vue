<template>
  <div class="system-admin-management">
    <div class="main-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item>
              <el-input
                v-model="searchForm.search"
                placeholder="搜索用户名、邮箱或手机号"
                clearable
                @keyup.enter="handleSearch"
                style="width: 250px"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
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
            添加系统管理员
          </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="table-section">
        <el-table
          :data="tableData"
          v-loading="loading"
          style="width: 100%"
          border
        >
          <el-table-column prop="username" label="用户名" min-width="120" />
          <el-table-column prop="email" label="邮箱" min-width="200" />
          <el-table-column prop="phone" label="手机号" width="150" />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                @click="handleRemove(row)"
                :disabled="row.id === currentUserId"
              >
                移除权限
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

    <!-- 添加系统管理员对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="添加系统管理员"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="formData.username"
            placeholder="请输入用户名"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="formData.phone"
            placeholder="请输入手机号"
            maxlength="11"
          />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="formData.email"
            placeholder="请输入邮箱（可选）"
            type="email"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            show-password
            maxlength="50"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="formData.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
            maxlength="50"
          />
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
import { Plus, Search, Refresh, Delete } from '@element-plus/icons-vue'
import systemAdminApi, { type SystemAdmin, type CreateSystemAdminDto } from '@/api/system-admin'
import { useAuthStore } from '@/stores/modules/auth'

const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref<SystemAdmin[]>([])
const dialogVisible = ref(false)
const formRef = ref()

// 搜索表单
const searchForm = reactive({
  search: '',
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
const formData = reactive<CreateSystemAdminDto & { confirmPassword?: string }>({
  username: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度在 6 到 50 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== formData.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 当前用户ID（用于禁用移除自己的按钮）
const currentUserId = computed(() => authStore.currentUser?.id?.toString())

// 方法
const loadData = async () => {
  try {
    loading.value = true
    const params = {
      ...searchForm,
      page: pagination.page,
      limit: pagination.limit
    }
    const response = await systemAdminApi.getList(params)
    
    if (response.code === 200) {
      tableData.value = response.data.users
      pagination.total = response.data.total
    }
  } catch (error: any) {
    console.error('加载系统管理员列表失败:', error)
    ElMessage.error(error.response?.data?.message || '加载系统管理员列表失败')
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
    page: 1,
    limit: 50
  })
  pagination.page = 1
  loadData()
}

const handleCreate = () => {
  Object.assign(formData, {
    username: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    const { confirmPassword, ...createData } = formData
    await systemAdminApi.create(createData)
    
    ElMessage.success('添加系统管理员成功')
    dialogVisible.value = false
    loadData()
  } catch (error: any) {
    if (error !== false) { // 表单验证失败时 error 为 false
      console.error('提交失败:', error)
      ElMessage.error(error.response?.data?.message || '添加系统管理员失败')
    }
  } finally {
    submitLoading.value = false
  }
}

const handleRemove = async (row: SystemAdmin) => {
  try {
    await ElMessageBox.confirm(
      `确定要移除用户 "${row.username}" 的系统管理员权限吗？`,
      '确认移除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await systemAdminApi.remove(row.id)
    ElMessage.success('移除系统管理员权限成功')
    loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('移除失败:', error)
      ElMessage.error(error.response?.data?.message || '移除系统管理员权限失败')
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

.system-admin-management {
  @extend .table-page;
}
</style>

