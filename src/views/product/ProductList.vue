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
                @input="handleSearchDebounced"
                style="width: 200px"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <!-- 动态分类字段过滤（根据配置的分类字段生成） -->
            <template v-if="categoryFields.length > 0">
              <el-form-item
                v-for="field in categoryFields"
                :key="field.fieldKey"
              >
                <el-select
                  v-model="searchForm[field.fieldKey]"
                  :placeholder="field.fieldName"
                  clearable
                  style="width: 160px"
                  @change="handleSearch"
                >
                  <el-option label="全部" :value="undefined" />
                  <el-option
                    v-for="opt in getCategoryFieldOptionsForSearch(field)"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>
            </template>
            <!-- 兼容旧版本：如果没有配置分类字段，显示单个分类选择 -->
            <el-form-item v-else>
              <el-select
                v-model="searchForm.category"
                placeholder="产品分类"
                clearable
                style="width: 160px"
                @change="handleSearch"
              >
                <el-option label="全部" :value="undefined" />
                <el-option
                  v-for="opt in categoryOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="searchForm.status"
                placeholder="状态"
                clearable
                style="width: 120px"
                @change="handleSearch"
              >
                <el-option label="全部" :value="undefined" />
                <el-option label="启用" value="active" />
                <el-option label="停用" value="inactive" />
              </el-select>
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
          <!-- 动态分类字段列 -->
          <el-table-column
            v-for="field in categoryFields"
            :key="field.fieldKey"
            :prop="field.fieldKey"
            :label="field.fieldName"
            :width="field.fieldName.length > 4 ? 120 : 100"
            min-width="100"
          >
            <template #default="{ row }">
              <span v-if="row[field.fieldKey]">{{ getCategoryFieldDisplayValue(field, row[field.fieldKey]) }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <!-- 兼容旧版本：如果没有配置分类字段，显示单个分类列 -->
          <el-table-column v-if="categoryFields.length === 0" prop="category" label="分类" width="120" />
          <el-table-column prop="price" label="价格" width="120" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.price) }}
            </template>
          </el-table-column>
          <el-table-column prop="unit" label="单位" width="80">
            <template #default="{ row }">
              {{ getUnitLabel(row.unit) || row.unit || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                {{ row.status === 'active' ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="mainImage" label="主图" width="100">
            <template #default="{ row }">
              <img
                v-if="row.mainImage"
                :src="row.mainImage"
                class="product-image-thumb"
                @click.stop="openImagePreview(row.mainImage)"
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
              <el-input
                v-model="formData.name"
                :placeholder="tenantProductConfig?.nameRule?.segments?.length ? '如果留空，在保存时会根据「租户信息 → 产品配置」中的名称规则自动生成产品名称。' : '请输入产品名称'"
                @input="handleNameInput"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品编码" prop="code">
              <el-input v-model="formData.code" placeholder="不填则按租户产品配置自动生成" />
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 动态分类字段（级联选择，2列布局） -->
        <template v-if="categoryFields.length > 0">
          <el-row :gutter="20" v-for="rowIndex in Math.ceil(categoryFields.length / 2)" :key="rowIndex">
            <el-col :span="12" v-for="colIndex in 2" :key="colIndex">
              <template v-if="categoryFields[(rowIndex - 1) * 2 + colIndex - 1]">
                <el-form-item
                  :label="categoryFields[(rowIndex - 1) * 2 + colIndex - 1].fieldName"
                  :prop="categoryFields[(rowIndex - 1) * 2 + colIndex - 1].fieldKey"
                >
                  <el-select
                    v-model="formData[categoryFields[(rowIndex - 1) * 2 + colIndex - 1].fieldKey]"
                    :placeholder="`请选择${categoryFields[(rowIndex - 1) * 2 + colIndex - 1].fieldName}`"
                    style="width: 100%"
                    clearable
                    @change="handleCategoryFieldChange(categoryFields[(rowIndex - 1) * 2 + colIndex - 1])"
                  >
                    <el-option
                      v-for="opt in getCategoryFieldOptions(categoryFields[(rowIndex - 1) * 2 + colIndex - 1])"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </el-form-item>
              </template>
            </el-col>
          </el-row>
        </template>
        <!-- 兼容旧版本：如果没有配置分类字段，显示单个分类选择 -->
        <el-row :gutter="20" v-else>
          <el-col :span="12">
            <el-form-item label="产品分类" prop="category">
              <el-select v-model="formData.category" placeholder="请选择分类" style="width: 100%">
                <el-option
                  v-for="opt in categoryOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-select
                v-model="formData.unit"
                placeholder="请选择单位"
                style="width: 100%"
                clearable
                filterable
                @change="updateAllPackagingSpecs"
              >
                <el-option
                  v-for="opt in unitOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="辅助单位配置">
          <div class="auxiliary-units-container">
            <el-table :data="formData.auxiliaryUnits" border style="width: 100%">
              <el-table-column prop="unit" label="单位名称" width="120">
                <template #default="{ row, $index }">
                  <el-select
                    v-model="row.unit"
                    placeholder="请选择单位"
                    size="small"
                    style="width: 100%"
                    filterable
                    clearable
                    @change="updatePackagingSpec($index)"
                  >
                    <el-option
                      v-for="opt in unitOptions"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column prop="conversionRate" label="转换率" width="120">
                <template #default="{ row, $index }">
                  <el-input
                    :model-value="formatConversionRateDisplay(row.conversionRate)"
                    type="text"
                    style="width: 100%"
                    placeholder="转换率"
                    @blur="(e: Event) => handleConversionRateBlur($index, e)"
                    @input="(val: string) => handleConversionRateInput($index, val)"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="purpose" label="用途" width="120">
                <template #default="{ row, $index }">
                  <el-select
                    v-model="row.purpose"
                    placeholder="请选择用途"
                    size="small"
                    style="width: 100%"
                    @change="handlePurposeChange($index)"
                  >
                    <el-option label="销售" value="sales" />
                    <el-option label="采购" value="purchase" />
                    <el-option label="内包" value="internal" />
                    <el-option label="外包" value="external" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="包装规格" width="200">
                <template #default="{ row, $index }">
                  <el-input
                    v-model="row.description"
                    placeholder="自动计算"
                    size="small"
                    readonly
                    @focus="updatePackagingSpec($index)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" fixed="right">
                <template #default="{ $index }">
                  <el-button
                    type="danger"
                    :icon="Delete"
                    size="small"
                    circle
                    @click="removeAuxiliaryUnit($index)"
                  />
                </template>
              </el-table-column>
            </el-table>
            <el-button
              type="primary"
              :icon="Plus"
              size="small"
              style="margin-top: 10px"
              @click="addAuxiliaryUnit"
            >
              添加辅助单位
            </el-button>
          </div>
        </el-form-item>
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
          <div class="main-image-container">
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
            <el-button
              v-if="formData.mainImage"
              type="danger"
              :icon="Delete"
              size="small"
              circle
              class="main-image-delete"
              @click="removeMainImage"
            />
          </div>
          <div class="text-sm text-gray-500 mt-1">建议尺寸：800x800px，支持JPG、PNG格式</div>
        </el-form-item>
        <el-form-item label="详情图" prop="detailImages">
          <div class="detail-images-container">
            <div
              v-if="detailImageList && detailImageList.length > 0"
              ref="sortableContainer"
              class="sortable-image-list"
            >
              <div
                v-for="(item, index) in detailImageList"
                :key="item.uid || index"
                class="sortable-image-item"
                :data-index="index"
              >
                <el-image
                  :src="item.url"
                  fit="cover"
                  class="detail-image"
                  :preview-src-list="detailImageList.map((img) => img.url)"
                  :initial-index="index"
                  preview-teleported
                />
                <div class="image-actions">
                  <el-button
                    type="danger"
                    :icon="Delete"
                    size="small"
                    circle
                    @click="removeDetailImage(index)"
                  />
                </div>
                <div class="image-order">{{ index + 1 }}</div>
              </div>
            </div>
            <div
              v-if="(detailImageList?.length || 0) < 9"
              class="detail-upload-card"
              @click="triggerDetailImageUpload"
            >
              <el-icon class="upload-icon"><Plus /></el-icon>
              <input
                ref="detailImageInputRef"
                type="file"
                multiple
                accept="image/*"
                style="display: none"
                @change="handleDetailImageFileChange"
              />
            </div>
          </div>
          <div class="text-sm text-gray-500 mt-1">
            最多上传9张，支持多选，可拖动排序，建议尺寸：800x800px
          </div>
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

    <!-- 图片预览（使用 Element Plus ImageViewer，全屏展示） -->
    <el-image-viewer
      v-if="imagePreviewVisible"
      :url-list="imagePreviewList"
      :initial-index="imagePreviewIndex"
      @close="closeImagePreview"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox, ElImageViewer } from 'element-plus'
import { Plus, Search, Edit, Delete } from '@element-plus/icons-vue'
import type { UploadProps, UploadFile } from 'element-plus'
import Sortable from 'sortablejs'
import productApi, {
  type Product,
  type CreateProductDto,
  type UpdateProductDto,
  type QueryProductDto,
} from '@/api/product'
import dictionaryApi, { type DictItemTreeNode } from '@/api/dictionary'
import { useAuthStore } from '@/stores/modules/auth'
import {
  tenantApi,
  type TenantProductConfig,
  type ProductCategoryFieldConfig,
  type ProductCategoryValueConfig,
} from '@/api/tenant'

const authStore = useAuthStore()

// 搜索表单（支持动态分类字段）
const searchForm = reactive<{
  search: string
  category?: string
  status?: string
  [key: string]: any
}>({
  search: '',
  category: undefined,
  status: undefined,
})

// 产品列表
const products = ref<Product[]>([])
const loading = ref(false)
const selectedRows = ref<Product[]>([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0,
})

// 租户产品配置 / 分类选项
const tenantProductConfig = ref<TenantProductConfig | null>(null)
const categoryOptions = ref<{ label: string; value: string }[]>([])

// 分类字段（按层级排序）
const categoryFields = computed(() => {
  if (!tenantProductConfig.value?.categoryFields) return []
  return [...tenantProductConfig.value.categoryFields].sort((a, b) => (a.level || 0) - (b.level || 0))
})

// 字典项数据缓存（按字典类型编码）
const dictItemsCache = ref<Record<string, DictItemTreeNode[]>>({})

// 单位选项（从系统字典加载）
const unitOptions = ref<{ label: string; value: string }[]>([])

// 分类字段选项缓存（按字段key）
const categoryFieldOptionsCache = ref<Record<string, { label: string; value: string }[]>>({})

// 根据租户配置动态更新分类字段的表单必填规则
const updateDynamicFieldRules = () => {
  const fields = tenantProductConfig.value?.categoryFields || []

  // 先清理现有的动态字段规则（只清理当前配置里的字段）
  const fieldKeys = fields.map((f) => f.fieldKey)
  Object.keys(formRules).forEach((key) => {
    if (fieldKeys.includes(key)) {
      // 后面会按 required 重新设置
      delete (formRules as any)[key]
    }
  })

  // 按 required 配置重新添加规则
  fields.forEach((field) => {
    if (field.required) {
      ;(formRules as any)[field.fieldKey] = [
        {
          required: true,
          message: `请选择${field.fieldName}`,
          trigger: 'change',
        },
      ]
    }
  })
}

const buildCategoryOptionsFromConfig = (values: ProductCategoryValueConfig[]) => {
  if (!values || values.length === 0) {
    // 回退到默认静态分类
    categoryOptions.value = [
      { label: '电子产品', value: 'electronics' },
      { label: '机械设备', value: 'machinery' },
      { label: '办公用品', value: 'office' },
      { label: '其他', value: 'other' },
    ]
    return
  }

  categoryOptions.value = values.map((v) => ({
    label: v.valueName,
    value: v.valueCode || v.valueId,
  }))
}

// 加载字典项（缓存）
const loadDictItems = async (dictTypeCode: string): Promise<DictItemTreeNode[]> => {
  if (dictItemsCache.value[dictTypeCode]) {
    return dictItemsCache.value[dictTypeCode]
  }
  try {
    const res = await dictionaryApi.getItemsTree(dictTypeCode)
    if (res.code === 200 && res.data) {
      dictItemsCache.value[dictTypeCode] = res.data
      return res.data
    }
  } catch (error) {
    console.error(`加载字典项失败 (${dictTypeCode}):`, error)
  }
  return []
}

// 将字典树扁平化为选项列表（支持按父级ID或值过滤）
const flattenDictItems = (
  nodes: DictItemTreeNode[],
  parentIdOrValue?: string | number
): { label: string; value: string; parentId?: number; parentValue?: string }[] => {
  const result: { label: string; value: string; parentId?: number; parentValue?: string }[] = []

  const walk = (items: DictItemTreeNode[]) => {
    items.forEach((item) => {
      const value = item.value || String(item.id)
      const itemParentId = item.parentId || undefined

      // 如果没有指定父级过滤条件，添加所有项
      if (!parentIdOrValue) {
        result.push({
          label: item.label,
          value,
          parentId: itemParentId || undefined,
        })
      } else {
        // 有父级过滤条件：只添加父级ID或值匹配的项
        const parentMatch =
          (itemParentId && String(itemParentId) === String(parentIdOrValue)) ||
          (item.value && item.value === String(parentIdOrValue)) ||
          (String(item.id) === String(parentIdOrValue))

        if (parentMatch) {
          result.push({
            label: item.label,
            value,
            parentId: itemParentId || undefined,
          })
        }
      }

      // 递归处理子项
      if (item.children && item.children.length > 0) {
        walk(item.children)
      }
    })
  }

  walk(nodes)
  return result
}

// 根据值或ID查找字典项
const findDictItemByValue = (nodes: DictItemTreeNode[], value: string): DictItemTreeNode | null => {
  for (const node of nodes) {
    const nodeValue = node.value || String(node.id)
    if (nodeValue === value) {
      return node
    }
    if (node.children && node.children.length > 0) {
      const found = findDictItemByValue(node.children, value)
      if (found) return found
    }
  }
  return null
}

// 从 categoryValues 获取选项（支持按父级过滤）
const getOptionsFromCategoryValues = (
  fieldKey: string,
  parentValue?: string
): { label: string; value: string }[] => {
  if (!tenantProductConfig.value?.categoryValues) return []
  const values = tenantProductConfig.value.categoryValues.filter(
    (v) => v.fieldKey === fieldKey && (!parentValue || v.parentValueId === parentValue)
  )
  return values.map((v) => ({
    label: v.valueName,
    value: v.valueCode || v.valueId,
  }))
}

// 获取分类字段的选项列表（用于搜索表单，不考虑级联）
const getCategoryFieldOptionsForSearch = (field: ProductCategoryFieldConfig): { label: string; value: string }[] => {
  // 如果字段关联了字典类型，从字典获取所有顶级选项
  if (field.dictTypeCode) {
    const dictItems = dictItemsCache.value[field.dictTypeCode] || []
    if (dictItems.length === 0) {
      // 异步加载字典项
      loadDictItems(field.dictTypeCode)
      return []
    }
    // 返回所有选项（扁平化，不按级联过滤）
    const allItems = flattenDictItems(dictItems)
    return allItems.map(item => ({ label: item.label, value: item.value }))
  }

  // 否则从 categoryValues 获取所有选项
  return getOptionsFromCategoryValues(field.fieldKey)
}

// 获取分类字段的选项列表（支持级联过滤）
const getCategoryFieldOptions = (field: ProductCategoryFieldConfig): { label: string; value: string }[] => {
  // 如果字段关联了字典类型，从字典获取
  if (field.dictTypeCode) {
    const dictItems = dictItemsCache.value[field.dictTypeCode] || []
    if (dictItems.length === 0) {
      // 异步加载字典项
      loadDictItems(field.dictTypeCode)
      return []
    }

    // 如果字段有上级字段且需要级联，需要根据上级字段的值过滤
    if (field.parentFieldKey && field.isCascade) {
      const parentField = categoryFields.value.find((f) => f.fieldKey === field.parentFieldKey)
      if (parentField) {
        const parentValue = formData[parentField.fieldKey]
        if (!parentValue) {
          return [] // 上级字段未选择，返回空列表
        }

        // 查找父级字典项
        let parentDictItem: DictItemTreeNode | null = null

        // 如果父级字段和当前字段是同一个字典类型，从当前字典中查找父级项
        if (parentField.dictTypeCode === field.dictTypeCode) {
          parentDictItem = findDictItemByValue(dictItems, parentValue)
        } else if (parentField.dictTypeCode) {
          // 如果父级字段关联了不同的字典类型，从父级字段的字典中查找
          const parentDictItems = dictItemsCache.value[parentField.dictTypeCode] || []
          parentDictItem = findDictItemByValue(parentDictItems, parentValue)
        }

        // 如果父级字段和当前字段是同一个字典类型，直接根据父级项的ID过滤子项
        if (parentField.dictTypeCode === field.dictTypeCode && parentDictItem) {
          // 只返回父级项的直接子项（parentId 等于父级项的ID）
          const allItems = flattenDictItems(dictItems)
          const filtered = allItems.filter(item => item.parentId === parentDictItem!.id)
          return filtered.map(item => ({ label: item.label, value: item.value }))
        } else if (parentDictItem && field.dictTypeCode) {
          // 父级字段和当前字段是不同的字典类型
          // 这种情况下，需要根据父级项的值在当前字典中查找匹配的项
          // 但通常这种情况不常见，暂时返回所有顶级项
          const allItems = flattenDictItems(dictItems)
          return allItems.filter((item) => !item.parentId).map(item => ({ label: item.label, value: item.value }))
        } else {
          // 无法找到父级项，尝试按值或ID匹配（可能是同一个字典类型）
          const allItems = flattenDictItems(dictItems, parentValue)
          return allItems.map(item => ({ label: item.label, value: item.value }))
        }
      }
    }
    // 没有上级字段或不需要级联，返回所有顶级选项（parentId 为 null/undefined）
    const allItems = flattenDictItems(dictItems)
    return allItems.filter((item) => !item.parentId).map(item => ({ label: item.label, value: item.value }))
  }

  // 否则从 categoryValues 获取
  if (field.parentFieldKey && field.isCascade) {
    const parentField = categoryFields.value.find((f) => f.fieldKey === field.parentFieldKey)
    if (parentField) {
      const parentValue = formData[parentField.fieldKey]
      if (!parentValue) {
        return [] // 上级字段未选择，返回空列表
      }
      return getOptionsFromCategoryValues(field.fieldKey, parentValue)
    }
  }
  // 没有上级字段，返回所有顶级选项
  return getOptionsFromCategoryValues(field.fieldKey)
}

// 处理分类字段变化（级联逻辑）
const handleCategoryFieldChange = (field: ProductCategoryFieldConfig) => {
  // 清空所有下级字段的值
  const currentLevel = field.level || 0
  categoryFields.value.forEach((f) => {
    if (f.level && f.level > currentLevel) {
      // 如果该字段是当前字段的下级（通过 parentFieldKey 链判断）
      if (isDescendantField(f, field)) {
        formData[f.fieldKey] = ''
      }
    }
  })

  // 分类字段变化后，尝试根据名称规则自动生成产品名称
  autoGenerateProductName()
}

// 判断字段是否是另一个字段的后代
const isDescendantField = (field: ProductCategoryFieldConfig, ancestor: ProductCategoryFieldConfig): boolean => {
  if (!field.parentFieldKey) return false
  if (field.parentFieldKey === ancestor.fieldKey) return true
  const parentField = categoryFields.value.find((f) => f.fieldKey === field.parentFieldKey)
  if (parentField) {
    return isDescendantField(parentField, ancestor)
  }
  return false
}

// 根据「产品名称规则」自动生成产品名称（仅在新增时、且用户未手动编辑名称时生效）
const autoGenerateProductName = () => {
  if (isEdit.value) return
  if (userEditedName.value) return
  const rule = tenantProductConfig.value?.nameRule
  if (!rule || !rule.segments || rule.segments.length === 0) return

  const parts: string[] = []

  rule.segments.forEach((seg: any) => {
    if (!seg) return
    const type = seg.segmentType
    const value = seg.segmentValue || ''

    if (type === 'CONSTANT') {
      if (value) parts.push(value)
    } else if (type === 'FIELD' && value) {
      const field = categoryFields.value.find((f) => f.fieldKey === value)
      if (!field) return
      const fieldValue = formData[field.fieldKey]
      if (!fieldValue) return
      // 使用已有的显示值函数，并尽量只取名称部分（去掉编码括号）
      let display = getCategoryFieldDisplayValue(field, String(fieldValue))
      const idx = display.indexOf('（')
      if (idx > 0) {
        display = display.slice(0, idx)
      }
      parts.push(display)
    } else if (type === 'SEPARATOR') {
      if (value) parts.push(value)
    }
  })

  const result = parts.join('')
  if (result) {
    formData.name = result
  }
}

// 获取分类字段的显示值（用于表格显示）
const getCategoryFieldDisplayValue = (field: ProductCategoryFieldConfig, value: string): string => {
  if (!value) return '-'

  // 如果字段关联了字典类型，从字典中查找
  if (field.dictTypeCode) {
    const dictItems = dictItemsCache.value[field.dictTypeCode] || []
    const foundItem = findDictItemByValue(dictItems, value)
    if (foundItem) {
      return foundItem.label
    }
  }

  // 否则从 categoryValues 中查找
  if (tenantProductConfig.value?.categoryValues) {
    const found = tenantProductConfig.value.categoryValues.find(
      (v) => v.fieldKey === field.fieldKey && (v.valueCode === value || v.valueId === value)
    )
    if (found) {
      return found.valueName
    }
  }

  // 如果都找不到，直接返回原值
  return value
}

// 加载单位选项（从系统字典）
const loadUnitOptions = async () => {
  try {
    const items = await loadDictItems('product_unit')
    // 扁平化字典树，只取顶级项
    const flattenItems = (nodes: DictItemTreeNode[]): { label: string; value: string }[] => {
      const result: { label: string; value: string }[] = []
      nodes.forEach((node) => {
        result.push({
          label: node.label,
          value: node.value || String(node.id),
        })
        if (node.children && node.children.length > 0) {
          result.push(...flattenItems(node.children))
        }
      })
      return result
    }
    unitOptions.value = flattenItems(items)
  } catch (error) {
    console.error('加载单位选项失败:', error)
    unitOptions.value = []
  }
}

const loadTenantProductConfig = async () => {
  const tenantId = authStore.currentTenant?.id
  if (!tenantId) {
    buildCategoryOptionsFromConfig([])
    return
  }

  try {
    const res = await tenantApi.getProductConfig(tenantId)
    if (res.code === 200 && res.data) {
      tenantProductConfig.value = res.data
      // 加载所有关联了字典类型的字段的字典项
      const fieldsWithDict = res.data.categoryFields?.filter((f) => f.dictTypeCode) || []
      await Promise.all(fieldsWithDict.map((f) => loadDictItems(f.dictTypeCode!)))
      // 兼容旧版本：如果没有配置分类字段，使用旧的逻辑
      if (!res.data.categoryFields || res.data.categoryFields.length === 0) {
        buildCategoryOptionsFromConfig(res.data.categoryValues || [])
      }

      // 根据配置的分类字段，刷新表单必填规则
      updateDynamicFieldRules()
    } else {
      buildCategoryOptionsFromConfig([])
    }
  } catch (error) {
    console.error('加载租户产品配置失败:', error)
    buildCategoryOptionsFromConfig([])
  }
}

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const formRef = ref()
const isEdit = ref(false)
const currentId = ref<string>('')

// 表单数据（支持动态分类字段）
const formData = reactive<CreateProductDto & Record<string, any>>({
  name: '',
  code: '',
  category: '',
  specification: '',
  unit: '',
  auxiliaryUnits: [] as Array<{
    unit: string
    conversionRate: number
    purpose: 'sales' | 'purchase' | 'internal' | 'external'
    description?: string
  }>,
  price: undefined,
  costPrice: undefined,
  status: 'active',
  mainImage: '',
  detailImages: [],
  description: '',
})

// 标记用户是否手动编辑过产品名称（防止覆盖手工输入）
const userEditedName = ref(false)

// 图片预览（用于列表主图、详情图统一预览）
const imagePreviewVisible = ref(false)
const imagePreviewList = ref<string[]>([])
const imagePreviewIndex = ref(0)

const openImagePreview = (images: string[] | string, index = 0) => {
  if (!images) return
  imagePreviewList.value = Array.isArray(images) ? images : [images]
  imagePreviewIndex.value = index
  imagePreviewVisible.value = true
}

const closeImagePreview = () => {
  imagePreviewVisible.value = false
}

// 详情图列表
const detailImageList = ref<UploadFile[]>([])
const sortableContainer = ref<HTMLElement | null>(null)
const detailImageInputRef = ref<HTMLInputElement | null>(null)
let sortableInstance: Sortable | null = null

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

// 表单验证规则（支持动态更新）
const formRules = reactive<Record<string, any>>({
  name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  unit: [{ required: true, message: '请选择单位', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
})

// 用户在名称输入框手动输入时，标记为手工编辑，后续不再自动覆盖
const handleNameInput = () => {
  userEditedName.value = true
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
    // 构建查询参数，包含动态分类字段
    const params: QueryProductDto & Record<string, any> = {
      search: searchForm.search,
      category: searchForm.category,
      status: searchForm.status as 'active' | 'inactive' | undefined,
      page: pagination.page,
      limit: pagination.pageSize,
    }

    // 添加动态分类字段的过滤条件
    categoryFields.value.forEach((field) => {
      const value = searchForm[field.fieldKey]
      if (value !== undefined && value !== null && value !== '') {
        params[field.fieldKey] = value
      }
    })

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

// 防抖定时器
let searchTimer: ReturnType<typeof setTimeout> | null = null

// 搜索（带防抖，用于输入框）
const handleSearchDebounced = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    pagination.page = 1
    loadProducts()
  }, 500) // 500ms 防抖延迟
}

// 搜索（立即执行，用于下拉选择）
const handleSearch = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  pagination.page = 1
  loadProducts()
}

// 重置
const handleReset = () => {
  searchForm.search = ''
  searchForm.category = undefined
  searchForm.status = undefined
  // 清空动态分类字段
  categoryFields.value.forEach((field) => {
    searchForm[field.fieldKey] = undefined
  })
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

  // 新增时，如果已配置名称规则且相关字段已有值，尝试生成一次名称
  nextTick(() => {
    autoGenerateProductName()
  })
}

// 编辑产品
const editProduct = (row: Product) => {
  isEdit.value = true
  currentId.value = row.id
  dialogTitle.value = '编辑产品'
  // 编辑时认为用户已手动维护名称，不再自动覆盖
  userEditedName.value = true

  // 先清空所有动态分类字段
  categoryFields.value.forEach((field) => {
    formData[field.fieldKey] = ''
  })

  Object.assign(formData, {
    name: row.name,
    code: row.code || '',
    category: row.category || '',
    specification: row.specification || '',
    unit: row.unit || '',
    auxiliaryUnits: row.auxiliaryUnits ? [...row.auxiliaryUnits] : [],
    price: row.price,
    costPrice: row.costPrice,
    status: row.status,
    mainImage: row.mainImage || '',
    detailImages: row.detailImages || [],
    description: row.description || '',
  })

  // 加载动态分类字段的值（从产品数据中读取）
  // 后端会将 categoryFields JSON 字段的值展开到产品对象上
  categoryFields.value.forEach((field) => {
    const value = (row as any)[field.fieldKey]
    if (value !== undefined && value !== null) {
      formData[field.fieldKey] = String(value)
    }
  })

  // 编辑产品时，更新所有辅助单位的包装规格
  nextTick(() => {
    updateAllPackagingSpecs()
  })

  // 设置详情图列表
  detailImageList.value = (row.detailImages || []).map((url, index) => ({
    uid: `${index}`,
    name: `detail-${index}.jpg`,
    url,
    status: 'success',
  }))

  dialogVisible.value = true

  // 初始化拖拽排序
  nextTick(() => {
    initSortable()
  })
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
  // 先清空所有动态分类字段
  categoryFields.value.forEach((field) => {
    formData[field.fieldKey] = ''
  })

  Object.assign(formData, {
    name: '',
    code: '',
    category: '',
    specification: '',
    unit: '',
    auxiliaryUnits: [],
    price: undefined,
    costPrice: undefined,
    status: 'active',
    mainImage: '',
    detailImages: [],
    description: '',
  })
  detailImageList.value = []

  // 重置名称编辑标记，允许自动生成
  userEditedName.value = false

  // 销毁拖拽实例
  if (sortableInstance) {
    sortableInstance.destroy()
    sortableInstance = null
  }

  formRef.value?.clearValidate()
}

// 监听对话框关闭，清理拖拽实例
watch(dialogVisible, (visible) => {
  if (!visible && sortableInstance) {
    sortableInstance.destroy()
    sortableInstance = null
  } else if (visible) {
    // 对话框打开时，延迟初始化拖拽（等待DOM渲染）
    nextTick(() => {
      setTimeout(() => {
        initSortable()
      }, 100)
    })
  }
})

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

// 删除主图
const removeMainImage = () => {
  formData.mainImage = ''
  ElMessage.success('主图已删除')
}

// 详情图上传成功
const handleDetailImageSuccess: UploadProps['onSuccess'] = (response: any, file: UploadFile) => {
  // 后端返回格式: { code: 200, message: '...', data: { url: '...', ... } }
  const url = response?.data?.url || response?.url || response
  if (url) {
    // 更新 file 对象的 url
    file.url = url
    file.status = 'success'

    // 确保 file 在 detailImageList 中
    const exists = detailImageList.value.some((item) => item.uid === file.uid)
    if (!exists) {
      detailImageList.value.push(file)
    }

    // 同步到 formData（保持顺序）
    updateDetailImagesFromList()

    // 初始化拖拽排序
    nextTick(() => {
      initSortable()
    })

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
    // 同步更新 detailImageList
    detailImageList.value = detailImageList.value.filter((item) => {
      const itemUrl = item.url || (item.response?.data?.url || item.response?.url || item.response)
      return itemUrl !== url
    })
    // 更新排序后的图片URL数组
    updateDetailImagesFromList()
  }
}

// 手动移除详情图（用于拖拽列表中的删除按钮）
const removeDetailImage = (index: number) => {
  const item = detailImageList.value[index]
  const url = item.url || (item.response?.data?.url || item.response?.url || item.response)
  if (url) {
    detailImageList.value.splice(index, 1)
    formData.detailImages = (formData.detailImages || []).filter((img) => img !== url)
    updateDetailImagesFromList()
    ElMessage.success('已删除')
  }
}

// 从 detailImageList 更新 formData.detailImages（保持顺序）
const updateDetailImagesFromList = () => {
  formData.detailImages = detailImageList.value
    .map((item) => item.url || (item.response?.data?.url || item.response?.url || item.response))
    .filter((url): url is string => !!url)
}

// 初始化拖拽排序
const initSortable = () => {
  if (!sortableContainer.value) {
    return
  }

  // 销毁旧的实例（如果存在）
  if (sortableInstance) {
    sortableInstance.destroy()
    sortableInstance = null
  }

  // 创建新的拖拽实例
  sortableInstance = new Sortable(sortableContainer.value, {
    animation: 150,
    handle: '.detail-image', // 可以拖动图片区域
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    onEnd: (evt) => {
      // 拖拽结束后更新数组顺序
      const { oldIndex, newIndex } = evt
      if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
        const movedItem = detailImageList.value.splice(oldIndex, 1)[0]
        detailImageList.value.splice(newIndex, 0, movedItem)
        // 更新 formData 中的顺序
        updateDetailImagesFromList()
        ElMessage.success('排序已更新')
      }
    },
  })
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

// 触发详情图上传
const triggerDetailImageUpload = () => {
  if ((detailImageList.value?.length || 0) >= 9) {
    ElMessage.warning('最多只能上传9张详情图!')
    return
  }
  detailImageInputRef.value?.click()
}

// 处理详情图文件选择
const handleDetailImageFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  const remainingSlots = 9 - (detailImageList.value?.length || 0)
  const filesToUpload = Array.from(files).slice(0, remainingSlots)

  if (files.length > remainingSlots) {
    ElMessage.warning(`最多只能上传${remainingSlots}张图片`)
  }

  // 上传每个文件
  for (const file of filesToUpload) {
    // 验证文件
    if (!beforeDetailImageUpload(file)) {
      continue
    }

    // 创建 FormData
    const formData = new FormData()
    formData.append('file', file)

    try {
      // 上传文件
      const response = await fetch(uploadAction.value, {
        method: 'POST',
        headers: {
          ...uploadHeaders.value,
        },
        body: formData,
      })

      const result = await response.json()
      const url = result?.data?.url || result?.url || result

      if (url) {
        // 创建 UploadFile 对象
        const uploadFile: UploadFile = {
          uid: Date.now() + Math.random(),
          name: file.name,
          status: 'success',
          url: url,
          response: result,
        }

        detailImageList.value.push(uploadFile)
        updateDetailImagesFromList()
        nextTick(() => {
          initSortable()
        })
        ElMessage.success(`${file.name} 上传成功`)
      } else {
        ElMessage.error(`${file.name} 上传失败：未获取到文件URL`)
      }
    } catch (error: any) {
      ElMessage.error(`${file.name} 上传失败: ${error.message || '网络错误'}`)
    }
  }

  // 清空文件选择
  target.value = ''
}

// 根据单位值获取中文名称
const getUnitLabel = (unitValue: string): string => {
  if (!unitValue) return ''
  const unitOption = unitOptions.value.find(opt => opt.value === unitValue)
  return unitOption ? unitOption.label : unitValue
}

// 格式化转换率显示（整数不显示小数，小数保留原样）
const formatConversionRate = (value: number | string): string => {
  if (value === null || value === undefined || value === '') {
    return ''
  }
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) {
    return ''
  }
  // 如果是整数，直接返回整数字符串
  if (Number.isInteger(num)) {
    return num.toString()
  }
  // 如果是小数，转换为字符串并去除末尾不必要的0
  const str = num.toString()
  // 如果以 .0 结尾，去除小数部分
  if (str.endsWith('.0')) {
    return str.replace('.0', '')
  }
  // 去除末尾的0，但保留小数点
  return str.replace(/\.?0+$/, '')
}

// 格式化转换率用于显示（在输入框中）
const formatConversionRateDisplay = (value: number | string | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return ''
  }
  return formatConversionRate(value)
}

// 处理转换率输入
const handleConversionRateInput = (index: number, value: string) => {
  if (!formData.auxiliaryUnits || !formData.auxiliaryUnits[index]) {
    return
  }
  const auxUnit = formData.auxiliaryUnits[index]

  // 允许用户输入，暂时不更新值，等失焦时再处理
  // 这里只做基本验证
  if (value === '' || value === null || value === undefined) {
    return
  }

  // 允许输入数字和小数点
  const num = parseFloat(value)
  if (!isNaN(num) && num >= 0.0001) {
    auxUnit.conversionRate = num
  }
}

// 处理转换率失焦事件（格式化显示）
const handleConversionRateBlur = (index: number, e: Event) => {
  if (!formData.auxiliaryUnits || !formData.auxiliaryUnits[index]) {
    return
  }
  const auxUnit = formData.auxiliaryUnits[index]
  const input = e.target as HTMLInputElement
  const value = input.value

  if (value === null || value === undefined || value === '') {
    auxUnit.conversionRate = 1
    updatePackagingSpec(index)
    return
  }

  const num = parseFloat(value)
  if (isNaN(num) || num < 0.0001) {
    auxUnit.conversionRate = 1
    updatePackagingSpec(index)
    return
  }

  // 确保值是数字类型，并格式化显示
  auxUnit.conversionRate = num
  updatePackagingSpec(index)
}

// 更新包装规格（根据辅助单位、转换率和主单位自动计算）
const updatePackagingSpec = (index: number) => {
  if (!formData.auxiliaryUnits || !formData.auxiliaryUnits[index]) {
    return
  }
  const auxUnit = formData.auxiliaryUnits[index]
  const mainUnit = formData.unit

  // 如果单位名称、转换率和主单位都有值，自动计算包装规格
  if (auxUnit.unit && auxUnit.conversionRate && mainUnit) {
    const mainUnitLabel = getUnitLabel(mainUnit)
    const auxUnitLabel = getUnitLabel(auxUnit.unit)
    // 格式化转换率显示（整数不显示小数）
    const conversionRateStr = formatConversionRate(auxUnit.conversionRate)
    auxUnit.description = `${conversionRateStr}${mainUnitLabel}/${auxUnitLabel}`
  } else {
    auxUnit.description = ''
  }
}

// 更新所有辅助单位的包装规格（当主单位变化时）
const updateAllPackagingSpecs = () => {
  if (!formData.auxiliaryUnits) {
    return
  }
  formData.auxiliaryUnits.forEach((_, index) => {
    updatePackagingSpec(index)
  })
}

// 处理用途变化（确保一个用途只能有一个辅助单位）
const handlePurposeChange = (index: number) => {
  if (!formData.auxiliaryUnits || !formData.auxiliaryUnits[index]) {
    return
  }
  const currentUnit = formData.auxiliaryUnits[index]
  const newPurpose = currentUnit.purpose

  // 检查是否已有相同用途的辅助单位
  const duplicateIndex = formData.auxiliaryUnits.findIndex(
    (unit, idx) => idx !== index && unit.purpose === newPurpose
  )

  if (duplicateIndex !== -1) {
    // 如果存在重复，恢复原来的用途
    ElMessage.warning(`用途"${getPurposeLabel(newPurpose)}"已存在，一个用途只能有一个辅助单位`)
    // 恢复为默认值或清空
    currentUnit.purpose = 'sales'
    // 检查销售用途是否已存在
    const salesExists = formData.auxiliaryUnits.some(
      (unit, idx) => idx !== index && unit.purpose === 'sales'
    )
    if (salesExists) {
      currentUnit.purpose = 'purchase'
    }
  }
}

// 获取用途标签
const getPurposeLabel = (purpose: 'sales' | 'purchase' | 'internal' | 'external' | string): string => {
  const map: Record<string, string> = {
    sales: '销售',
    purchase: '采购',
    internal: '内包',
    external: '外包',
  }
  return map[purpose] || purpose
}

// 添加辅助单位
const addAuxiliaryUnit = () => {
  if (!formData.auxiliaryUnits) {
    formData.auxiliaryUnits = []
  }

  // 找到第一个未使用的用途
  const allPurposes: Array<'sales' | 'purchase' | 'internal' | 'external'> = ['sales', 'purchase', 'internal', 'external']
  const usedPurposes = formData.auxiliaryUnits.map(unit => unit.purpose)
  const availablePurpose: 'sales' | 'purchase' | 'internal' | 'external' = allPurposes.find(p => !usedPurposes.includes(p)) || 'sales'

  formData.auxiliaryUnits.push({
    unit: '',
    conversionRate: 1,
    purpose: availablePurpose,
    description: '',
  })
}

// 删除辅助单位
const removeAuxiliaryUnit = (index: number) => {
  if (formData.auxiliaryUnits && formData.auxiliaryUnits.length > index) {
    formData.auxiliaryUnits.splice(index, 1)
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    submitLoading.value = true

    // 提交前更新所有辅助单位的包装规格
    if (formData.auxiliaryUnits && formData.auxiliaryUnits.length > 0) {
      formData.auxiliaryUnits.forEach((_, index) => {
        updatePackagingSpec(index)
      })
    }

    // 过滤掉无效的辅助单位（单位名称为空的）
    const validAuxiliaryUnits = formData.auxiliaryUnits?.filter(
      (aux) => aux.unit && aux.unit.trim() !== ''
    ) || []

    // 构建提交数据，包含动态分类字段
    const submitData: CreateProductDto & Record<string, any> = {
      name: formData.name,
      code: formData.code || undefined,
      category: formData.category || undefined,
      specification: formData.specification || undefined,
      unit: formData.unit || undefined,
      auxiliaryUnits: validAuxiliaryUnits.length > 0 ? validAuxiliaryUnits : undefined,
      price: formData.price,
      costPrice: formData.costPrice || undefined,
      status: formData.status,
      mainImage: formData.mainImage || undefined,
      detailImages: formData.detailImages || undefined,
      description: formData.description || undefined,
    }

    // 添加动态分类字段
    categoryFields.value.forEach((field) => {
      const value = formData[field.fieldKey]
      if (value !== undefined && value !== null && value !== '') {
        submitData[field.fieldKey] = value
      }
    })

    if (isEdit.value) {
      await productApi.update(currentId.value, submitData)
      ElMessage.success('更新成功')
    } else {
      await productApi.create(submitData)
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
  loadTenantProductConfig()
  loadUnitOptions()
})
</script>

<style scoped lang="scss">
@use '@/styles/common/table-layout.scss';

.product-management {
  @extend .table-page;
}

.product-image-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  cursor: zoom-in;
  display: block;
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

// 主图容器
.main-image-container {
  position: relative;
  display: inline-block;

  .main-image-delete {
    position: absolute;
    top: -8px;
    right: -8px;
    z-index: 10;
  }
}

// 详情图容器
.detail-images-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;

  .detail-upload-card {
    width: 104px;
    height: 104px;
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--el-transition-duration-fast);
    background: #fafafa;

    &:hover {
      border-color: var(--el-color-primary);
      background: #f0f9ff;
    }

    .upload-icon {
      font-size: 28px;
      color: #8c939d;
    }
  }
}

// 可拖拽的图片列表
.sortable-image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.sortable-image-item {
  position: relative;
  width: 104px;
  height: 104px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;
  cursor: move;
  transition: all 0.3s;

  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

    .image-actions {
      opacity: 1;
    }
  }

  .detail-image {
    width: 100%;
    height: 100%;
    cursor: move;
  }

  .image-actions {
    position: absolute;
    top: 4px;
    right: 4px;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .image-order {
    position: absolute;
    bottom: 4px;
    left: 4px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }
}

// 拖拽状态样式
.sortable-ghost {
  opacity: 0.4;
  background: var(--el-color-primary-light-9);
}

.sortable-chosen {
  border-color: var(--el-color-primary);
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.3);
}

.sortable-drag {
  opacity: 0.8;
}

/* 详情图预览样式修正（覆盖 Element Plus 默认样式） */
:deep(.el-image-viewer__wrapper) {
  position: fixed;
  inset: 0;
  z-index: 3000;
}

:deep(.el-image-viewer__mask) {
  background-color: rgba(0, 0, 0, 0.6);
}

:deep(.el-image-viewer__canvas) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-image-viewer__img) {
  max-width: 80vw;
  max-height: 80vh;
}
</style>

