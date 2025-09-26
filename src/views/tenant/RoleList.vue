<template>
  <div class="role-list">
    <div class="page-header">
      <h1 class="page-title">角色管理</h1>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        新增角色
      </el-button>
    </div>
    
    <!-- 角色列表 -->
    <el-card class="table-card">
      <el-table
        :data="roles"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="角色名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '活跃' : '非活跃' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewRole(row)">查看</el-button>
            <el-button type="warning" size="small" @click="editRole(row)">编辑</el-button>
            <el-button type="info" size="small" @click="managePermissions(row)">权限</el-button>
            <el-button type="danger" size="small" @click="deleteRole(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 添加角色对话框 -->
    <el-dialog
      v-model="showAddDialog"
      title="新增角色"
      width="500px"
      @close="resetAddForm"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addRules"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="addForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="addForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddRole" :loading="addLoading">
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
import type { Role } from '@/types'

const tenantStore = useTenantStore()

// 角色列表
const roles = ref<Role[]>([])
const loading = ref(false)

// 添加角色对话框
const showAddDialog = ref(false)
const addFormRef = ref<FormInstance>()
const addForm = reactive({
  name: '',
  description: ''
})
const addLoading = ref(false)

// 添加角色表单验证规则
const addRules: FormRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '角色名称长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 加载角色列表
const loadRoles = async () => {
  try {
    loading.value = true
    // 这里应该调用实际的API
    // 现在使用模拟数据
    roles.value = [
      {
        id: '1',
        name: '管理员',
        description: '拥有系统所有权限',
        tenantId: '1',
        status: 'active',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        name: '销售经理',
        description: '负责销售团队管理',
        tenantId: '1',
        status: 'active',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '3',
        name: '销售员',
        description: '负责客户开发和维护',
        tenantId: '1',
        status: 'active',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }
    ]
  } catch (error) {
    ElMessage.error('加载角色列表失败')
  } finally {
    loading.value = false
  }
}

// 查看角色
const viewRole = (role: Role) => {
  ElMessage.info('查看角色功能待实现')
}

// 编辑角色
const editRole = (role: Role) => {
  ElMessage.info('编辑角色功能待实现')
}

// 管理权限
const managePermissions = (role: Role) => {
  ElMessage.info('权限管理功能待实现')
}

// 删除角色
const deleteRole = async (role: Role) => {
  try {
    await ElMessageBox.confirm(`确定要删除角色"${role.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 这里应该调用删除API
    ElMessage.success('删除成功')
    loadRoles()
  } catch (error) {
    // 用户取消操作
  }
}

// 添加角色
const handleAddRole = async () => {
  if (!addFormRef.value) return
  
  try {
    const valid = await addFormRef.value.validate()
    if (!valid) return
    
    addLoading.value = true
    
    // 这里应该调用添加API
    ElMessage.success('添加成功')
    showAddDialog.value = false
    loadRoles()
  } catch (error) {
    ElMessage.error('添加失败')
  } finally {
    addLoading.value = false
  }
}

// 重置添加表单
const resetAddForm = () => {
  Object.assign(addForm, {
    name: '',
    description: ''
  })
  addFormRef.value?.resetFields()
}

onMounted(() => {
  loadRoles()
})
</script>

<style scoped>
.role-list {
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

.table-card {
  margin-bottom: 20px;
}
</style>
