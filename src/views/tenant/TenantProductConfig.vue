<template>
  <div class="tenant-content-section">
    <h2 class="tenant-content-title">产品配置</h2>

    <!-- 分类字段配置 -->
    <div style="margin-bottom: 32px;">
      <!-- 工具栏 -->
      <div class="toolbar" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 14px; font-weight: 500;">分类字段配置</span>
        <el-button type="primary" size="small" :icon="Plus" @click="addCategoryField">
          添加字段
        </el-button>
      </div>
      <!-- 表格 -->
      <el-table
        :data="productConfigForm.categoryFields"
        border
        v-loading="productConfigLoading"
        style="width: 100%"
        row-key="fieldKey"
        ref="categoryFieldsTableRef"
      >
        <el-table-column label="排序" width="60" align="center">
          <template #default>
            <el-icon class="drag-handle" style="cursor: move; color: #909399;">
              <Rank />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column type="index" label="序号" width="60" align="center" :index="(index: number) => index + 1" />
        <el-table-column label="字段Key" width="160">
          <template #default="{ row }">
            <span>{{ row.fieldKey || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="显示名称" width="160">
          <template #default="{ row }">
            <el-input
              v-model="row.fieldName"
              placeholder="如 品牌"
              @change="handleCategoryFieldNameChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="编码长度" width="120" align="center">
          <template #default="{ row }">
            <el-input-number
              v-model="row.codeLength"
              :min="1"
              :max="10"
              :precision="0"
              :controls="false"
              style="width: 100%"
            />
          </template>
        </el-table-column>
        <el-table-column label="必填" width="80" align="center">
          <template #default="{ row }">
            <el-checkbox v-model="row.required" />
          </template>
        </el-table-column>
        <el-table-column label="级联" width="80" align="center">
          <template #default="{ row }">
            <el-checkbox v-model="row.isCascade" />
          </template>
        </el-table-column>
        <el-table-column label="参与编码" width="100" align="center">
          <template #default="{ row }">
            <el-checkbox v-model="row.participateInCode" />
          </template>
        </el-table-column>
        <el-table-column label="上级字段" width="160">
          <template #default="{ row, $index }">
            <el-select
              v-model="row.parentFieldKey"
              placeholder="选择上级字段"
              clearable
              filterable
              style="width: 100%"
            >
              <el-option
                v-for="(field, index) in productConfigForm.categoryFields"
                :key="field.fieldKey"
                :label="field.fieldName"
                :value="field.fieldKey"
                :disabled="index >= $index"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="关联字典" width="200">
          <template #default="{ row }">
            <el-select
              v-model="row.dictTypeCode"
              placeholder="选择字典类型"
              clearable
              filterable
              style="width: 100%"
            >
              <el-option
                v-for="dictType in availableDictTypes"
                :key="dictType.code"
                :label="`${dictType.name}（${dictType.code}）`"
                :value="dictType.code"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ $index }">
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="removeCategoryField($index)"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 编码规则 -->
    <div>
      <!-- 工具栏 -->
      <div class="toolbar" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 14px; font-weight: 500;">产品编码规则</span>
        <el-button type="primary" size="small" :icon="Plus" @click="addCodeRuleSegment">
          添加片段
        </el-button>
      </div>
      <el-table
        :data="productConfigForm.codeRule?.segments || []"
        border
        style="width: 100%"
        row-key="id"
        ref="codeRuleTableRef"
      >
        <el-table-column label="排序" width="60" align="center">
          <template #default>
            <el-icon class="code-rule-drag-handle" style="cursor: move; color: #909399;">
              <Rank />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column label="顺序" width="80" align="center">
          <template #default="{ row, $index }">
            {{ $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="类型" width="140">
          <template #default="{ row }">
            <el-select v-model="row.segmentType" placeholder="选择类型" style="width: 120px">
              <el-option label="常量" value="CONST" />
              <el-option label="字段" value="FIELD" />
              <el-option label="日期" value="DATE" />
              <el-option label="流水号" value="SEQ" />
              <el-option label="分隔符" value="SEP" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="值" min-width="200">
          <template #default="{ row }">
            <!-- 如果类型是字段，显示下拉选择 -->
            <el-select
              v-if="row.segmentType === 'FIELD'"
              v-model="row.segmentValue"
              placeholder="选择分类字段"
              style="width: 100%"
              filterable
            >
              <el-option
                v-for="field in productConfigForm.categoryFields"
                :key="field.fieldKey"
                :label="`${field.fieldName}（${field.fieldKey}）`"
                :value="field.fieldKey"
              />
            </el-select>
            <!-- 其他类型显示输入框 -->
            <el-input
              v-else
              v-model="row.segmentValue"
              :placeholder="row.segmentType === 'CONST'
                ? '输入常量内容，如 PRD'
                : row.segmentType === 'DATE'
                  ? '日期格式，如 YYYYMMDD'
                  : row.segmentType === 'SEQ'
                    ? '流水号Key（预留）'
                    : '分隔符，如 -'"
            />
          </template>
        </el-table-column>
        <el-table-column label="长度" width="100" align="center">
          <template #default="{ row }">
            <el-input-number v-model="row.length" :min="1" :max="20" :precision="0" />
          </template>
        </el-table-column>
        <el-table-column label="补齐字符" width="120" align="center">
          <template #default="{ row }">
            <el-input v-model="row.padChar" maxlength="1" placeholder="默认0" />
          </template>
        </el-table-column>
        <el-table-column label="方向" width="120" align="center">
          <template #default="{ row }">
            <el-select v-model="row.padDirection" placeholder="方向" style="width: 100px">
              <el-option label="左补齐" value="LEFT" />
              <el-option label="右补齐" value="RIGHT" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ $index }">
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="removeCodeRuleSegment($index)"
            />
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div class="form-tip">
            编码预览示例会根据当前规则和示例分类字段生成，实际生产编码将在创建产品时由后端生成。
          </div>
        </div>
        <div>
          <el-button @click="previewProductCode" :loading="productPreviewLoading">
            预览编码
          </el-button>
        </div>
      </div>
      <div v-if="productCodePreview" style="margin-top: 12px;">
        <el-alert type="success" :closable="false">
          <template #title>
            编码预览：{{ productCodePreview }}
          </template>
        </el-alert>
      </div>
    </div>

    <!-- 产品名称规则 -->
    <div style="margin-top: 32px;">
      <!-- 工具栏 -->
      <div class="toolbar" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 14px; font-weight: 500;">产品名称规则</span>
        <el-button type="primary" size="small" :icon="Plus" @click="addNameRuleSegment">
          添加片段
        </el-button>
      </div>
      <el-table
        :data="(productConfigForm.nameRule && productConfigForm.nameRule.segments) ? productConfigForm.nameRule.segments : []"
        border
        style="width: 100%"
        row-key="id"
        ref="nameRuleTableRef"
      >
        <el-table-column label="排序" width="60" align="center">
          <template #default>
            <el-icon class="name-rule-drag-handle" style="cursor: move; color: #909399;">
              <Rank />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column label="顺序" width="80" align="center">
          <template #default="{ row, $index }">
            {{ $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="类型" width="140">
          <template #default="{ row }">
            <el-select v-model="row.segmentType" placeholder="选择类型" style="width: 120px">
              <el-option label="常量" value="CONST" />
              <el-option label="字段" value="FIELD" />
              <el-option label="分隔符" value="SEP" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="值" min-width="200">
          <template #default="{ row }">
            <!-- 如果类型是字段，显示下拉选择 -->
            <el-select
              v-if="row.segmentType === 'FIELD'"
              v-model="row.segmentValue"
              placeholder="选择分类字段"
              style="width: 100%"
              filterable
            >
              <el-option
                v-for="field in productConfigForm.categoryFields"
                :key="field.fieldKey"
                :label="`${field.fieldName}（${field.fieldKey}）`"
                :value="field.fieldKey"
              />
            </el-select>
            <!-- 其他类型显示输入框 -->
            <el-input
              v-else
              v-model="row.segmentValue"
              :placeholder="row.segmentType === 'CONST'
                ? '输入常量内容'
                : '分隔符，如 -'"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ $index }">
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="removeNameRuleSegment($index)"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 保存按钮 -->
    <div style="margin-top: 24px; text-align: right;">
      <el-button type="primary" :loading="productConfigSaving" @click="saveProductConfig">
        保存配置
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete, Rank } from '@element-plus/icons-vue'
import Sortable from 'sortablejs'
import { useAuthStore } from '@/stores/modules/auth'
import {
  tenantApi,
  type TenantProductConfig,
  type ProductCategoryFieldConfig,
  type ProductCodeRuleSegment,
  type ProductNameRuleSegment,
} from '@/api/tenant'
import dictionaryApi, { type DictType } from '@/api/dictionary'
import { pinyin } from 'pinyin-pro'

const authStore = useAuthStore()

// 租户信息
const tenantInfo = computed(() => authStore.currentTenant)
const isTenantOwner = computed(() => authStore.isTenantOwner)

// 产品配置
const productConfigLoading = ref(false)
const productConfigSaving = ref(false)
const productPreviewLoading = ref(false)
const productConfigForm = reactive<TenantProductConfig>({
  categoryFields: [],
  categoryValues: [],
  codeRule: {
    segments: [],
  },
  nameRule: {
    segments: [],
  },
})

// 分类字段 / 编码规则 / 名称规则 表格引用（用于拖拽排序）
const categoryFieldsTableRef = ref()
const codeRuleTableRef = ref()
const nameRuleTableRef = ref()
let categoryFieldsSortable: Sortable | null = null
let codeRuleSortable: Sortable | null = null
let nameRuleSortable: Sortable | null = null
const productCodePreview = ref('')

// 用于产品配置中选择字典类型的列表（只加载一次）
const allDictTypes = ref<DictType[]>([])

// 计算属性：可用的字典类型（用于产品配置中的下拉选择）
const availableDictTypes = computed(() => {
  return allDictTypes.value.filter(type => type.status === 'active')
})

// 将名称转换为拼音风格的 key：全中文用拼音，中英文混合则中文转拼音、字母数字保留
const generateKeyFromLabel = (label: string): string => {
  if (!label) return ''
  // 使用 pinyin-pro 将中文转为无声调全拼，其它字符原样保留
  const full = pinyin(label, {
    toneType: 'none',
    type: 'array',
    nonZh: 'spaced',
  }) as string[]

  const joined = full
    .join(' ')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()

  if (!joined) return ''

  return joined
    .split(/\s+/)
    .map((word) => word.toLowerCase())
    .join('_')
}

// 当分类字段的显示名称变化时，自动根据名称生成 fieldKey
const handleCategoryFieldNameChange = (row: ProductCategoryFieldConfig) => {
  if (!row) return
  // 自动生成 fieldKey（不使用下划线，统一使用连续拼音）
  const autoKey = generateKeyFromLabel(row.fieldName || '')
  if (autoKey) {
    row.fieldKey = autoKey.replace(/_/g, '')
  }
}

// 产品分类字段：新增一行
const addCategoryField = () => {
  const newLevel = productConfigForm.categoryFields.length + 1
  const fieldName = `分类${newLevel}`
  const autoKey = generateKeyFromLabel(fieldName)
  const newField: ProductCategoryFieldConfig = {
    fieldKey: autoKey ? autoKey.replace(/_/g, '') : `field${newLevel}`,
    fieldName: fieldName,
    level: newLevel,
    required: true,
    isCascade: true,
    participateInCode: true,
    codeLength: 2,
  }
  productConfigForm.categoryFields.push(newField)
  // 重新初始化拖拽排序
  initCategoryFieldsSortable()
}

// 删除分类字段
const removeCategoryField = (index: number) => {
  productConfigForm.categoryFields.splice(index, 1)
  // 更新层级（根据顺序自动计算）
  productConfigForm.categoryFields.forEach((field, idx) => {
    field.level = idx + 1
  })
  // 重新初始化拖拽排序
  initCategoryFieldsSortable()
}

// 产品编码规则：新增片段
const addCodeRuleSegment = () => {
  if (!productConfigForm.codeRule) {
    productConfigForm.codeRule = { segments: [] }
  }
  const segments = productConfigForm.codeRule.segments
  const maxOrder = segments.length ? Math.max(...segments.map(s => s.orderNo || 0)) : 0
  const seg: ProductCodeRuleSegment = {
    id: `seg_${Date.now()}_${maxOrder + 1}`,
    orderNo: maxOrder + 1,
    segmentType: 'CONST',
    segmentValue: '',
  }
  segments.push(seg)

  // 新增后重新初始化拖拽
  initCodeRuleSortable()
}

// 删除编码规则片段
const removeCodeRuleSegment = (index: number) => {
  if (!productConfigForm.codeRule) return
  productConfigForm.codeRule.segments.splice(index, 1)

  // 删除后重新初始化拖拽
  initCodeRuleSortable()
}

// 产品名称规则：新增片段
const addNameRuleSegment = () => {
  if (!productConfigForm.nameRule) {
    productConfigForm.nameRule = { segments: [] }
  }
  const segments = productConfigForm.nameRule.segments
  const maxOrder = segments.length ? Math.max(...segments.map(s => s.orderNo || 0)) : 0
  const seg: ProductNameRuleSegment = {
    id: `name_${Date.now()}_${maxOrder + 1}`,
    orderNo: maxOrder + 1,
    segmentType: 'SEP',
    segmentValue: '-',
  }
  segments.push(seg)

  // 新增后重新初始化拖拽
  initNameRuleSortable()
}

// 删除名称规则片段
const removeNameRuleSegment = (index: number) => {
  if (!productConfigForm.nameRule) return
  productConfigForm.nameRule.segments.splice(index, 1)

  // 删除后重新初始化拖拽
  initNameRuleSortable()
}

// 初始化分类字段表格拖拽排序
const initCategoryFieldsSortable = () => {
  if (categoryFieldsSortable) {
    categoryFieldsSortable.destroy()
    categoryFieldsSortable = null
  }

  nextTick(() => {
    const tableEl = categoryFieldsTableRef.value?.$el
    if (!tableEl) return

    const tbody = tableEl.querySelector('.el-table__body-wrapper tbody')
    if (!tbody) return

    categoryFieldsSortable = Sortable.create(tbody, {
      handle: '.drag-handle', // 拖拽手柄
      animation: 150,
      onEnd: (evt) => {
        const { oldIndex, newIndex } = evt
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return

        // 移动数组元素
        const movedItem = productConfigForm.categoryFields.splice(oldIndex, 1)[0]
        productConfigForm.categoryFields.splice(newIndex, 0, movedItem)

        // 更新层级（level = index + 1）
        productConfigForm.categoryFields.forEach((field, index) => {
          field.level = index + 1
        })
      },
    })
  })
}

// 初始化编码规则表格拖拽排序
const initCodeRuleSortable = () => {
  if (codeRuleSortable) {
    codeRuleSortable.destroy()
    codeRuleSortable = null
  }

  nextTick(() => {
    const tableEl = codeRuleTableRef.value?.$el
    if (!tableEl) return

    const tbody = tableEl.querySelector('.el-table__body-wrapper tbody')
    if (!tbody) return

    codeRuleSortable = Sortable.create(tbody, {
      handle: '.code-rule-drag-handle',
      animation: 150,
      onEnd: (evt) => {
        const { oldIndex, newIndex } = evt
        if (
          oldIndex === undefined ||
          newIndex === undefined ||
          oldIndex === newIndex ||
          !productConfigForm.codeRule
        )
          return

        const segments = productConfigForm.codeRule.segments
        const moved = segments.splice(oldIndex, 1)[0]
        segments.splice(newIndex, 0, moved)

        // 重新计算 orderNo
        segments.forEach((seg, idx) => {
          seg.orderNo = idx + 1
        })
      },
    })
  })
}

// 初始化名称规则表格拖拽排序
const initNameRuleSortable = () => {
  if (nameRuleSortable) {
    nameRuleSortable.destroy()
    nameRuleSortable = null
  }

  nextTick(() => {
    const tableEl = nameRuleTableRef.value?.$el
    if (!tableEl) return

    const tbody = tableEl.querySelector('.el-table__body-wrapper tbody')
    if (!tbody) return

    nameRuleSortable = Sortable.create(tbody, {
      handle: '.name-rule-drag-handle',
      animation: 150,
      onEnd: (evt) => {
        const { oldIndex, newIndex } = evt
        if (
          oldIndex === undefined ||
          newIndex === undefined ||
          oldIndex === newIndex ||
          !productConfigForm.nameRule
        )
          return

        const segments = productConfigForm.nameRule.segments
        const moved = segments.splice(oldIndex, 1)[0]
        segments.splice(newIndex, 0, moved)

        // 重新计算 orderNo
        segments.forEach((seg, idx) => {
          seg.orderNo = idx + 1
        })
      },
    })
  })
}

// 加载所有字典类型（用于产品配置中的下拉选择，不分页）
const loadAllDictTypes = async () => {
  try {
    const res = await dictionaryApi.getTypes({
      page: 1,
      limit: 1000, // 加载足够多的字典类型
    })
    if (res.code === 200) {
      allDictTypes.value = res.data.items || []
    }
  } catch (error) {
    console.error('加载字典类型列表失败:', error)
  }
}

// 加载产品配置
const loadProductConfig = async () => {
  if (!tenantInfo.value?.id || !isTenantOwner.value) return
  try {
    productConfigLoading.value = true
    const response = await tenantApi.getProductConfig(tenantInfo.value.id)
    if (response.code === 200 && response.data) {
      const data = response.data
      productConfigForm.categoryFields = data.categoryFields || []
      productConfigForm.categoryValues = data.categoryValues || []
      productConfigForm.codeRule = data.codeRule || { segments: [] }
      // 确保 nameRule 被正确赋值
      if (data.nameRule && data.nameRule.segments && Array.isArray(data.nameRule.segments)) {
        productConfigForm.nameRule = { segments: [...data.nameRule.segments] }
      } else {
        productConfigForm.nameRule = { segments: [] }
      }

      // 确保层级字段正确（按数组索引 + 1）
      productConfigForm.categoryFields.forEach((field, index) => {
        field.level = index + 1
      })

      // 初始化拖拽排序
      initCategoryFieldsSortable()
      initCodeRuleSortable()
      initNameRuleSortable()
    }
  } catch (error) {
    console.error('加载产品配置失败:', error)
    ElMessage.error('加载产品配置失败')
  } finally {
    productConfigLoading.value = false
  }
}

// 保存产品配置
const saveProductConfig = async () => {
  if (!tenantInfo.value?.id) return
  try {
    productConfigSaving.value = true

    // 确保 nameRule 存在
    if (!productConfigForm.nameRule) {
      productConfigForm.nameRule = { segments: [] }
    }

    const payload: TenantProductConfig = {
      categoryFields: productConfigForm.categoryFields || [],
      categoryValues: productConfigForm.categoryValues || [],
      codeRule: productConfigForm.codeRule || { segments: [] },
      nameRule: productConfigForm.nameRule || { segments: [] },
    }

    const response = await tenantApi.updateProductConfig(tenantInfo.value.id, payload)
    if (response.code === 200) {
      ElMessage.success('产品配置保存成功')
      await loadProductConfig()
    }
  } catch (error) {
    console.error('保存产品配置失败:', error)
    ElMessage.error('保存产品配置失败')
  } finally {
    productConfigSaving.value = false
  }
}

// 预览产品编码（简单示例：只基于字段的 fieldKey -> 示例 code）
const previewProductCode = async () => {
  if (!tenantInfo.value?.id) return
  if (!productConfigForm.codeRule || !productConfigForm.codeRule.segments.length) {
    ElMessage.warning('请先配置编码规则')
    return
  }
  try {
    productPreviewLoading.value = true
    const fieldCodes: Record<string, string> = {}
    productConfigForm.categoryFields.forEach((field, idx) => {
      // 用示例编码：如 F1、F2 等
      fieldCodes[field.fieldKey] = `F${idx + 1}`
    })
    const response = await tenantApi.previewProductCode(tenantInfo.value.id, {
      fieldCodes,
    })
    if (response.code === 200 && response.data) {
      productCodePreview.value = response.data.code
    }
  } catch (error) {
    console.error('预览产品编码失败:', error)
    ElMessage.error('预览产品编码失败')
  } finally {
    productPreviewLoading.value = false
  }
}

onMounted(() => {
  loadProductConfig()
  loadAllDictTypes() // 加载字典类型列表供选择
})
</script>

<style lang="scss" scoped>
@use '@/styles/common/tenant-layout.scss';

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>

