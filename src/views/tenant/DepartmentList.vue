<template>
  <div class="department-list">
    <div class="page-header">
      <h1 class="page-title">部门管理</h1>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        新增部门
      </el-button>
    </div>
    
    <!-- 部门列表 -->
    <el-card class="table-card">
      <el-table
        :data="departments"
        v-loading="loading"
        stripe
        style="width: 100%"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="name" label="部门名称" min-width="200" />
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDepartment(row)">查看</el-button>
            <el-button type="warning" size="small" @click="editDepartment(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteDepartment(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 添加部门对话框 -->
    <el-dialog
      v-model="showAddDialog"
      title="新增部门"
      width="500px"
      @close="resetAddForm"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addRules"
        label-width="100px"
      >
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="addForm.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="上级部门" prop="parentId">
          <el-select v-model="addForm.parentId" placeholder="请选择上级部门" clearable style="width: 100%">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="addForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入部门描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddDepartment" :loading="addLoading">
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
import type { Department } from '@/types'

const tenantStore = useTenantStore()

// 部门列表
const departments = ref<Department[]>([])
const loading = ref(false)

// 添加部门对话框
const showAddDialog = ref(false)
const addFormRef = ref<FormInstance>()
const addForm = reactive({
  name: '',
  description: '',
  parentId: ''
})
const addLoading = ref(false)

// 添加部门表单验证规则
const addRules: FormRules = {
  name: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { min: 2, max: 50, message: '部门名称长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 加载部门列表
const loadDepartments = async () => {
  try {
    loading.value = true
    // 这里应该调用实际的API
    // 现在使用模拟数据
    departments.value = [
      {
        id: '1',
        name: '技术部',
        description: '负责产品研发和技术支持',
        parentId: undefined,
        tenantId: '1',
        status: 'active',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        name: '销售部',
        description: '负责客户开发和销售工作',
        parentId: undefined,
        tenantId: '1',
        status: 'active',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }
    ]
  } catch (error) {
    ElMessage.error('加载部门列表失败')
  } finally {
    loading.value = false
  }
}

// 查看部门
const viewDepartment = (department: Department) => {
  ElMessage.info('查看部门功能待实现')
}

// 编辑部门
const editDepartment = (department: Department) => {
  ElMessage.info('编辑部门功能待实现')
}

// 删除部门
const deleteDepartment = async (department: Department) => {
  try {
    await ElMessageBox.confirm(`确定要删除部门"${department.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 这里应该调用删除API
    ElMessage.success('删除成功')
    loadDepartments()
  } catch (error) {
    // 用户取消操作
  }
}

// 添加部门
const handleAddDepartment = async () => {
  if (!addFormRef.value) return
  
  try {
    const valid = await addFormRef.value.validate()
    if (!valid) return
    
    addLoading.value = true
    
    // 这里应该调用添加API
    ElMessage.success('添加成功')
    showAddDialog.value = false
    loadDepartments()
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
    description: '',
    parentId: ''
  })
  addFormRef.value?.resetFields()
}

onMounted(() => {
  loadDepartments()
})
</script>

<style scoped>
.department-list {
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
