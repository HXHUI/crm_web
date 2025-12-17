<template>
  <div class="table-page" :class="{ 'embedded-mode': embedded }">
    <div class="main-container" :style="embedded ? { padding: 0 } : {}">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item>
              <el-select
                v-model="searchForm.businessType"
                placeholder="业务类型"
                clearable
                style="width: 150px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="报价" value="quote" />
                <el-option label="合同" value="contract" />
                <el-option label="订单" value="order" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch"> 搜索 </el-button>
              <el-button :icon="Refresh" @click="handleReset"> 重置 </el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" :icon="Plus" @click="handleCreate"> 新增审批流模板 </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="table-section">
        <el-table
          :data="pagedTemplates"
          v-loading="loading"
          style="width: 100%"
          border
        >
          <el-table-column prop="name" label="模板名称" width="200" />
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="businessType" label="业务类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getBusinessTypeTag(row.businessType)">
                {{ getBusinessTypeName(row.businessType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="nodes" label="节点数量" width="100" align="center">
            <template #default="{ row }">
              {{ row.nodes?.length || 0 }}
            </template>
          </el-table-column>
          <el-table-column prop="isActive" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.isActive ? 'success' : 'info'">
                {{ row.isActive ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="version" label="版本" width="80" align="center" />
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" :icon="Edit" @click="handleEdit(row)"> 编辑 </el-button>
              <el-button
                link
                :type="row.isActive ? 'warning' : 'success'"
                @click="handleToggleStatus(row)"
              >
                {{ row.isActive ? '禁用' : '启用' }}
              </el-button>
              <el-button link type="danger" :icon="Delete" @click="handleDelete(row)"> 删除 </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-section" v-if="pagination.total > 0">
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

      <!-- 编辑对话框 -->
      <WorkflowTemplateForm
        v-model="dialogVisible"
        :template="currentTemplate"
        @success="handleSuccess"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Edit, Delete } from '@element-plus/icons-vue'
import {
  getWorkflowTemplates,
  deleteWorkflowTemplate,
  updateWorkflowTemplate,
  type WorkflowTemplate,
} from '@/api/workflow'
import WorkflowTemplateForm from './components/WorkflowTemplateForm.vue'

interface Props {
  embedded?: boolean
}

withDefaults(defineProps<Props>(), {
  embedded: false,
})

// 搜索表单
const searchForm = reactive<{
  businessType?: 'quote' | 'contract' | 'order'
}>({
  businessType: undefined,
})

// 模板列表
const templates = ref<WorkflowTemplate[]>([])
const loading = ref(false)

// 分页信息（前端分页）
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

// 对话框相关
const dialogVisible = ref(false)
const currentTemplate = ref<WorkflowTemplate | null>(null)

// 获取业务类型标签
const getBusinessTypeTag = (type: string) => {
  const tagMap: Record<string, string> = {
    quote: 'primary',
    contract: 'success',
    order: 'warning',
  }
  return tagMap[type] || 'default'
}

// 获取业务类型名称
const getBusinessTypeName = (type: string) => {
  const nameMap: Record<string, string> = {
    quote: '报价',
    contract: '合同',
    order: '订单',
  }
  return nameMap[type] || type
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 加载模板列表
const loadTemplates = async () => {
  try {
    loading.value = true
    const response = await getWorkflowTemplates(searchForm.businessType) as unknown as { code: number; data?: WorkflowTemplate[] }
    if (response.code === 200) {
      templates.value = response.data || []
      pagination.total = templates.value.length
      // 防止当前页超出范围
      const maxPage = Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
      if (pagination.page > maxPage) {
        pagination.page = maxPage
      }
    }
  } catch (error) {
    console.error('加载审批流模板列表失败:', error)
    ElMessage.error('加载审批流模板列表失败')
  } finally {
    loading.value = false
  }
}

// 计算当前页数据
const pagedTemplates = computed(() => {
  if (!templates.value || templates.value.length === 0) return []
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return templates.value.slice(start, end)
})

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadTemplates()
}

// 重置
const handleReset = () => {
  searchForm.businessType = undefined
  pagination.page = 1
  loadTemplates()
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
}

// 当前页变化
const handleCurrentChange = (page: number) => {
  pagination.page = page
}

// 创建
const handleCreate = () => {
  currentTemplate.value = null
  dialogVisible.value = true
}

// 编辑
const handleEdit = (template: WorkflowTemplate) => {
  currentTemplate.value = template
  dialogVisible.value = true
}

// 切换启用/禁用状态
const handleToggleStatus = async (template: WorkflowTemplate) => {
  try {
    const action = template.isActive ? '禁用' : '启用'
    await ElMessageBox.confirm(
      `确定要${action}审批流模板"${template.name}"吗？`,
      `确认${action}`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const response = await updateWorkflowTemplate(template.id, {
      isActive: !template.isActive,
    }) as unknown as { code: number; message?: string }
    if (response.code === 200) {
      ElMessage.success(`${action}成功`)
      loadTemplates()
    }
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('切换审批流模板状态失败:', error)
      const errorMessage = error instanceof Error ? error.message : '操作失败'
      ElMessage.error(errorMessage)
    }
  }
}

// 删除
const handleDelete = async (template: WorkflowTemplate) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除审批流模板"${template.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const response = await deleteWorkflowTemplate(template.id) as unknown as { code: number; message?: string }
    if (response.code === 200) {
      ElMessage.success('删除成功')
      loadTemplates()
    }
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('删除审批流模板失败:', error)
      const errorMessage = error instanceof Error ? error.message : '删除失败'
      ElMessage.error(errorMessage)
    }
  }
}

// 操作成功回调
const handleSuccess = () => {
  dialogVisible.value = false
  loadTemplates()
}

onMounted(() => {
  loadTemplates()
})
</script>

<!-- <style scoped lang="scss">
.workflow-template-management {
  padding: 20px;

  &.embedded-mode {
    padding: 0;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .toolbar-left {
      flex: 1;
    }

    .toolbar-right {
      margin-left: 20px;
    }
  }

  .table-section {
    background: white;
    padding: 20px;
    border-radius: 4px;
  }
}
</style> -->
<style lang="scss" scoped>
  @use '@/styles/common/table-layout.scss';
</style>
