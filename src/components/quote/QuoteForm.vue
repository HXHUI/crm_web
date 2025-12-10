<template>
  <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" class="quote-form">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="客户" prop="customerId">
          <el-select
            v-model="formData.customerId"
            placeholder="请选择客户"
            filterable
            clearable
            style="width: 100%"
            :disabled="!!props.defaultCustomerId"
            @change="handleCustomerChange"
          >
            <el-option
              v-for="customer in availableCustomers"
              :key="customer.id"
              :label="customer.name"
              :value="parseInt(customer.id)"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="联系人" prop="contactId">
          <el-select
            v-model="formData.contactId"
            placeholder="请选择联系人（可选）"
            filterable
            clearable
            style="width: 100%"
            :disabled="!formData.customerId"
          >
            <el-option
              v-for="contact in availableContacts"
              :key="contact.id"
              :label="`${contact.name}${contact.position ? ' - ' + contact.position : ''}`"
              :value="parseInt(contact.id)"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="报价日期" prop="quoteDate">
          <el-date-picker
            v-model="formData.quoteDate"
            type="date"
            placeholder="请选择报价日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="有效期" prop="expiryDate">
          <el-date-picker
            v-model="formData.expiryDate"
            type="date"
            placeholder="请选择有效期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 开票信息 & 货运方式（根据客户档案自动带出，只读展示） -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="开票要求">
          <div class="info-text">
            <span v-if="customerProfile && customerProfile.invoiceRequirement">
              {{ invoiceRequirementText }}
            </span>
            <span v-else class="text-gray-400">请选择客户</span>
          </div>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="开票说明">
          <div class="info-text">
            <span v-if="customerProfile && customerProfile.invoiceRemark">
              {{ customerProfile.invoiceRemark }}
            </span>
            <span v-else class="text-gray-400">-</span>
          </div>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="货运方式">
          <div class="info-text">
            <span
              v-if="
                customerProfile &&
                customerProfile.shippingMethods &&
                customerProfile.shippingMethods.length
              "
            >
              {{ customerProfile.shippingMethods.map(method => getShippingMethodLabel(method)).join('，') }}
            </span>
            <span v-else class="text-gray-400">-</span>
          </div>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="商机" prop="opportunityId">
          <el-select
            v-model="formData.opportunityId"
            placeholder="请选择商机（可选）"
            filterable
            clearable
            style="width: 100%"
            :disabled="!formData.customerId"
          >
            <el-option
              v-for="opportunity in availableOpportunities"
              :key="opportunity.id"
              :label="opportunity.title"
              :value="parseInt(opportunity.id)"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 报价明细 -->
    <el-form-item label="报价明细" prop="items">
      <div class="quote-items-section">
        <el-table :data="formData.items" border style="width: 100%">
          <el-table-column label="产品" min-width="200">
            <template #default="{ row, $index }">
              <el-select
                v-model="row.productId"
                placeholder="请选择产品"
                filterable
                clearable
                style="width: 100%"
                @change="(val) => handleProductChange($index, val)"
              >
                <el-option
                  v-for="product in availableProducts"
                  :key="product.id"
                  :label="`${product.name} (${product.code || ''})`"
                  :value="parseInt(product.id)"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="包装数量" width="150">
            <template #default="{ row, $index }">
              <div style="display: flex; gap: 4px; align-items: center;">
                <el-input-number
                  :model-value="getDisplayQuantityForItem($index)"
                  :min="0.01"
                  :precision="2"
                  :controls="false"
                  style="flex: 1;"
                  @change="(val) => handlePackagingQuantityInput($index, val)"
                />
                <span style="color: #909399; font-size: 12px;">
                  {{ getPackagingUnitLabel(row) }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="主计量数量" width="150">
            <template #default="{ row, $index }">
              <div style="display: flex; gap: 4px; align-items: center;">
              <el-input-number
                v-model="row.quantity"
                :min="0.01"
                  :precision="2"
                  :controls="false"
                  style="flex: 1;"
                  @change="() => calculateItemAmount($index)"
                />
                <span style="color: #909399; font-size: 12px;">
                  {{ row._product?.unit ? getUnitLabel(row._product.unit) : '' }}
                </span>
              </div>
            </template>
          </el-table-column>
          <!-- 简单模式：显示单价字段 -->
          <el-table-column v-if="pricingConfig.pricingMode === 'simple'" label="单价" width="120">
            <template #default="{ row, $index }">
              <el-input-number
                :model-value="getDisplayUnitPriceForItem($index)"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%"
                @change="(val) => handleUnitPriceInput($index, val)"
              />
            </template>
          </el-table-column>
          <!-- 复杂模式：显示价格组成项 -->
          <template v-else>
            <el-table-column
              v-for="component in sortedPriceComponents"
              :key="component.key"
              :label="component.label"
              width="120"
            >
            <template #default="{ row, $index }">
              <el-input-number
                  v-model="(row.priceComponents || {})[component.key]"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%"
                  @change="calculateItemPriceComponents($index)"
              />
            </template>
          </el-table-column>
            <el-table-column label="单价" width="120" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.unitPrice || 0) }}
              </template>
            </el-table-column>
          </template>
          <el-table-column label="折扣(%)" width="120">
            <template #default="{ row, $index }">
              <el-input-number
                v-model="row.discount"
                :min="0"
                :max="100"
                :precision="2"
                :controls="false"
                style="width: 100%"
                @change="calculateItemAmount($index)"
              />
            </template>
          </el-table-column>
          <el-table-column label="税率(%)" width="120">
            <template #default="{ row, $index }">
              <el-input-number
                v-model="row.taxRate"
                :min="0"
                :max="100"
                :precision="2"
                :controls="false"
                style="width: 100%"
                @change="calculateItemTaxAmounts($index)"
              />
            </template>
          </el-table-column>
          <el-table-column label="不含税单价" width="130" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.unitPriceExclTax || 0) }}
            </template>
          </el-table-column>
          <el-table-column label="金额" width="120" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.amount || 0) }}
            </template>
          </el-table-column>
          <el-table-column label="不含税金额" width="130" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.amountExclTax || 0) }}
            </template>
          </el-table-column>
          <el-table-column label="税金" width="120" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.taxAmount || 0) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ $index }">
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                @click="removeItem($index)"
              />
            </template>
          </el-table-column>
        </el-table>
        <el-button
          type="primary"
          :icon="Plus"
          @click="addItem"
          style="margin-top: 10px"
        >
          添加明细
        </el-button>
        <div class="total-amount">
          <div class="total-row">
            <strong>不含税总金额：{{ formatCurrency(totalAmountExclTax) }}</strong>
          </div>
          <div class="total-row">
            <strong>总税金：{{ formatCurrency(totalTaxAmount) }}</strong>
          </div>
          <div class="total-row">
            <strong>总金额（含税）：{{ formatCurrency(totalAmount) }}</strong>
          </div>
        </div>
      </div>
    </el-form-item>

    <el-form-item label="备注" prop="notes">
      <el-input
        v-model="formData.notes"
        type="textarea"
        :rows="3"
        placeholder="请输入备注"
      />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import quoteApi, {
  type Quote,
  type CreateQuoteDto,
  type UpdateQuoteDto,
  type CreateQuoteItemDto,
} from '@/api/quote'
import customerApi, { type CustomerProfile } from '@/api/customer'
import productApi from '@/api/product'
import {
  getAvailableAuxiliaryUnits,
  getConversionRate,
  getDisplayQuantity,
  convertQuantityToMainUnit,
  getDisplayUnitPrice,
  convertUnitPriceToMainUnit,
  handlePackagingUnitChange,
  type ProductInfo,
} from '@/utils/packaging-unit'
import opportunityApi from '@/api/opportunity'
import { tenantApi, type TenantPricingConfig, type PriceComponentConfig } from '@/api/tenant'
import { useAuthStore } from '@/stores/modules/auth'
import dictionaryApi, { type DictItemTreeNode } from '@/api/dictionary'

interface Props {
  // 默认客户ID（如果提供，则隐藏客户选择，并设置为该值）
  defaultCustomerId?: string | number
  // 是否显示客户字段（即使提供了默认值）
  showCustomerField?: boolean
  // 编辑时的报价数据
  quote?: Quote | null
}

const props = withDefaults(defineProps<Props>(), {
  defaultCustomerId: undefined,
  showCustomerField: false,
  quote: null,
})

const emit = defineEmits<{
  submit: [data: CreateQuoteDto | UpdateQuoteDto]
  cancel: []
}>()

const formRef = ref<FormInstance>()

// 价格配置
const authStore = useAuthStore()
const pricingConfig = ref<TenantPricingConfig>({
  pricingMode: 'simple',
  priceComponents: [],
})
const pricingConfigLoading = ref(false)

// 默认税率
const defaultTaxRate = ref<number>(0)
const defaultTaxRateLoaded = ref<boolean>(false)

// 表单数据
interface FormData {
  id?: string
  customerId?: number
  contactId?: number
  opportunityId?: number
  quoteDate: string
  expiryDate?: string
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'accepted' | 'rejected' | 'expired'
  notes?: string
  items: Array<{
    productId?: number
    quantity: number
    packagingUnit?: string
    packagingSpec?: string
    unitPrice: number
    priceComponents?: Record<string, number>
    discount?: number
    taxRate?: number
    unitPriceExclTax?: number
    taxAmount?: number
    amountExclTax?: number
    notes?: string
    amount?: number
    _product?: ProductInfo
  }>
}

const formData = reactive<FormData>({
  customerId: undefined,
  contactId: undefined,
  opportunityId: undefined,
  quoteDate: '',
  expiryDate: '',
  status: 'draft',
  notes: '',
  items: [],
})

// 可用客户、联系人、产品和商机列表
const availableCustomers = ref<Array<{ id: string; name: string }>>([])
const availableContacts = ref<Array<{ id: string; name: string; position?: string }>>([])
const availableProducts = ref<Array<{ id: string; name: string; code?: string }>>([])
const availableOpportunities = ref<Array<{ id: string; title: string }>>([])

// 单位选项（从系统字典加载）
const unitOptions = ref<{ label: string; value: string }[]>([])

// 客户档案（用于开票信息、货运方式展示）
const customerProfile = ref<CustomerProfile | null>(null)

// 开票需求文案
const invoiceRequirementText = computed(() => {
  if (!customerProfile.value || !customerProfile.value.invoiceRequirement) return '-'
  const map: Record<string, string> = {
    special_vat: '增值税专用发票',
    normal_invoice: '普通发票',
    no_invoice: '无需开票',
  }
  return map[customerProfile.value.invoiceRequirement] || customerProfile.value.invoiceRequirement
})

// 获取货运方式中文标签
const getShippingMethodLabel = (value: string) => {
  const map: Record<string, string> = {
    dedicated_truck: '专车',
    logistics: '物流',
    self_pickup: '自提',
    courier: '快递',
  }
  return map[value] || value
}

// 排序后的价格组成项（按 order 排序）
const sortedPriceComponents = computed(() => {
  if (!pricingConfig.value.priceComponents) {
    return []
  }
  return [...pricingConfig.value.priceComponents].sort((a, b) => (a.order || 0) - (b.order || 0))
})

// 计算总金额
const totalAmount = computed(() => {
  return formData.items.reduce((sum, item) => {
    const amount = Number(item.amount) || 0
    return sum + amount
  }, 0)
})

// 计算不含税总金额
const totalAmountExclTax = computed(() => {
  return formData.items.reduce((sum, item) => {
    return sum + (item.amountExclTax || 0)
  }, 0)
})

// 计算总税金
const totalTaxAmount = computed(() => {
  return formData.items.reduce((sum, item) => {
    return sum + (item.taxAmount || 0)
  }, 0)
})

// 表单验证规则
const formRules: FormRules = {
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  quoteDate: [{ required: true, message: '请选择报价日期', trigger: 'change' }],
  expiryDate: [{ required: true, message: '请选择有效期', trigger: 'change' }],
  items: [
    { required: true, message: '请至少添加一条报价明细', trigger: 'change' },
    {
      validator: (_rule: unknown, value: CreateQuoteItemDto[] | undefined, callback: (error?: Error) => void) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少添加一条报价明细'))
          return
        }
        // 验证每个明细项是否都选择了产品
        const hasInvalidItem = value.some((item) => !item.productId || item.productId === 0 || item.productId === undefined)
        if (hasInvalidItem) {
          callback(new Error('请为所有明细项选择产品'))
          return
        }
        // 复杂模式下验证价格组成项
        if (pricingConfig.value.pricingMode === 'complex' && pricingConfig.value.priceComponents) {
          for (const item of value) {
            for (const component of pricingConfig.value.priceComponents) {
              if (component.required) {
                const v = item.priceComponents?.[component.key]
                if (v === undefined || v === null || Number(v) < 0) {
                  callback(new Error(`请填写所有必填的价格组成项"${component.label}"`))
                  return
                }
              }
            }
          }
        }
        callback()
      },
      trigger: 'change',
    },
  ],
}

// 格式化货币
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// 格式化数字（保留2位小数）
const formatNumber = (value: number) => {
  if (value === undefined || value === null) return '0.00'
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// 加载客户列表
const loadCustomers = async () => {
  try {
    const response = await customerApi.getList({ page: 1, limit: 1000 })
    if (response.code === 200) {
      availableCustomers.value = response.data.customers
    }
  } catch (error) {
    console.error('加载客户列表失败:', error)
  }
}

// 加载产品列表
const loadProducts = async () => {
  try {
    const response = await productApi.getList({ page: 1, limit: 1000, status: 'active' })
    if (response.code === 200) {
      availableProducts.value = response.data.products
    }
  } catch (error) {
    console.error('加载产品列表失败:', error)
  }
}

// 加载单位选项（从系统字典）
const loadUnitOptions = async () => {
  try {
    const res = await dictionaryApi.getItemsTree('product_unit')
    if (res.code === 200 && res.data) {
      // 扁平化字典树
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
      unitOptions.value = flattenItems(res.data)
    }
  } catch (error) {
    console.error('加载单位选项失败:', error)
    unitOptions.value = []
  }
}

// 加载价格配置
const loadPricingConfig = async () => {
  const tenantId = authStore.currentTenant?.id
  if (!tenantId) {
    return
  }
  try {
    pricingConfigLoading.value = true
    const response = await tenantApi.getPricingConfig(tenantId)
    if (response.code === 200) {
      pricingConfig.value = response.data
    } else {
      // 默认使用简单模式
      pricingConfig.value = {
        pricingMode: 'simple',
        priceComponents: [],
      }
    }
  } catch (error) {
    console.error('加载价格配置失败:', error)
    // 默认使用简单模式
    pricingConfig.value = {
      pricingMode: 'simple',
      priceComponents: [],
    }
  } finally {
    pricingConfigLoading.value = false
  }
}

// 加载商机列表（根据客户ID）
const loadOpportunities = async (customerId?: number) => {
  if (!customerId) {
    availableOpportunities.value = []
    return
  }

  try {
    const response = await opportunityApi.getList({ page: 1, limit: 1000, customerId: customerId.toString() })
    const res = response as any
    if (res.code === 200 && res.data) {
      availableOpportunities.value = (res.data.opportunities || []).map((opp: any) => ({
        id: opp.id,
        title: opp.title,
      }))
    }
  } catch (error) {
    console.error('加载商机列表失败:', error)
    availableOpportunities.value = []
  }
}

// 客户变化时加载联系人和商机
const handleCustomerChange = async () => {
  // 清空联系人选择
  formData.contactId = undefined
  availableContacts.value = []

  // 清空商机选择
  formData.opportunityId = undefined
  availableOpportunities.value = []

  // 清空客户档案
  customerProfile.value = null

  if (formData.customerId) {
    try {
      // 获取客户详情，包含联系人列表
      const response = await customerApi.getDetail(formData.customerId.toString())
      if (response.code === 200 && response.data.contacts) {
        availableContacts.value = response.data.contacts.map((contact: any) => ({
          id: contact.id,
          name: contact.name,
          position: contact.position,
        }))
      }
    } catch (error) {
      console.error('加载联系人列表失败:', error)
      availableContacts.value = []
    }

    // 加载该客户的商机列表
    await loadOpportunities(formData.customerId)

    // 加载客户档案（开票信息、货运方式）
    try {
      const profileRes = await customerApi.getCustomerProfile(formData.customerId.toString())
      if (profileRes.code === 200) {
        customerProfile.value = profileRes.data
      } else {
        customerProfile.value = null
      }
    } catch (error) {
      console.error('加载客户档案失败:', error)
      customerProfile.value = null
    }
  }
}

// 添加明细项
const addItem = async () => {
  // 确保默认税率已加载
  if (!defaultTaxRateLoaded.value) {
    await loadDefaultTaxRate()
  }

  const newItem: CreateQuoteItemDto & { amount?: number; priceComponents?: Record<string, number>; taxRate?: number; unitPriceExclTax?: number; taxAmount?: number; amountExclTax?: number; packagingUnit?: string; packagingSpec?: string; _product?: { unit?: string; auxiliaryUnits?: Array<{ unit: string; conversionRate: number; purpose: string; description?: string }> } } = {
    productId: undefined,
    quantity: 1,
    packagingUnit: undefined,
    packagingSpec: undefined,
    unitPrice: 0,
    discount: 0,
    taxRate: defaultTaxRate.value,
    unitPriceExclTax: 0,
    taxAmount: 0,
    amountExclTax: 0,
    notes: '',
  }

  // 复杂模式下初始化价格组成项
  if (pricingConfig.value.pricingMode === 'complex' && pricingConfig.value.priceComponents) {
    newItem.priceComponents = {}
    pricingConfig.value.priceComponents.forEach((component) => {
      newItem.priceComponents![component.key] = component.defaultValue || 0
    })
    // 计算初始单价
    newItem.unitPrice = Object.values(newItem.priceComponents).reduce((sum, val) => sum + (Number(val) || 0), 0)
  }

  formData.items.push(newItem)
  // 初始化时计算税额相关字段
  calculateItemTaxAmounts(formData.items.length - 1)
}

// 移除明细项
const removeItem = (index: number) => {
  formData.items.splice(index, 1)
}

// 计算明细项的价格组成项（复杂模式）
const calculateItemPriceComponents = (index: number) => {
  const item = formData.items[index]
  if (pricingConfig.value.pricingMode === 'complex') {
    // 确保 priceComponents 存在
    if (!item.priceComponents) {
      item.priceComponents = {}
    }
    // 计算单价：所有价格组成项之和
    const total = Object.values(item.priceComponents).reduce((sum, value) => {
      return sum + (Number(value) || 0)
    }, 0)
    item.unitPrice = total
  }
  // 重新计算金额
  calculateItemAmount(index)
}

// 计算明细项金额
const calculateItemAmount = (index: number) => {
  const item = formData.items[index]
  if (!item) return

  // 确保所有值都是数字类型
  const quantity = Number(item.quantity) || 0
  const unitPrice = Number(item.unitPrice) || 0
  const discount = Number(item.discount) || 0

  if (quantity > 0 && unitPrice > 0) {
    item.amount = quantity * unitPrice * (1 - discount / 100)
    // 保留两位小数
    item.amount = Math.round(item.amount * 100) / 100
  } else {
    item.amount = 0
  }

  // 重新计算税额相关字段
  calculateItemTaxAmounts(index)
}

// 根据单位值获取中文名称
const getUnitLabel = (unitValue: string): string => {
  if (!unitValue) return ''
  const unitOption = unitOptions.value.find(opt => opt.value === unitValue)
  return unitOption ? unitOption.label : unitValue
}

// 获取可用的辅助单位列表（仅销售用途）
const getAvailableAuxiliaryUnitsForItem = (index: number) => {
  const item = formData.items[index]
  return getAvailableAuxiliaryUnits(item._product, 'sales')
}

// 获取显示用的数量（根据包装单位转换）
const getDisplayQuantityForItem = (index: number): number => {
  const item = formData.items[index]
  return getDisplayQuantity(item)
}

// 处理数量输入（转换为主单位存储）
const handleQuantityInput = (index: number, displayValue: number) => {
  const item = formData.items[index]
  if (!item) return
  item.quantity = convertQuantityToMainUnit(item, displayValue)
  calculateItemAmount(index)
}

// 处理包装数量输入（从包装单位转换为主单位存储）
const handlePackagingQuantityInput = (index: number, displayValue: number) => {
  const item = formData.items[index]
  if (!item) return
  // 将包装数量转换为主单位数量
  item.quantity = convertQuantityToMainUnit(item, displayValue)
  calculateItemAmount(index)
}

// 获取显示用的单价（根据包装单位转换）
const getDisplayUnitPriceForItem = (index: number): number => {
  const item = formData.items[index]
  return getDisplayUnitPrice(item)
}

// 处理单价输入（转换为主单位存储）
const handleUnitPriceInput = (index: number, displayValue: number) => {
  const item = formData.items[index]
  if (!item) return
  item.unitPrice = convertUnitPriceToMainUnit(item, displayValue)
  calculateItemAmount(index)
}

// 处理包装单位变化
const handlePackagingUnitChangeForItem = (index: number, unit: string) => {
  const item = formData.items[index]
  if (!item) return
  item.packagingUnit = unit
  item.packagingSpec = handlePackagingUnitChange(item, unit)
  // 重新计算显示值（数量保持不变，只是显示转换）
  calculateItemAmount(index)
}

// 获取包装单位标签（只显示用途为销售的单位）
const getPackagingUnitLabel = (row: FormData['items'][0]): string => {
  if (!row.packagingUnit) return ''
  return getUnitLabel(row.packagingUnit)
}

// 处理产品选择变化
const handleProductChange = async (index: number, productId: number) => {
  const item = formData.items[index]
  if (!item || !productId) return

  // 加载产品详情（包含辅助单位）
  try {
    const res = await productApi.getDetail(String(productId))
    if (res.code === 200 && res.data) {
      item._product = {
        unit: res.data.unit,
        auxiliaryUnits: (res.data.auxiliaryUnits || []) as ProductInfo['auxiliaryUnits']
      }

      // 优先使用用途为"销售"的辅助单位，如果没有则使用主单位
      const salesAuxUnit = item._product.auxiliaryUnits?.find(aux => aux.purpose === 'sales')
      if (salesAuxUnit) {
        item.packagingUnit = salesAuxUnit.unit
        item.packagingSpec = salesAuxUnit.description || `${salesAuxUnit.conversionRate}${res.data.unit}/${salesAuxUnit.unit}`
      } else {
        // 默认使用主单位
        item.packagingUnit = res.data.unit
        item.packagingSpec = ''
      }

      // 如果产品有价格，自动填充单价
      if (res.data.price) {
        item.unitPrice = res.data.price
      }
    }
  } catch (error) {
    console.error('加载产品详情失败:', error)
  }

  calculateItemAmount(index)
}

// 计算明细项的税额相关字段
const calculateItemTaxAmounts = (index: number) => {
  const item = formData.items[index]
  if (!item) return

  const quantity = Number(item.quantity) || 0
  const unitPrice = Number(item.unitPrice) || 0  // 含税单价
  const discount = Number(item.discount) || 0
  const taxRate = Number(item.taxRate) || 0  // 税率(%)

  // 计算含税金额
  const amount = quantity > 0 && unitPrice > 0
    ? quantity * unitPrice * (1 - discount / 100)
    : 0
  item.amount = Math.round(amount * 100) / 100

  // 计算不含税单价
  if (taxRate > 0 && taxRate !== -100) {
    item.unitPriceExclTax = unitPrice / (1 + taxRate / 100)
  } else {
    item.unitPriceExclTax = unitPrice
  }
  item.unitPriceExclTax = Math.round(item.unitPriceExclTax * 100) / 100

  // 计算不含税金额
  if (taxRate > 0 && taxRate !== -100) {
    item.amountExclTax = amount / (1 + taxRate / 100)
  } else {
    item.amountExclTax = amount
  }
  item.amountExclTax = Math.round(item.amountExclTax * 100) / 100

  // 计算税金
  item.taxAmount = amount - item.amountExclTax
  item.taxAmount = Math.round(item.taxAmount * 100) / 100
}

// 初始化表单数据
const initFormData = async () => {
  if (props.quote) {
    // 编辑模式
    const quote = props.quote
    Object.assign(formData, {
      id: quote.id,
      customerId: parseInt(quote.customerId),
      contactId: quote.contactId ? parseInt(quote.contactId) : undefined,
      opportunityId: quote.opportunityId ? parseInt(quote.opportunityId) : undefined,
      quoteDate: quote.quoteDate,
      expiryDate: quote.expiryDate || '',
      status: quote.status,
      notes: quote.notes || '',
      items: await Promise.all((quote.items || []).map(async (item: any) => {
        // 如果税率为 undefined、null 或 0，且默认税率已加载，则使用默认税率
        let taxRate = item.taxRate
        if ((taxRate === undefined || taxRate === null || taxRate === 0) && defaultTaxRateLoaded.value && defaultTaxRate.value > 0) {
          taxRate = defaultTaxRate.value
        } else if (taxRate === undefined || taxRate === null) {
          taxRate = defaultTaxRate.value || 0
        }

        const itemData: any = {
        productId: parseInt(item.productId),
        quantity: item.quantity,
          packagingUnit: item.packagingUnit,
          packagingSpec: item.packagingSpec,
        unitPrice: item.unitPrice,
          priceComponents: item.priceComponents || {},
        discount: item.discount || 0,
          taxRate: taxRate,
          unitPriceExclTax: item.unitPriceExclTax ?? 0,
          taxAmount: item.taxAmount ?? 0,
          amountExclTax: item.amountExclTax ?? 0,
        amount: item.amount,
        notes: item.notes || '',
        }

        // 加载产品信息（包含辅助单位）
        if (item.productId) {
          try {
            const res = await productApi.getDetail(String(item.productId))
            if (res.code === 200 && res.data) {
              itemData._product = {
                unit: res.data.unit,
                auxiliaryUnits: res.data.auxiliaryUnits || []
              }
            }
          } catch (error) {
            console.error('加载产品详情失败:', error)
          }
        }

        return itemData
      })),
    })
    // 加载该客户的联系人列表和商机列表
    handleCustomerChange().then(() => {
      // 恢复联系人选择（在加载联系人列表后）
      if (quote.contactId) {
        formData.contactId = parseInt(quote.contactId)
      }
      // 恢复商机选择（在加载商机列表后）
      if (quote.opportunityId) {
        formData.opportunityId = parseInt(quote.opportunityId)
      }
    })
  } else {
    // 新建模式
    const today = new Date().toISOString().split('T')[0]
    Object.assign(formData, {
      id: undefined,
      customerId: props.defaultCustomerId ? Number(props.defaultCustomerId) : undefined,
      contactId: undefined,
      opportunityId: undefined,
      quoteDate: today,
      expiryDate: '',
      status: 'draft',
      notes: '',
      items: [],
    })
    // 如果有默认客户ID，加载该客户的联系人和商机
    if (props.defaultCustomerId) {
      formData.customerId = Number(props.defaultCustomerId)
      handleCustomerChange()
    }
  }
}

// 监听报价数据变化（编辑模式）
watch(
  () => props.quote,
  async () => {
    await initFormData()
    formRef.value?.clearValidate()
  },
  { immediate: true },
)

// 监听默认客户ID变化
watch(
  () => props.defaultCustomerId,
  (newVal) => {
    if (newVal && !props.quote) {
      formData.customerId = Number(newVal)
      handleCustomerChange()
    }
  },
  { immediate: true },
)

// 重置表单
const resetForm = async () => {
  await initFormData()
  formRef.value?.clearValidate()
}

// 提交表单
const submit = async () => {
  if (!formRef.value) {
    ElMessage.warning('表单未初始化')
    return false
  }

  try {
    await formRef.value.validate()

    // 验证客户ID
    if (!formData.customerId) {
      ElMessage.warning('请选择客户')
      return false
    }

    // 验证所有明细项都有产品ID
    for (let i = 0; i < formData.items.length; i++) {
      if (!formData.items[i].productId) {
        ElMessage.warning(`请选择第 ${i + 1} 条明细的产品`)
        return false
      }
    }

    // 确保所有明细项都有金额
    formData.items.forEach((item, index) => {
      calculateItemAmount(index)
    })

    if (props.quote) {
      // 编辑模式
      const updateData: UpdateQuoteDto = {
        customerId: formData.customerId,
        contactId: formData.contactId,
        opportunityId: formData.opportunityId,
        quoteDate: formData.quoteDate,
        expiryDate: formData.expiryDate,
        status: formData.status,
        notes: formData.notes,
        items: formData.items.map(item => ({
          productId: item.productId!,
          quantity: item.quantity,
          packagingUnit: item.packagingUnit,
          packagingSpec: item.packagingSpec,
          unitPrice: item.unitPrice,
          priceComponents: item.priceComponents,
          discount: item.discount,
          taxRate: item.taxRate,
          unitPriceExclTax: item.unitPriceExclTax,
          taxAmount: item.taxAmount,
          amountExclTax: item.amountExclTax,
          notes: item.notes,
        })),
      }
      emit('submit', updateData)
    } else {
      // 新建模式
      const createData: CreateQuoteDto = {
        customerId: formData.customerId!,
        contactId: formData.contactId,
        opportunityId: formData.opportunityId,
        quoteDate: formData.quoteDate,
        expiryDate: formData.expiryDate,
        status: formData.status,
        notes: formData.notes,
        items: formData.items.map(item => ({
          productId: item.productId!,
          quantity: item.quantity,
          packagingUnit: item.packagingUnit,
          packagingSpec: item.packagingSpec,
          unitPrice: item.unitPrice,
          priceComponents: item.priceComponents,
          discount: item.discount,
          taxRate: item.taxRate,
          unitPriceExclTax: item.unitPriceExclTax,
          taxAmount: item.taxAmount,
          amountExclTax: item.amountExclTax,
          notes: item.notes,
        })),
      }
      emit('submit', createData)
    }

    return true
  } catch (error: any) {
    // 表单验证失败，Element Plus 会自动显示错误消息
    if (error && typeof error === 'object' && !error.fields) {
      console.error('提交表单时发生错误:', error)
      ElMessage.error('提交表单失败，请检查表单内容')
    }
    return false
  }
}

// 暴露方法
defineExpose({
  submit,
  resetForm,
  formRef,
})

// 加载默认税率
const loadDefaultTaxRate = async () => {
  const tenantId = authStore.currentTenant?.id
  if (!tenantId) {
    defaultTaxRateLoaded.value = true
    return
  }
  try {
    const tenant = authStore.currentTenant
    // 处理 defaultTaxRate，可能是数字或字符串
    if (tenant && (tenant as any).defaultTaxRate !== undefined && (tenant as any).defaultTaxRate !== null) {
      const taxRate = (tenant as any).defaultTaxRate
      // 如果是字符串，转换为数字
      if (typeof taxRate === 'string') {
        defaultTaxRate.value = parseFloat(taxRate) || 0
      } else if (typeof taxRate === 'number') {
        defaultTaxRate.value = taxRate
      } else {
        defaultTaxRate.value = 0
      }
      defaultTaxRateLoaded.value = true
      return
    }

    // 如果租户信息中没有，尝试从租户详情中获取
    try {
      const tenantResponse = await tenantApi.getDetail(tenantId)
      if (tenantResponse.code === 200 && tenantResponse.data) {
        const taxRate = (tenantResponse.data as any).defaultTaxRate
        if (taxRate !== undefined && taxRate !== null) {
          // 如果是字符串，转换为数字
          if (typeof taxRate === 'string') {
            defaultTaxRate.value = parseFloat(taxRate) || 0
          } else if (typeof taxRate === 'number') {
            defaultTaxRate.value = taxRate
          } else {
            defaultTaxRate.value = 0
          }
        } else {
          defaultTaxRate.value = 0
        }
      } else {
        defaultTaxRate.value = 0
      }
      defaultTaxRateLoaded.value = true
    } catch {
      // 如果获取失败，使用默认值 0
      defaultTaxRate.value = 0
      defaultTaxRateLoaded.value = true
    }
  } catch (error) {
    console.error('加载默认税率失败:', error)
    defaultTaxRate.value = 0
    defaultTaxRateLoaded.value = true
  }
}

onMounted(async () => {
  // 先加载默认税率（确保在添加新项之前已加载）
  await loadDefaultTaxRate()
  // 初始化表单数据
  await initFormData()
  // 加载价格配置
  await loadPricingConfig()
  // 加载选项数据
  await Promise.all([
    loadCustomers(),
    loadProducts(),
    loadUnitOptions(),
  ])
  // 如果已有数据，重新计算税额相关字段
  if (formData.items.length > 0) {
    formData.items.forEach((item, index) => {
      // 如果税率为 undefined、null 或 0，且默认税率已加载，则使用默认税率
      if ((item.taxRate === undefined || item.taxRate === null || item.taxRate === 0) && defaultTaxRateLoaded.value && defaultTaxRate.value > 0) {
        item.taxRate = defaultTaxRate.value
      }
      calculateItemTaxAmounts(index)
    })
  }
  // 如果有默认客户ID，加载该客户的联系人和商机
  if (props.defaultCustomerId && !props.quote) {
    formData.customerId = Number(props.defaultCustomerId)
    await handleCustomerChange()
  }
})
</script>

<style lang="scss" scoped>
.quote-form {
  :deep(.el-form-item__label) {
    white-space: nowrap;
  }
}

.quote-items-section {
  width: 100%;
}

.total-amount {
  margin-top: 10px;
  text-align: right;
  font-size: 16px;
  color: var(--el-color-primary);
}
</style>


