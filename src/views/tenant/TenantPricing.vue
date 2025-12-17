<template>
  <div class="tenant-content-section">
    <h2 class="tenant-content-title">价格配置</h2>
    <el-form
      ref="pricingFormRef"
      :model="pricingForm"
      :rules="pricingRules"
      label-width="180px"
      style="max-width: 900px"
    >
      <el-form-item label="价格计算模式" prop="pricingMode">
        <el-radio-group v-model="pricingForm.pricingMode">
          <el-radio value="simple">简单模式（单一单价）</el-radio>
          <el-radio value="complex">复杂模式（价格组成项）</el-radio>
        </el-radio-group>
        <div class="form-tip">简单模式：只需要一个单价字段；复杂模式：单价由多个价格组成项计算得出</div>
      </el-form-item>

      <template v-if="pricingForm.pricingMode === 'complex'">
        <el-divider content-position="left">价格组成项配置</el-divider>
        <el-form-item label="价格组成项" prop="priceComponents">
          <div class="price-components-list">
            <el-table
              ref="priceComponentsTableRef"
              :data="pricingForm.priceComponents"
              border
              style="width: 100%"
              row-key="key"
            >
              <el-table-column label="排序" width="70" align="center">
                <template #default>
                  <el-icon class="price-component-drag-handle" style="cursor: move; color: #909399;">
                    <Rank />
                  </el-icon>
                </template>
              </el-table-column>
              <el-table-column
                type="index"
                label="序号"
                width="60"
                align="center"
                :index="(index: number) => index + 1"
              />
              <el-table-column label="字段Key" width="180">
                <template #default="{ row }">
                  <span>{{ row.key || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="显示名称" width="150">
                <template #default="{ row }">
                  <el-input
                    v-model="row.label"
                    placeholder="如：出厂价"
                    @change="handlePriceComponentLabelChange(row)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="是否必填" width="100" align="center">
                <template #default="{ row }">
                  <el-checkbox v-model="row.required" />
                </template>
              </el-table-column>
              <el-table-column label="默认值" width="120">
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.defaultValue"
                    :min="0"
                    :precision="2"
                    :controls="false"
                    style="width: 100%"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center">
                <template #default="{ $index }">
                  <el-button
                    type="danger"
                    size="small"
                    :icon="Delete"
                    @click="removePriceComponent($index)"
                  />
                </template>
              </el-table-column>
            </el-table>
            <el-button
              type="primary"
              :icon="Plus"
              @click="addPriceComponent"
              style="margin-top: 10px"
            >
              添加价格组成项
            </el-button>
          </div>
        </el-form-item>
      </template>

      <el-form-item>
        <el-button type="primary" @click="updatePricingConfig" :loading="pricingLoading">
          保存配置
        </el-button>
        <el-button @click="resetPricingForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Delete, Rank } from '@element-plus/icons-vue'
import Sortable from 'sortablejs'
import { useAuthStore } from '@/stores/modules/auth'
import {
  tenantApi,
  type TenantPricingConfig,
  type PriceComponentConfig,
} from '@/api/tenant'
import { pinyin } from 'pinyin-pro'

const authStore = useAuthStore()

// 租户信息
const tenantInfo = computed(() => authStore.currentTenant)
const isTenantOwner = computed(() => authStore.isTenantOwner)

// 价格配置
const pricingFormRef = ref<FormInstance>()
const priceComponentsTableRef = ref()
const pricingForm = reactive<TenantPricingConfig>({
  pricingMode: 'simple',
  priceComponents: [],
})
const pricingLoading = ref(false)

// 拖拽排序实例（使用 any 避免构建器对联合类型解析问题）
let priceComponentsSortable: any = null

// 价格配置表单验证规则
const pricingRules: FormRules = {
  pricingMode: [
    { required: true, message: '请选择价格计算模式', trigger: 'change' }
  ],
  priceComponents: [
    {
      validator: (rule: unknown, value: PriceComponentConfig[] | undefined, callback: (error?: Error) => void) => {
        if (pricingForm.pricingMode === 'complex') {
          if (!value || value.length === 0) {
            callback(new Error('复杂模式下至少需要配置一个价格组成项'))
            return
          }
          // 检查是否有重复的key
          const keys = value.map((item: PriceComponentConfig) => item.key).filter(Boolean)
          const uniqueKeys = new Set(keys)
          if (keys.length !== uniqueKeys.size) {
            callback(new Error('价格组成项的字段Key不能重复'))
            return
          }
          // 检查必填项
          const hasEmptyKey = value.some((item: PriceComponentConfig) => !item.key || !item.label)
          if (hasEmptyKey) {
            callback(new Error('请填写所有价格组成项的字段Key和显示名称'))
            return
          }
        }
        callback()
      },
      trigger: 'change',
    },
  ],
}

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

// 当价格组成项的显示名称变化时，如果 key 为空，则自动根据名称生成 key
const handlePriceComponentLabelChange = (row: PriceComponentConfig) => {
  if (!row) return
  // 仅在 key 为空或全是空白时自动生成，避免覆盖用户手工修改过的 key
  if (!row.key || !row.key.trim()) {
    const autoKey = generateKeyFromLabel(row.label || '')
    if (autoKey) {
      // key 中不使用下划线，统一使用连续拼音
      row.key = autoKey.replace(/_/g, '')
    }
  }
}

// 初始化价格组成项拖拽排序
const initPriceComponentsSortable = () => {
  if (priceComponentsSortable) {
    priceComponentsSortable.destroy()
    priceComponentsSortable = null
  }

  nextTick(() => {
    const tableEl = priceComponentsTableRef.value?.$el
    if (!tableEl) return

    const tbody = tableEl.querySelector('.el-table__body-wrapper tbody')
    if (!tbody) return

    priceComponentsSortable = Sortable.create(tbody, {
      handle: '.price-component-drag-handle',
      animation: 150,
      onEnd: (evt) => {
        const { oldIndex, newIndex } = evt
        if (
          oldIndex === undefined ||
          newIndex === undefined ||
          oldIndex === newIndex ||
          !pricingForm.priceComponents
        ) {
          return
        }

        const moved = pricingForm.priceComponents.splice(oldIndex, 1)[0]
        pricingForm.priceComponents.splice(newIndex, 0, moved)

        // 重新计算 order（从 1 开始）
        pricingForm.priceComponents.forEach((item, idx) => {
          item.order = idx + 1
        })
      },
    })
  })
}

// 添加价格组成项
const addPriceComponent = () => {
  if (!pricingForm.priceComponents) {
    pricingForm.priceComponents = []
  }
  const maxOrder = pricingForm.priceComponents.length > 0
    ? Math.max(...pricingForm.priceComponents.map(item => item.order || 0))
    : 0
  pricingForm.priceComponents.push({
    key: '',
    label: '',
    required: false,
    defaultValue: 0,
    order: maxOrder + 1,
  })

  initPriceComponentsSortable()
}

// 移除价格组成项
const removePriceComponent = (index: number) => {
  if (pricingForm.priceComponents) {
    pricingForm.priceComponents.splice(index, 1)
    // 删除后重排 order
    pricingForm.priceComponents.forEach((item, idx) => {
      item.order = idx + 1
    })
    // 重新初始化拖拽
    initPriceComponentsSortable()
  }
}

// 加载价格配置
const loadPricingConfig = async () => {
  if (!tenantInfo.value?.id || !isTenantOwner.value) {
    return
  }
  try {
    const response = await tenantApi.getPricingConfig(tenantInfo.value.id)
    if (response.code === 200) {
      Object.assign(pricingForm, {
        pricingMode: response.data.pricingMode || 'simple',
        priceComponents: response.data.priceComponents || [],
      })
      initPriceComponentsSortable()
    }
  } catch (error) {
    console.error('加载价格配置失败:', error)
    // 如果配置不存在，使用默认值
    Object.assign(pricingForm, {
      pricingMode: 'simple',
      priceComponents: [],
    })
    initPriceComponentsSortable()
  }
}

// 更新价格配置
const updatePricingConfig = async () => {
  if (!pricingFormRef.value || !tenantInfo.value?.id) {
    return
  }
  try {
    await pricingFormRef.value.validate()
    pricingLoading.value = true

    const config: TenantPricingConfig = {
      pricingMode: pricingForm.pricingMode,
      priceComponents: pricingForm.pricingMode === 'complex' ? pricingForm.priceComponents : [],
    }

    const response = await tenantApi.updatePricingConfig(tenantInfo.value.id, config)
    if (response.code === 200) {
      ElMessage.success('价格配置保存成功')
      await loadPricingConfig()
    }
  } catch (error: unknown) {
    if (error !== false) {
      console.error('保存价格配置失败:', error)
      const message = error instanceof Error ? error.message : '保存价格配置失败'
      ElMessage.error(message)
    }
  } finally {
    pricingLoading.value = false
  }
}

// 重置价格配置表单
const resetPricingForm = () => {
  loadPricingConfig()
}

onMounted(() => {
  loadPricingConfig()
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

