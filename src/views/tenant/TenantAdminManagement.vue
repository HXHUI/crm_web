<template>
  <div class="table-page">
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
            添加租户管理员
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
          <el-table-column prop="email" label="邮箱" min-width="200">
            <template #default="{ row }">
              {{ row.email || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="phone" label="手机号" width="150">
            <template #default="{ row }">
              {{ row.phone || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="roleName" label="角色" width="120">
            <template #default="{ row }">
              <el-tag type="primary">{{ row.roleName }}</el-tag>
            </template>
          </el-table-column>
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
                :disabled="row.memberId === currentMemberId"
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

    <!-- 添加租户管理员对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="添加租户管理员"
      width="800px"
      :close-on-click-modal="false"
    >
      <div style="margin-bottom: 16px;">
        <el-input
          v-model="memberSearch"
          placeholder="搜索成员（用户名、邮箱、手机号）"
          clearable
          @input="handleMemberSearch"
          style="width: 300px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <el-table
        :data="availableMembers"
        v-loading="memberLoading"
        style="width: 100%"
        border
        max-height="400"
        @row-click="handleSelectMember"
      >
        <el-table-column type="selection" width="55" :selectable="checkSelectable" />
        <el-table-column prop="user.username" label="用户名" min-width="120" />
        <el-table-column prop="user.email" label="邮箱" min-width="200">
          <template #default="{ row }">
            {{ row.user?.email || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="user.phone" label="手机号" width="150">
          <template #default="{ row }">
            {{ row.user?.phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="position" label="职位" width="120">
          <template #default="{ row }">
            {{ row.position || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
             </el-tag>
           </template>
         </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit" :disabled="!selectedMemberId">
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
import tenantAdminApi, { type TenantAdmin, type CreateTenantAdminDto } from '@/api/tenant-admin'
import type { Member } from '@/api/member'
import { useAuthStore } from '@/stores/modules/auth'

const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const memberLoading = ref(false)
const tableData = ref<TenantAdmin[]>([])
const dialogVisible = ref(false)
const availableMembers = ref<Member[]>([])
const memberSearch = ref('')
const selectedMemberId = ref<string | number | null>(null)

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

// 当前成员ID（用于禁用移除自己的按钮）
const currentMemberId = computed(() => authStore.currentMember?.id?.toString())

// 方法
const loadData = async () => {
  try {
    loading.value = true
    const params = {
      ...searchForm,
      page: pagination.page,
      limit: pagination.limit
    }
    const response = await tenantAdminApi.getList(params)
    
    if (response.code === 200) {
      tableData.value = response.data.admins
      pagination.total = response.data.total
    }
  } catch (error: any) {
    console.error('加载租户管理员列表失败:', error)
    ElMessage.error(error.response?.data?.message || '加载租户管理员列表失败')
  } finally {
    loading.value = false
  }
}

const loadAvailableMembers = async () => {
  try {
    memberLoading.value = true
    const params: any = {}
    if (memberSearch.value) {
      params.search = memberSearch.value
    }
    const response = await tenantAdminApi.getAvailableMembers(params)
    
    if (response.code === 200) {
      availableMembers.value = response.data.members
    }
  } catch (error: any) {
    console.error('加载可用成员列表失败:', error)
    ElMessage.error(error.response?.data?.message || '加载可用成员列表失败')
  } finally {
    memberLoading.value = false
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

const handleCreate = async () => {
  selectedMemberId.value = null
  memberSearch.value = ''
  dialogVisible.value = true
  await loadAvailableMembers()
}

const handleMemberSearch = () => {
  loadAvailableMembers()
}

const handleSelectMember = (row: Member) => {
  selectedMemberId.value = row.id
}

const checkSelectable = (row: Member) => {
  // 不能选择已经是租户管理员的成员
  return !tableData.value.some(admin => admin.memberId === row.id.toString())
}

const handleSubmit = async () => {
  if (!selectedMemberId.value) {
    ElMessage.warning('请选择要添加的成员')
    return
  }
  
  try {
    submitLoading.value = true
    
    const createData: CreateTenantAdminDto = {
      memberId: selectedMemberId.value.toString()
    }
    
    await tenantAdminApi.create(createData)
    
    ElMessage.success('添加租户管理员成功')
    dialogVisible.value = false
    loadData()
  } catch (error: any) {
    console.error('提交失败:', error)
    ElMessage.error(error.response?.data?.message || '添加租户管理员失败')
  } finally {
    submitLoading.value = false
  }
}

const handleRemove = async (row: TenantAdmin) => {
  try {
    await ElMessageBox.confirm(
      `确定要移除用户 "${row.username}" 的租户管理员权限吗？`,
      '确认移除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await tenantAdminApi.remove(row.memberId)
    ElMessage.success('移除租户管理员权限成功')
    loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('移除失败:', error)
      ElMessage.error(error.response?.data?.message || '移除租户管理员权限失败')
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

<style lang="scss" scoped>
@use '@/styles/common/table-layout.scss';

.content-section {
  padding: 0;
}

.content-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 24px 0;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.tenant-admin-management {
  @extend .table-page;
}
</style>

