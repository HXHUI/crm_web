<template>
  <div class="table-page">
    <div class="main-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :model="searchForm" :inline="true" size="default" class="search-form">
            <el-form-item>
              <el-input
                v-model="searchForm.name"
                placeholder="请输入标签名称"
                clearable
                style="width: 200px"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="searchForm.color"
                placeholder="请选择颜色"
                clearable
                style="width: 150px"
              >
                <el-option
                  v-for="color in colorOptions"
                  :key="color.value"
                  :label="color.label"
                  :value="color.value"
                >
                  <div style="display: flex; align-items: center;">
                    <div
                      :style="{ width: '12px', height: '12px', backgroundColor: color.value, borderRadius: '2px', marginRight: '8px' }"
                    ></div>
                    {{ color.label }}
                  </div>
                </el-option>
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
            新建标签
          </el-button>
          <el-button
            type="danger"
            :disabled="selectedRows.length === 0"
            @click="handleBatchDelete"
          >
            <el-icon><Delete /></el-icon>
            批量删除
          </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="table-section">
        <el-table
          v-loading="loading"
          :data="tableData"
          @selection-change="handleSelectionChange"
          style="width: 100%"
          height="100%"
          border
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="name" label="标签名称" min-width="120" show-overflow-tooltip />
          <el-table-column prop="color" label="颜色" width="100" align="center">
            <template #default="{ row }">
              <div style="display: flex; align-items: center; justify-content: center;">
                <div
                  :style="{ width: '20px', height: '20px', backgroundColor: row.color, borderRadius: '4px' }"
                ></div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="editTag(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="deleteTag(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新建/编辑标签对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="标签颜色" prop="color">
          <el-color-picker v-model="formData.color" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入标签描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import customerTagApi, { type CustomerTag, type CreateCustomerTagDto, type UpdateCustomerTagDto } from '@/api/customerTag'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const tableData = ref<CustomerTag[]>([])
const selectedRows = ref<CustomerTag[]>([])

// 搜索表单
const searchForm = reactive({
  name: '',
  color: ''
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 50,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const currentId = ref('')

// 表单
const formRef = ref()
const formData = reactive<CreateCustomerTagDto & UpdateCustomerTagDto>({
  name: '',
  color: '#1890ff',
  description: ''
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 1, max: 100, message: '标签名称长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  color: [
    { required: true, message: '请选择标签颜色', trigger: 'change' }
  ]
}

// 颜色选项
const colorOptions = [
  { label: '蓝色', value: '#1890ff' },
  { label: '绿色', value: '#52c41a' },
  { label: '橙色', value: '#fa8c16' },
  { label: '红色', value: '#f5222d' },
  { label: '紫色', value: '#722ed1' },
  { label: '青色', value: '#13c2c2' },
  { label: '灰色', value: '#8c8c8c' }
]

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取标签列表
const getTagList = async () => {
  try {
    loading.value = true
    const params = {
      ...searchForm,
      page: pagination.page,
      limit: pagination.limit
    }
    const response = await customerTagApi.getList(params)
    tableData.value = response.data.tags
    pagination.total = response.data.total
  } catch (error) {
    console.error('获取标签列表失败:', error)
    ElMessage.error('获取标签列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  getTagList()
}

// 重置
const handleReset = () => {
  searchForm.name = ''
  searchForm.color = ''
  pagination.page = 1
  getTagList()
}

// 新建标签
const goToCreate = () => {
  dialogTitle.value = '新建标签'
  isEdit.value = false
  currentId.value = ''
  Object.assign(formData, {
    name: '',
    color: '#1890ff',
    description: ''
  })
  dialogVisible.value = true
  formRef.value?.clearValidate()
}

// 编辑标签
const editTag = (tag: CustomerTag) => {
  dialogTitle.value = '编辑标签'
  isEdit.value = true
  currentId.value = tag.id
  Object.assign(formData, {
    name: tag.name,
    color: tag.color,
    description: tag.description || ''
  })
  dialogVisible.value = true
  formRef.value?.clearValidate()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (isEdit.value) {
      await customerTagApi.update(currentId.value, formData)
      ElMessage.success('标签更新成功')
    } else {
      await customerTagApi.create(formData)
      ElMessage.success('标签创建成功')
    }
    
    dialogVisible.value = false
    getTagList()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error(isEdit.value ? '标签更新失败' : '标签创建失败')
  } finally {
    submitting.value = false
  }
}

// 删除标签
const deleteTag = async (tag: CustomerTag) => {
  try {
    await ElMessageBox.confirm(`确定要删除标签"${tag.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await customerTagApi.delete(tag.id)
    ElMessage.success('标签删除成功')
    getTagList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除标签失败:', error)
      ElMessage.error('标签删除失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个标签吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const ids = selectedRows.value.map(row => row.id)
    await customerTagApi.deleteBatch(ids)
    ElMessage.success('批量删除成功')
    getTagList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 选择变化
const handleSelectionChange = (selection: CustomerTag[]) => {
  selectedRows.value = selection
}

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  getTagList()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  getTagList()
}

// 初始化
onMounted(() => {
  getTagList()
})
</script>

<style lang="scss" scoped>
@use '@/styles/common/table-layout.scss';
</style>
