<template>
  <div class="table-page">
    <div class="main-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :inline="true" class="search-form">
            <el-form-item>
              <el-input
                v-model="searchKeyword"
                placeholder="搜索子公司名称或描述"
                clearable
                style="width: 260px"
                @keyup.enter="handleSearch"
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
          <el-button type="primary" @click="handleCreateSubsidiary">
            <el-icon><Plus /></el-icon>
            新增子公司
          </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="table-section">
        <el-table :data="filteredSubsidiaries" v-loading="subsidiariesLoading" style="width: 100%" border>
          <el-table-column prop="name" label="公司名称" min-width="150" />
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
                {{ row.status === 'active' ? '活跃' : row.status === 'inactive' ? '非活跃' : '暂停' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="level" label="层级" width="80" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleEditSubsidiary(row)">
                编辑
              </el-button>
              <el-button type="danger" link size="small" @click="handleDeleteSubsidiary(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 创建/编辑子公司对话框 -->
    <el-dialog
      v-model="subsidiaryDialogVisible"
      :title="subsidiaryForm.id ? '编辑子公司' : '创建子公司'"
      width="600px"
    >
      <el-form
        ref="subsidiaryFormRef"
        :model="subsidiaryForm"
        :rules="subsidiaryRules"
        label-width="100px"
      >
        <el-form-item label="公司名称" prop="name">
          <el-input v-model="subsidiaryForm.name" placeholder="请输入公司名称" />
        </el-form-item>
        <el-form-item label="公司描述">
          <el-input
            v-model="subsidiaryForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入公司描述"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="subsidiaryForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="活跃" value="active" />
            <el-option label="非活跃" value="inactive" />
            <el-option label="暂停" value="suspended" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="subsidiaryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveSubsidiary" :loading="subsidiaryLoading">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/modules/auth'
import { tenantApi, type Tenant } from '@/api/tenant'

const authStore = useAuthStore()

// 租户信息
const tenantInfo = computed(() => authStore.currentTenant)
const isTenantOwner = computed(() => authStore.isTenantOwner)

const subsidiaries = ref<Tenant[]>([])
const subsidiariesLoading = ref(false)
const subsidiaryDialogVisible = ref(false)
const subsidiaryFormRef = ref<FormInstance>()
const subsidiaryForm = reactive({
  id: '',
  name: '',
  description: '',
  status: 'active' as 'active' | 'inactive' | 'suspended'
})
const subsidiaryLoading = ref(false)

// 搜索关键词
const searchKeyword = ref('')

// 过滤后的子公司列表（前端本地过滤）
const filteredSubsidiaries = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return subsidiaries.value
  return subsidiaries.value.filter((item) => {
    const name = item.name?.toLowerCase() || ''
    const desc = item.description?.toLowerCase() || ''
    return name.includes(keyword) || desc.includes(keyword)
  })
})

// 子公司表单验证规则
const subsidiaryRules: FormRules = {
  name: [
    { required: true, message: '请输入公司名称', trigger: 'blur' },
    { min: 2, max: 50, message: '公司名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 加载子公司列表
const loadSubsidiaries = async () => {
  if (!tenantInfo.value?.id || !isTenantOwner.value) return

  try {
    subsidiariesLoading.value = true
    const response = await tenantApi.getChildren(tenantInfo.value.id)
    subsidiaries.value = response.data || []
  } catch (error) {
    console.error('加载子公司列表失败:', error)
  } finally {
    subsidiariesLoading.value = false
  }
}

// 搜索（前端过滤，实际逻辑由 computed 完成）
const handleSearch = () => {
  // 这里不需要额外逻辑，输入框变化已触发 computed 重新计算
}

// 重置搜索
const handleReset = () => {
  searchKeyword.value = ''
}

// 创建子公司
const handleCreateSubsidiary = () => {
  Object.assign(subsidiaryForm, {
    id: '',
    name: '',
    description: '',
    status: 'active' as const
  })
  subsidiaryDialogVisible.value = true
}

// 编辑子公司
const handleEditSubsidiary = (row: Tenant) => {
  Object.assign(subsidiaryForm, {
    id: row.id,
    name: row.name,
    description: row.description || '',
    status: row.status
  })
  subsidiaryDialogVisible.value = true
}

// 保存子公司
const handleSaveSubsidiary = async () => {
  if (!subsidiaryFormRef.value) return

  try {
    const valid = await subsidiaryFormRef.value.validate()
    if (!valid) return

    subsidiaryLoading.value = true

    if (subsidiaryForm.id) {
      // 编辑
      await tenantApi.update(subsidiaryForm.id, {
        name: subsidiaryForm.name,
        description: subsidiaryForm.description,
        status: subsidiaryForm.status
      })
      ElMessage.success('子公司更新成功')
    } else {
      // 创建
      if (!tenantInfo.value?.id) return
      await tenantApi.create({
        name: subsidiaryForm.name,
        description: subsidiaryForm.description,
        parentId: tenantInfo.value.id,
        status: subsidiaryForm.status
      })
      ElMessage.success('子公司创建成功')
    }

    subsidiaryDialogVisible.value = false
    await loadSubsidiaries()
    await authStore.fetchCurrentUser()
  } catch (error) {
    const message = error instanceof Error ? error.message : '操作失败'
    ElMessage.error(message)
  } finally {
    subsidiaryLoading.value = false
  }
}

// 删除子公司
const handleDeleteSubsidiary = async (row: Tenant) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除子公司"${row.name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await tenantApi.delete(row.id)
    ElMessage.success('子公司删除成功')
    await loadSubsidiaries()
    await authStore.fetchCurrentUser()
  } catch (error) {
    if (error !== 'cancel') {
      const message = error instanceof Error ? error.message : '删除失败'
      ElMessage.error(message)
    }
  }
}

onMounted(() => {
  loadSubsidiaries()
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

.tenant-subsidiaries {
  @extend .table-page;
}
</style>

