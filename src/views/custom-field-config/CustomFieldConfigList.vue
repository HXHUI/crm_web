<template>
  <div class="table-page" :class="{ 'embedded-mode': embedded }">
    <div class="main-container" :style="embedded ? { padding: 0 } : {}">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :model="searchForm" :inline="true" size="default" class="search-form">
            <el-form-item>
              <el-input
                v-model="searchForm.keyword"
                placeholder="搜索字段名称或编码"
                clearable
                style="width: 200px"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="searchForm.entityType"
                placeholder="实体类型"
                clearable
                style="width: 150px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="客户" value="customer" />
                <el-option label="联系人" value="contact" />
                <el-option label="商机" value="opportunity" />
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
            新建字段配置
          </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="table-section">
        <el-table
          v-loading="loading"
          :data="tableData"
          style="width: 100%"
          height="100%"
          border
        >
          <el-table-column prop="fieldName" label="字段名称" min-width="120" />
          <el-table-column prop="fieldCode" label="字段编码" min-width="120" />
          <el-table-column prop="entityType" label="实体类型" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.entityType === 'customer'">客户</el-tag>
              <el-tag v-else-if="row.entityType === 'contact'" type="success">联系人</el-tag>
              <el-tag v-else-if="row.entityType === 'opportunity'" type="warning">商机</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="fieldType" label="字段类型" width="120">
            <template #default="{ row }">
              {{ getFieldTypeLabel(row.fieldType) }}
            </template>
          </el-table-column>
          <el-table-column prop="groupName" label="分组" width="120" />
          <el-table-column prop="isRequired" label="必填" width="80" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isRequired" type="danger">是</el-tag>
              <el-tag v-else type="info">否</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="isActive" label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-switch
                v-model="row.isActive"
                @change="handleToggleActive(row)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="displayOrder" label="排序" width="80" align="center" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="editConfig(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="deleteConfig(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-section">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getCustomFieldConfigs,
  deleteCustomFieldConfig,
  updateCustomFieldConfig,
  type CustomFieldConfig,
  type QueryCustomFieldConfigDto,
} from '@/api/customFieldConfig'

interface Props {
  embedded?: boolean
  // 在嵌入模式下，是否使用弹窗进行新建/编辑，而不是路由跳转
  useDialog?: boolean
}

const router = useRouter()

const loading = ref(false)
const tableData = ref<CustomFieldConfig[]>([])
const searchForm = reactive<QueryCustomFieldConfigDto>({
  keyword: '',
  entityType: undefined,
  page: 1,
  pageSize: 10,
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const getFieldTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    text: '文本',
    number: '数字',
    date: '日期',
    datetime: '日期时间',
    select: '单选',
    multiselect: '多选',
    textarea: '多行文本',
    boolean: '布尔',
    file: '文件',
  }
  return labels[type] || type
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    const res = await getCustomFieldConfigs(params)
    if (res.code === 200) {
      tableData.value = res.data.items
      pagination.total = res.data.total
    }
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.entityType = undefined
  handleSearch()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadData()
}

const props = withDefaults(defineProps<Props>(), {
  embedded: false,
  useDialog: false,
})

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'edit', row: CustomFieldConfig): void
}>()

const goToCreate = () => {
  if (props.embedded && props.useDialog) {
    emit('create')
  } else {
    router.push('/custom-field-config/create')
  }
}

const editConfig = (row: CustomFieldConfig) => {
  if (props.embedded && props.useDialog) {
    emit('edit', row)
  } else {
    router.push(`/custom-field-config/edit/${row.id}`)
  }
}

const deleteConfig = async (row: CustomFieldConfig) => {
  try {
    await ElMessageBox.confirm(`确定要删除字段配置 "${row.fieldName}" 吗？`, '提示', {
      type: 'warning',
    })
    const res = await deleteCustomFieldConfig(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      loadData()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleToggleActive = async (row: CustomFieldConfig) => {
  try {
    await updateCustomFieldConfig(row.id, { isActive: row.isActive })
    ElMessage.success('状态更新成功')
  } catch (error) {
    row.isActive = !row.isActive
    ElMessage.error('状态更新失败')
  }
}

onMounted(() => {
  loadData()
})

// 让父组件可以手动触发刷新
defineExpose({
  reload: loadData,
})
</script>

<style lang="scss" scoped>
@use '@/styles/common/table-layout.scss';
</style>

