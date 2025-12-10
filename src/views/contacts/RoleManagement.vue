<template>
  <div class="role-management">
    <!-- 主容器 -->
    <div class="main-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item>
              <el-input
                v-model="searchForm.search"
                placeholder="搜索角色名称"
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
                v-model="searchForm.isActive"
                placeholder="状态筛选"
                clearable
                style="width: 120px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="启用" :value="true" />
                <el-option label="禁用" :value="false" />
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
            新建角色
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
        <el-table-column prop="name" label="角色名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="isActive" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ row.isActive ? '启用' : '禁用' }}
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
              :type="row.isActive ? 'warning' : 'success'"
              size="small"
              :icon="row.isActive ? 'Lock' : 'Unlock'"
              @click="handleToggleStatus(row)"
            >
              {{ row.isActive ? '禁用' : '启用' }}
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

    <!-- 角色表单对话框 -->
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
        <el-form-item label="角色名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入角色名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            placeholder="请输入角色描述"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="状态" prop="isActive">
          <el-switch
            v-model="formData.isActive"
            active-text="启用"
            inactive-text="禁用"
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
import { Plus, Search, Refresh, Edit, Delete } from '@element-plus/icons-vue'
import roleApi, { type Role, type CreateRoleDto, type UpdateRoleDto, type QueryRoleDto } from '@/api/role'

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref<Role[]>([])
const selectedRows = ref<Role[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()

// 搜索表单
const searchForm = reactive<QueryRoleDto>({
  search: '',
  isActive: undefined,
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
const formData = reactive<CreateRoleDto & { id?: string }>({
  name: '',
  description: '',
  isActive: true
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '角色名称长度在 2 到 50 个字符', trigger: 'blur' }
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
    const response = await roleApi.getList(params)
    
    if (response.code === 200) {
      tableData.value = response.data.roles
      pagination.total = response.data.total
    }
  } catch (error) {
    console.error('加载角色列表失败:', error)
    ElMessage.error('加载角色列表失败')
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
    isActive: undefined,
    page: 1,
    limit: 50
  })
  pagination.page = 1
  loadData()
}

const handleCreate = () => {
  dialogTitle.value = '新建角色'
  Object.assign(formData, {
    id: undefined,
    name: '',
    description: '',
    isActive: true
  })
  dialogVisible.value = true
}

const handleEdit = (row: Role) => {
  dialogTitle.value = '编辑角色'
  Object.assign(formData, {
    id: row.id,
    name: row.name,
    description: row.description || '',
    isActive: row.isActive
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
      await roleApi.update(id!, updateData as UpdateRoleDto)
      ElMessage.success('更新角色成功')
    } else {
      await roleApi.create(formData as CreateRoleDto)
      ElMessage.success('创建角色成功')
    }
    
    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleToggleStatus = async (row: Role) => {
  try {
    await roleApi.updateStatus(row.id, !row.isActive)
    ElMessage.success(`${row.isActive ? '禁用' : '启用'}角色成功`)
    loadData()
  } catch (error) {
    console.error('更新状态失败:', error)
  }
}

const handleDelete = async (row: Role) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${row.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await roleApi.delete(row.id)
    ElMessage.success('删除角色成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除角色失败:', error)
    }
  }
}

const handleSelectionChange = (selection: Role[]) => {
  selectedRows.value = selection
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个角色吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const ids = selectedRows.value.map(row => row.id)
    await roleApi.deleteBatch(ids)
    ElMessage.success('批量删除角色成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除角色失败:', error)
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

.role-management {
  @extend .table-page;
}
</style>