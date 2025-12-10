<template>
  <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" class="order-form">
    <el-row :gutter="20">
      <el-col :span="12" v-if="isEdit">
        <el-form-item label="订单编号">
          <el-input v-model="formData.orderNumber" disabled placeholder="订单编号由系统自动生成" />
        </el-form-item>
      </el-col>
      <el-col :span="isEdit ? 12 : 24">
        <el-form-item label="客户" prop="customerId">
          <el-select
            v-model="formData.customerId"
            placeholder="请选择客户"
            filterable
            style="width: 100%"
            :disabled="!!defaultCustomerId"
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
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="关联合同" prop="contractId">
          <el-select
            v-model="formData.contractId"
            placeholder="请选择关联合同（可选）"
            filterable
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="contract in availableContracts"
              :key="contract.id"
              :label="contract.contractNumber"
              :value="parseInt(contract.id)"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="下单日期" prop="orderDate">
          <el-date-picker
            v-model="formData.orderDate"
            type="date"
            placeholder="请选择下单日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="交付日期" prop="deliveryDate">
          <el-date-picker
            v-model="formData.deliveryDate"
            type="date"
            placeholder="请选择交付日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 订单明细 -->
    <el-form-item label="订单明细" prop="items">
      <div class="order-items-section">
        <el-table :data="formData.items" border style="width: 100%">
          <el-table-column label="产品" min-width="200">
            <template #default="{ row, $index }">
              <el-select
                v-model="row.productId"
                placeholder="请选择产品"
                filterable
                clearable
                style="width: 100%"
                @change="(val: number | undefined) => handleProductChange($index, val)"
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
                  @change="(val: number | undefined) => handlePackagingQuantityInput($index, val)"
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
                  @change="(val: number | undefined) => handleUnitPriceInput($index, val)"
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
              {{ formatCurrency(row.amount) }}
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
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import {
  type Order,
  type CreateOrderDto,
  type UpdateOrderDto,
  type CreateOrderItemDto,
} from '@/api/order'
import customerApi from '@/api/customer'
import productApi from '@/api/product'
import {
  getAvailableAuxiliaryUnits,
  getDisplayQuantity,
  convertQuantityToMainUnit,
  getDisplayUnitPrice,
  convertUnitPriceToMainUnit,
  handlePackagingUnitChange,
  type ProductInfo,
} from '@/utils/packaging-unit'
import contractApi from '@/api/contract'
import { tenantApi, type TenantPricingConfig } from '@/api/tenant'
import { useAuthStore } from '@/stores/modules/auth'
import dictionaryApi, { type DictItemTreeNode } from '@/api/dictionary'

interface Props {
  // 默认客户ID（如果提供，则自动选择该客户并禁用选择）
  defaultCustomerId?: number
  // 编辑时的订单数据
  order?: Order | null
}

const props = withDefaults(defineProps<Props>(), {
  defaultCustomerId: undefined,
  order: null,
})

const emit = defineEmits<{
  submit: [data: CreateOrderDto | UpdateOrderDto]
  cancel: []
}>()

const formRef = ref<FormInstance>()
const isEdit = computed(() => !!props.order)
const authStore = useAuthStore()

// 价格配置
const pricingConfig = ref<TenantPricingConfig>({
  pricingMode: 'simple',
  priceComponents: [],
})
const pricingConfigLoading = ref(false)

// 默认税率
const defaultTaxRate = ref<number>(0)
const defaultTaxRateLoaded = ref<boolean>(false)

// 单位选项（从系统字典加载）
const unitOptions = ref<{ label: string; value: string }[]>([])

// 表单数据
const formData = reactive<Partial<CreateOrderDto> & { orderNumber?: string; items: OrderItemWithAmount[] }>({
  orderNumber: '',
  customerId: undefined,
  contractId: undefined,
  opportunityId: undefined,
  orderDate: '',
  deliveryDate: '',
  status: 'pending',
  notes: '',
  items: [],
})

// 可用客户、产品和合同列表
const availableCustomers = ref<Array<{ id: string; name: string }>>([])
const availableProducts = ref<Array<{ id: string; name: string; code?: string }>>([])
const availableContracts = ref<Array<{ id: string; contractNumber: string }>>([])

// 扩展订单明细项类型，包含计算字段
type OrderItemWithAmount = CreateOrderItemDto & {
  amount?: number
  priceComponents?: Record<string, number>
  _product?: ProductInfo
}

// 计算总金额
const totalAmount = computed(() => {
  return formData.items.reduce((sum, item) => {
    return sum + ((item as OrderItemWithAmount).amount || 0)
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
  orderDate: [{ required: true, message: '请选择下单日期', trigger: 'change' }],
  items: [
    { required: true, message: '请至少添加一条订单明细', trigger: 'change' },
    {
      validator: (rule: unknown, value: CreateOrderItemDto[] | undefined, callback: (error?: Error) => void) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少添加一条订单明细'))
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
                const value = item.priceComponents?.[component.key]
                if (value === undefined || value === null || Number(value) < 0) {
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

// 加载合同列表
const loadContracts = async () => {
  try {
    const response = await contractApi.getList({ page: 1, limit: 1000 })
    if (response.code === 200) {
      availableContracts.value = response.data.contracts
    }
  } catch (error) {
    console.error('加载合同列表失败:', error)
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

// 加载默认税率
const loadDefaultTaxRate = async () => {
  const tenantId = authStore.currentTenant?.id
  if (!tenantId) {
    defaultTaxRate.value = 0
    defaultTaxRateLoaded.value = true
    return
  }
  try {
    const tenant = authStore.currentTenant
    if (tenant && (tenant as any).defaultTaxRate !== undefined && (tenant as any).defaultTaxRate !== null) {
      const taxRate = (tenant as any).defaultTaxRate
      if (typeof taxRate === 'string') {
        defaultTaxRate.value = parseFloat(taxRate) || 0
      } else if (typeof taxRate === 'number') {
        defaultTaxRate.value = taxRate
      } else {
        defaultTaxRate.value = 0
      }
      defaultTaxRateLoaded.value = true
    } else {
      // 如果租户信息中没有，尝试从租户详情中获取
      try {
        const tenantResponse = await tenantApi.getDetail(tenantId)
        if (tenantResponse.code === 200 && tenantResponse.data && (tenantResponse.data as any).defaultTaxRate !== undefined && (tenantResponse.data as any).defaultTaxRate !== null) {
          const taxRate = (tenantResponse.data as any).defaultTaxRate
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
      } catch {
        defaultTaxRate.value = 0
      }
      defaultTaxRateLoaded.value = true
    }
  } catch (error) {
    console.error('加载默认税率失败:', error)
    defaultTaxRate.value = 0
    defaultTaxRateLoaded.value = true
  }
}

// 排序后的价格组成项（按 order 排序）
const sortedPriceComponents = computed(() => {
  if (!pricingConfig.value.priceComponents) {
    return []
  }
  return [...pricingConfig.value.priceComponents].sort((a, b) => (a.order || 0) - (b.order || 0))
})

// 获取可用的辅助单位列表（仅销售用途）
const getAvailableAuxiliaryUnitsForItem = (index: number) => {
  const item = formData.items[index] as OrderItemWithAmount
  return getAvailableAuxiliaryUnits(item._product, 'sales')
}

// 获取显示用的数量（根据包装单位转换）
const getDisplayQuantityForItem = (index: number): number => {
  const item = formData.items[index] as OrderItemWithAmount
  return getDisplayQuantity(item)
}

// 处理数量输入（转换为主单位存储）
const handleQuantityInput = (index: number, displayValue: number) => {
  const item = formData.items[index] as OrderItemWithAmount
  if (!item) return
  item.quantity = convertQuantityToMainUnit(item, displayValue)
  calculateItemAmount(index)
}

// 处理包装数量输入（从包装单位转换为主单位存储）
const handlePackagingQuantityInput = (index: number, displayValue: number | undefined) => {
  const item = formData.items[index] as OrderItemWithAmount
  if (!item || displayValue === undefined || displayValue === null) return
  // 将包装数量转换为主单位数量
  item.quantity = convertQuantityToMainUnit(item, displayValue)
  calculateItemAmount(index)
}

// 格式化数字（保留2位小数）
const formatNumber = (value: number) => {
  if (value === undefined || value === null) return '0.00'
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
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

// 获取单位的中文标签
const getUnitLabel = (unitValue: string): string => {
  if (!unitValue) return ''
  const unitOption = unitOptions.value.find(opt => opt.value === unitValue)
  return unitOption ? unitOption.label : unitValue
}

// 获取包装单位标签（只显示用途为销售的单位）
const getPackagingUnitLabel = (row: OrderItemWithAmount): string => {
  if (!row.packagingUnit) return ''
  return getUnitLabel(row.packagingUnit)
}

// 获取显示用的单价（根据包装单位转换）
const getDisplayUnitPriceForItem = (index: number): number => {
  const item = formData.items[index] as OrderItemWithAmount
  return getDisplayUnitPrice(item)
}

// 处理单价输入（转换为主单位存储）
const handleUnitPriceInput = (index: number, displayValue: number | undefined) => {
  const item = formData.items[index] as OrderItemWithAmount
  if (!item || displayValue === undefined || displayValue === null) return
  item.unitPrice = convertUnitPriceToMainUnit(item, displayValue)
  calculateItemAmount(index)
}

// 处理包装单位变化
const handlePackagingUnitChangeForItem = (index: number, unit: string) => {
  const item = formData.items[index] as OrderItemWithAmount
  if (!item) return
  item.packagingUnit = unit
  item.packagingSpec = handlePackagingUnitChange(item, unit)
  // 重新计算显示值（数量保持不变，只是显示转换）
  calculateItemAmount(index)
}

// 处理产品选择变化
const handleProductChange = async (index: number, productId: number | undefined) => {
  const item = formData.items[index] as OrderItemWithAmount
  if (!item || !productId || productId === 0) return

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

// 客户变化时的处理（目前仅预留，暂不做额外联动）
const handleCustomerChange = () => {}

// 添加明细项
const addItem = async () => {
  // 确保默认税率已加载
  if (!defaultTaxRateLoaded.value) {
    await loadDefaultTaxRate()
  }

  const newItem: OrderItemWithAmount = {
    productId: undefined as any,  // 未选择产品，用户必须选择产品后才能提交
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
  const item = formData.items[index] as OrderItemWithAmount
  const quantity = Number(item.quantity) || 0
  const unitPrice = Number(item.unitPrice) || 0
  const discount = Number(item.discount) || 0

  if (quantity > 0 && unitPrice > 0) {
    item.amount = quantity * unitPrice * (1 - discount / 100)
  } else {
    item.amount = 0
  }

  // 重新计算税额相关字段
  calculateItemTaxAmounts(index)
}

// 计算明细项的税额相关字段
const calculateItemTaxAmounts = (index: number) => {
  const item = formData.items[index] as OrderItemWithAmount
  const quantity = Number(item.quantity) || 0
  const unitPrice = Number(item.unitPrice) || 0  // 含税单价
  const discount = Number(item.discount) || 0
  const taxRate = Number(item.taxRate) || 0  // 税率(%)

  // 计算含税金额
  const amount = quantity * unitPrice * (1 - discount / 100)
  item.amount = amount

  // 计算不含税单价
  if (taxRate > 0 && taxRate !== -100) {
    item.unitPriceExclTax = unitPrice / (1 + taxRate / 100)
  } else {
    item.unitPriceExclTax = unitPrice
  }

  // 计算不含税金额
  if (taxRate > 0 && taxRate !== -100) {
    item.amountExclTax = amount / (1 + taxRate / 100)
  } else {
    item.amountExclTax = amount
  }

  // 计算税金
  item.taxAmount = amount - item.amountExclTax
}

// 初始化表单数据
const initFormData = async () => {
  if (props.order) {
    // 编辑模式
    const order = props.order
    Object.assign(formData, {
      orderNumber: order.orderNumber,
      customerId: parseInt(order.customerId),
      contractId: order.contractId ? parseInt(order.contractId) : undefined,
      opportunityId: order.opportunityId ? parseInt(order.opportunityId) : undefined,
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate || '',
      status: order.status,
      notes: order.notes || '',
      items: await Promise.all((order.items || []).map(async (item: any) => {
        const itemData: any = {
        productId: parseInt(item.productId),
        quantity: item.quantity,
          packagingUnit: item.packagingUnit,
          packagingSpec: item.packagingSpec,
        unitPrice: item.unitPrice,
        priceComponents: item.priceComponents || {},
        discount: item.discount || 0,
          taxRate: (item.taxRate !== undefined && item.taxRate !== null && item.taxRate !== 0) 
            ? item.taxRate 
            : (defaultTaxRateLoaded.value && defaultTaxRate.value > 0 ? defaultTaxRate.value : (item.taxRate ?? 0)),
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
                auxiliaryUnits: (res.data.auxiliaryUnits || []) as ProductInfo['auxiliaryUnits']
              }
            }
          } catch (error) {
            console.error('加载产品详情失败:', error)
          }
        }

        return itemData
      })),
    })
  } else {
    // 新建模式
    Object.assign(formData, {
      orderNumber: '',
      customerId: props.defaultCustomerId,
      contractId: undefined,
      opportunityId: undefined,
      orderDate: '',
      deliveryDate: '',
      status: 'pending',
      notes: '',
      items: [],
    })
  }
}

// 监听订单数据变化（编辑模式）
watch(
  () => props.order,
  async (newOrder, oldOrder) => {
    // 如果从编辑模式切换到新增模式，或者从新增切换到编辑，都需要重新初始化
    if (newOrder !== oldOrder) {
      await initFormData()
      formRef.value?.clearValidate()
    }
  },
  { immediate: true },
)

// 监听默认客户ID变化
watch(
  () => props.defaultCustomerId,
  (newVal) => {
    if (newVal && !props.order) {
      formData.customerId = newVal
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

    // 验证所有明细项都选择了产品
    const invalidItems = formData.items.filter((item) => !item.productId || item.productId === 0 || item.productId === undefined)
    if (invalidItems.length > 0) {
      ElMessage.warning('请为所有明细项选择产品')
      return false
    }

    // 复杂模式下验证价格组成项
    if (pricingConfig.value.pricingMode === 'complex' && pricingConfig.value.priceComponents) {
      for (const item of formData.items) {
        for (const component of pricingConfig.value.priceComponents) {
          if (component.required) {
            const value = item.priceComponents?.[component.key]
            if (value === undefined || value === null || Number(value) < 0) {
              ElMessage.warning(`请填写所有必填的价格组成项"${component.label}"`)
              return false
            }
          }
        }
        // 重新计算单价
        if (item.priceComponents) {
          calculateItemPriceComponents(formData.items.indexOf(item))
        }
      }
    }

    // 确保所有明细项都有金额
    formData.items.forEach((item, index) => {
      calculateItemAmount(index)
    })

    // 过滤掉无效的明细项，确保所有明细项都有有效的产品ID
    const validItems = formData.items.filter((item) => item.productId && item.productId > 0 && item.productId !== undefined)

    if (isEdit.value) {
      // 编辑时，不传订单编号（不应该修改订单编号）
      const updateData: UpdateOrderDto = { ...formData, items: validItems }
      delete updateData.orderNumber
      emit('submit', updateData)
    } else {
      // 新增时，不传订单编号（由后端自动生成）
      if (!formData.customerId) {
        ElMessage.error('请选择客户')
        return false
      }
      const createData: CreateOrderDto = {
        customerId: formData.customerId,
        orderDate: formData.orderDate || '',
        items: validItems,
        ...(formData.contractId && { contractId: formData.contractId }),
        ...(formData.opportunityId && { opportunityId: formData.opportunityId }),
        ...(formData.deliveryDate && { deliveryDate: formData.deliveryDate }),
        ...(formData.status && { status: formData.status }),
        ...(formData.notes && { notes: formData.notes }),
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

onMounted(async () => {
  // 初始化表单数据
  await initFormData()
  // 加载价格配置和默认税率
  await Promise.all([
    loadPricingConfig(),
    loadDefaultTaxRate(),
    loadUnitOptions(),
  ])
  // 加载选项数据
  await Promise.all([
    loadCustomers(),
    loadProducts(),
    loadContracts(),
  ])
  // 如果已有数据，重新计算税额相关字段
  if (formData.items.length > 0) {
    formData.items.forEach((item, index) => {
      // 如果税率为 undefined、null 或 0，且默认税率已加载，则使用默认税率
      if ((item.taxRate === undefined || item.taxRate === null || item.taxRate === 0) && defaultTaxRateLoaded.value && defaultTaxRate.value > 0) {
        item.taxRate = defaultTaxRate.value
      } else if (item.taxRate === undefined || item.taxRate === null) {
        item.taxRate = defaultTaxRate.value || 0
      }
      calculateItemTaxAmounts(index)
    })
  }
})
</script>

<style scoped lang="scss">
.order-form {
  :deep(.el-form-item__label) {
    white-space: nowrap;
  }
}

.order-items-section {
  width: 100%;
}

.total-amount {
  margin-top: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  text-align: right;

  .total-row {
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    strong {
  font-size: 16px;
      color: #303133;
    }
  }
}
</style>

