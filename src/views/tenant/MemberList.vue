<template>
  <div class="member-list">
    <div class="page-header">
      <h1 class="page-title">成员管理</h1>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加成员
      </el-button>
    </div>
    
    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="用户名">
          <el-input
            v-model="searchForm.username"
            placeholder="请输入用户名"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input
            v-model="searchForm.email"
            placeholder="请输入邮箱"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="活跃" value="active" />
            <el-option label="非活跃" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 成员列表 -->
    <el-card class="table-card">
      <el-table
        :data="members"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="user.username" label="用户名" min-width="120" />
        <el-table-column prop="user.email" label="邮箱" min-width="200" />
        <el-table-column prop="user.phone" label="电话" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '活跃' : '非活跃' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="加入时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewMember(row)">查看</el-button>
            <el-button type="warning" size="small" @click="editMember(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="removeMember(row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
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
    </el-card>
    
    <!-- 添加成员对话框 -->
    <el-dialog
      v-model="showAddDialog"
      title="添加成员"
      width="500px"
      @close="resetAddForm"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="addForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="addForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="addForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddMember" :loading="addLoading">
          {{ addLoading ? '添加中...' : '确定' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useTenantStore } from '@/stores/modules/tenant'
import type { Member } from '@/types'

const tenantStore = useTenantStore()

// 搜索表单
const searchForm = reactive({
  username: '',
  email: '',
  status: ''
})

// 成员列表
const members = ref<Member[]>([])
const loading = ref(false)

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0
})

// 添加成员对话框
const showAddDialog = ref(false)
const addFormRef = ref<FormInstance>()
const addForm = reactive({
  username: '',
  email: '',
  password: ''
})
const addLoading = ref(false)

// 添加成员表单验证规则
const addRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 加载成员列表
const loadMembers = async () => {
  try {
    loading.value = true
    // 这里应该调用实际的API
    // 现在使用模拟数据
    members.value = [
      {
        id: '1',
        userId: '1',
        tenantId: '1',
        user: {
          id: '1',
          username: '张三',
          email: 'zhangsan@example.com',
          phone: '13800138000',
          status: 'active',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        tenant: {
          id: '1',
          name: '测试租户',
          domain: 'test.com',
          status: 'active',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        status: 'active',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        userId: '2',
        tenantId: '1',
        user: {
          id: '2',
          username: '李四',
          email: 'lisi@example.com',
          phone: '13800138001',
          status: 'active',
          createdAt: '2024-01-14T14:00:00Z',
          updatedAt: '2024-01-14T14:00:00Z'
        },
        tenant: {
          id: '1',
          name: '测试租户',
          domain: 'test.com',
          status: 'active',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        status: 'active',
        createdAt: '2024-01-14T14:00:00Z',
        updatedAt: '2024-01-14T14:00:00Z'
      }
    ]
    pagination.total = 2
  } catch (error) {
    ElMessage.error('加载成员列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadMembers()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    username: '',
    email: '',
    status: ''
  })
  handleSearch()
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadMembers()
}

// 当前页改变
const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadMembers()
}

// 查看成员
const viewMember = (member: Member) => {
  // 这里可以打开成员详情对话框
  console.log('查看成员:', member)
  ElMessage.info('查看成员功能待实现')
}

// 编辑成员
const editMember = (member: Member) => {
  // 这里可以打开编辑成员对话框
  console.log('编辑成员:', member)
  ElMessage.info('编辑成员功能待实现')
}

// 移除成员
const removeMember = async (member: Member) => {
  try {
    await ElMessageBox.confirm(`确定要移除成员"${member.user.username}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 这里应该调用移除API
    ElMessage.success('移除成功')
    loadMembers()
  } catch (error) {
    // 用户取消操作
  }
}

// 添加成员
const handleAddMember = async () => {
  if (!addFormRef.value) return
  
  try {
    const valid = await addFormRef.value.validate()
    if (!valid) return
    
    addLoading.value = true
    
    // 这里应该调用添加API
    ElMessage.success('添加成功')
    showAddDialog.value = false
    loadMembers()
  } catch (error) {
    ElMessage.error('添加失败')
  } finally {
    addLoading.value = false
  }
}

// 重置添加表单
const resetAddForm = () => {
  Object.assign(addForm, {
    username: '',
    email: '',
    password: ''
  })
  addFormRef.value?.resetFields()
}

onMounted(() => {
  loadMembers()
})
</script>

<style scoped>
.member-list {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
