<template>
  <div class="product-management">
    <div class="main-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item>
              <el-input
                v-model="searchForm.search"
                placeholder="搜索产品名称/编码"
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
                v-model="searchForm.category"
                placeholder="产品分类"
                clearable
                style="width: 120px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="电子产品" value="electronics" />
                <el-option label="机械设备" value="machinery" />
                <el-option label="办公用品" value="office" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="searchForm.status"
                placeholder="状态"
                clearable
                style="width: 120px"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="启用" value="active" />
                <el-option label="停用" value="inactive" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch"> 搜索 </el-button>
              <el-button :icon="Refresh" @click="handleReset"> 重置 </el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" :icon="Plus" @click="goToCreate"> 新增产品 </el-button>
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
          :data="products"
          v-loading="loading"
          @selection-change="handleSelectionChange"
          style="width: 100%"
          border
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="name" label="产品名称" min-width="150" />
          <el-table-column prop="code" label="产品编码" width="120" />
          <el-table-column prop="category" label="分类" width="120" />
          <el-table-column prop="price" label="价格" width="120" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.price) }}
            </template>
          </el-table-column>
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                {{ row.status === 'active' ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="mainImage" label="主图" width="100">
            <template #default="{ row }">
              <el-image
                v-if="row.mainImage"
                :src="row.mainImage"
                style="width: 60px; height: 60px"
                fit="cover"
                :preview-src-list="[row.mainImage]"
              />
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" :icon="Edit" @click="editProduct(row)">
                编辑
              </el-button>
              <el-button type="danger" size="small" :icon="Delete" @click="deleteProduct(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

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

    <!-- 产品表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入产品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品编码" prop="code">
              <el-input v-model="formData.code" placeholder="请输入产品编码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品分类" prop="category">
              <el-select v-model="formData.category" placeholder="请选择分类" style="width: 100%">
                <el-option label="电子产品" value="electronics" />
                <el-option label="机械设备" value="machinery" />
                <el-option label="办公用品" value="office" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-input v-model="formData.unit" placeholder="如：个、台、套" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="价格" prop="price">
              <el-input-number
                v-model="formData.price"
                :min="0"
                :precision="2"
                style="width: 100%"
                placeholder="请输入价格"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成本价" prop="costPrice">
              <el-input-number
                v-model="formData.costPrice"
                :min="0"
                :precision="2"
                style="width: 100%"
                placeholder="请输入成本价"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="规格" prop="specification">
          <el-input v-model="formData.specification" placeholder="请输入产品规格" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="主图" prop="mainImage">
          <el-upload
            class="avatar-uploader"
            :action="uploadAction"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleMainImageSuccess"
            :before-upload="beforeUpload"
          >
            <img v-if="formData.mainImage" :src="formData.mainImage" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="text-sm text-gray-500 mt-1">建议尺寸：800x800px，支持JPG、PNG格式</div>
        </el-form-item>
        <el-form-item label="详情图" prop="detailImages">
          <el-upload
            :action="uploadAction"
            :headers="uploadHeaders"
            list-type="picture-card"
            :file-list="detailImageList"
            :on-success="handleDetailImageSuccess"
            :on-remove="handleDetailImageRemove"
            :before-upload="beforeDetailImageUpload"
            :limit="9"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="text-sm text-gray-500 mt-1">最多上传9张，建议尺寸：800x800px</div>
        </el-form-item>
        <el-form-item label="产品描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入产品描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Edit, Delete } from '@element-plus/icons-vue'
import type { UploadProps, UploadFile } from 'element-plus'
import productApi, {
  type Product,
  type CreateProductDto,
  type UpdateProductDto,
  type QueryProductDto,
} from '@/api/product'

// 搜索表单
const searchForm = reactive({
  search: '',
  category: undefined as string | undefined,
  status: undefined as string | undefined,
})

// 产品列表
const products = ref<Product[]>([])
const loading = ref(false)
const selectedRows = ref<Product[]>([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const formRef = ref()
const isEdit = ref(false)
const currentId = ref<string>('')

// 表单数据
const formData = reactive<CreateProductDto>({
  name: '',
  code: '',
  category: '',
  specification: '',
  unit: '',
  price: undefined,
  costPrice: undefined,
  status: 'active',
  mainImage: '',
  detailImages: [],
  description: '',
})

// 详情图列表
const detailImageList = ref<UploadFile[]>([])

// 上传地址
const uploadAction = computed(() => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'
  // VITE_API_BASE_URL 已经包含了 /api/v1，所以直接加 /upload 即可
  return `${baseURL}/upload`
})

// 上传请求头（包含认证token）
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return {
    Authorization: token ? `Bearer ${token}` : '',
  }
})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 格式化货币
const formatCurrency = (value?: number) => {
  if (!value) return '-'
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// 加载产品列表
const loadProducts = async () => {
  try {
    loading.value = true
    const params: QueryProductDto = {
      ...searchForm,
      page: pagination.page,
      limit: pagination.pageSize,
    }
    const response = await productApi.getList(params)

    if (response.code === 200) {
      products.value = response.data.products
      pagination.total = response.data.total
    }
  } catch (error) {
    console.error('加载产品列表失败:', error)
    ElMessage.error('加载产品列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadProducts()
}

// 重置
const handleReset = () => {
  searchForm.search = ''
  searchForm.category = undefined
  searchForm.status = undefined
  handleSearch()
}

// 选择变化
const handleSelectionChange = (selection: Product[]) => {
  selectedRows.value = selection
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadProducts()
}

// 当前页变化
const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadProducts()
}

// 新增产品
const goToCreate = () => {
  isEdit.value = false
  dialogTitle.value = '新增产品'
  resetForm()
  dialogVisible.value = true
}

// 编辑产品
const editProduct = (row: Product) => {
  isEdit.value = true
  currentId.value = row.id
  dialogTitle.value = '编辑产品'
  Object.assign(formData, {
    name: row.name,
    code: row.code || '',
    category: row.category || '',
    specification: row.specification || '',
    unit: row.unit || '',
    price: row.price,
    costPrice: row.costPrice,
    status: row.status,
    mainImage: row.mainImage || '',
    detailImages: row.detailImages || [],
    description: row.description || '',
  })
  
  // 设置详情图列表
  detailImageList.value = (row.detailImages || []).map((url, index) => ({
    uid: `${index}`,
    name: `detail-${index}.jpg`,
    url,
    status: 'success',
  }))
  
  dialogVisible.value = true
}

// 删除产品
const deleteProduct = async (row: Product) => {
  try {
    await ElMessageBox.confirm('确定要删除该产品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    
    await productApi.delete(row.id)
    ElMessage.success('删除成功')
    loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除产品失败:', error)
      ElMessage.error('删除产品失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个产品吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    
    const ids = selectedRows.value.map((row) => row.id)
    await productApi.deleteBatch(ids)
    ElMessage.success('批量删除成功')
    selectedRows.value = []
    loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    name: '',
    code: '',
    category: '',
    specification: '',
    unit: '',
    price: undefined,
    costPrice: undefined,
    status: 'active',
    mainImage: '',
    detailImages: [],
    description: '',
  })
  detailImageList.value = []
  formRef.value?.clearValidate()
}

// 主图上传成功
const handleMainImageSuccess: UploadProps['onSuccess'] = (response: any) => {
  // 后端返回格式: { code: 200, message: '...', data: { url: '...', ... } }
  const url = response?.data?.url || response?.url || response
  if (url) {
    formData.mainImage = url
    ElMessage.success('主图上传成功')
  } else {
    ElMessage.error('上传失败：未获取到文件URL')
  }
}

// 详情图上传成功
const handleDetailImageSuccess: UploadProps['onSuccess'] = (response: any, file: UploadFile) => {
  // 后端返回格式: { code: 200, message: '...', data: { url: '...', ... } }
  const url = response?.data?.url || response?.url || response
  if (url) {
    formData.detailImages = formData.detailImages || []
    formData.detailImages.push(url)
    ElMessage.success('详情图上传成功')
  } else {
    ElMessage.error('上传失败：未获取到文件URL')
  }
}

// 详情图移除
const handleDetailImageRemove: UploadProps['onRemove'] = (file: UploadFile) => {
  // 从file对象中获取URL
  const url = file.url || (file.response?.data?.url || file.response?.url || file.response)
  if (url) {
    formData.detailImages = (formData.detailImages || []).filter((img) => img !== url)
  }
}

// 上传前验证
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 详情图上传前验证
const beforeDetailImageUpload: UploadProps['beforeUpload'] = (file) => {
  const isValid = beforeUpload(file)
  if (!isValid) return false
  
  if ((formData.detailImages?.length || 0) >= 9) {
    ElMessage.error('最多只能上传9张详情图!')
    return false
  }
  return true
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    
    submitLoading.value = true
    
    if (isEdit.value) {
      await productApi.update(currentId.value, formData)
      ElMessage.success('更新成功')
    } else {
      await productApi.create(formData)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadProducts()
  } catch (error: any) {
    if (error !== false) {
      console.error('提交失败:', error)
      ElMessage.error(error.message || '提交失败')
    }
  } finally {
    submitLoading.value = false
  }
}

// 初始化
onMounted(() => {
  loadProducts()
})
</script>

<style scoped lang="scss">
@use '@/styles/common/table-layout.scss';

.product-management {
  @extend .table-page;
}

.avatar-uploader {
  :deep(.avatar) {
    width: 100px;
    height: 100px;
    display: block;
  }
  
  :deep(.el-upload) {
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);
    
    &:hover {
      border-color: var(--el-color-primary);
    }
  }
  
  :deep(.avatar-uploader-icon) {
    font-size: 28px;
    color: #8c939d;
    width: 100px;
    height: 100px;
    text-align: center;
    line-height: 100px;
  }
}
</style>

