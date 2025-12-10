<template>
  <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" class="contract-form">
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
        <el-form-item label="合同类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择合同类型" style="width: 100%">
            <el-option label="销售合同" value="sales" />
            <el-option label="服务合同" value="service" />
            <el-option label="维护合同" value="maintenance" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="签署日期" prop="signDate">
          <el-date-picker
            v-model="formData.signDate"
            type="date"
            placeholder="请选择签署日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="生效日期" prop="effectiveDate">
          <el-date-picker
            v-model="formData.effectiveDate"
            type="date"
            placeholder="请选择生效日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="到期日期" prop="expiryDate">
          <el-date-picker
            v-model="formData.expiryDate"
            type="date"
            placeholder="请选择到期日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12" />
    </el-row>

    <!-- 合同明细 -->
    <el-form-item label="合同明细" prop="items">
      <div class="contract-items-section">
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
          <el-table-column
            v-if="pricingConfig.pricingMode === 'simple'"
            label="单价"
            width="120"
          >
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
                {{ formatCurrency(row.amount !== undefined ? row.unitPrice : 0) }}
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

    <!-- 合同内容 -->
    <el-form-item label="合同内容" prop="content">
      <el-input
        v-model="formData.content"
        type="textarea"
        :rows="6"
        placeholder="请输入合同内容/条款"
      />
    </el-form-item>

    <!-- 合同附件 -->
    <el-form-item label="合同附件">
      <el-upload
        :action="uploadAction"
        :headers="uploadHeaders"
        :file-list="attachmentList"
        :on-success="handleAttachmentSuccess"
        :on-remove="handleAttachmentRemove"
        :before-upload="beforeUpload"
        multiple
        list-type="text"
      >
        <el-button type="primary" :icon="Plus">上传附件</el-button>
        <template #tip>
          <div class="el-upload__tip">支持PDF、Word、Excel等格式，单个文件不超过10MB</div>
        </template>
      </el-upload>
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
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules, UploadFile, UploadProps } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import contractApi, {
  type Contract,
  type CreateContractDto,
  type UpdateContractDto,
  type CreateContractItemDto,
} from '@/api/contract'
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
import { tenantApi, type TenantPricingConfig } from '@/api/tenant'
import { useAuthStore } from '@/stores/modules/auth'
import dictionaryApi, { type DictItemTreeNode } from '@/api/dictionary'

interface Props {
  // 默认客户ID（如果提供，则自动选择该客户并禁用选择）
  defaultCustomerId?: string | number
  // 是否显示客户字段（即使提供了默认值）
  showCustomerField?: boolean
  // 编辑时的合同数据
  contract?: Contract | null
}

const props = withDefaults(defineProps<Props>(), {
  defaultCustomerId: undefined,
  showCustomerField: false,
  contract: null,
})

const emit = defineEmits<{
  submit: [data: CreateContractDto | UpdateContractDto]
  cancel: []
}>()

const formRef = ref<FormInstance>()
const authStore = useAuthStore()

// 价格配置
const pricingConfig = ref<TenantPricingConfig>({
  pricingMode: 'simple',
  priceComponents: [],
})
const pricingConfigLoading = ref(false)

// 默认税率
const defaultTaxRate = ref<number>(0)
const defaultTaxRateLoaded = ref(false)

// 单位选项（从系统字典加载）
const unitOptions = ref<{ label: string; value: string }[]>([])

type ContractFormData = Omit<CreateContractDto, 'items'> & {
  customerId?: number
  contactId?: number
  items: Array<CreateContractItemDto & { amount?: number; priceComponents?: Record<string, number>; taxRate?: number; unitPriceExclTax?: number; taxAmount?: number; amountExclTax?: number; _product?: ProductInfo }>
}

// 表单数据
const formData = reactive<ContractFormData>({
  customerId: undefined as number | undefined,
  contactId: undefined,
  quoteId: undefined,
  opportunityId: undefined,
  type: 'sales',
  status: 'draft',
  signDate: '',
  effectiveDate: '',
  expiryDate: '',
  content: '',
  attachments: [],
  templateId: undefined,
  notes: '',
  items: [],
})

// 可用客户、联系人和产品列表
const availableCustomers = ref<Array<{ id: string; name: string }>>([])
const availableContacts = ref<Array<{ id: string; name: string; position?: string }>>([])
const availableProducts = ref<Array<{ id: string; name: string; code?: string }>>([])

// 附件列表
const attachmentList = ref<UploadFile[]>([])

// 上传地址
const uploadAction = computed(() => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'
  return `${baseURL}/upload`
})

// 上传请求头（包含认证token）
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return {
    Authorization: token ? `Bearer ${token}` : '',
  }
})

// 计算总金额
const totalAmount = computed(() => {
  return formData.items.reduce((sum, item) => {
    return sum + (item.amount || 0)
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

// 排序后的价格组成项（按 order 排序）
const sortedPriceComponents = computed(() => {
  if (!pricingConfig.value.priceComponents) {
    return []
  }
  return [...pricingConfig.value.priceComponents].sort((a, b) => (a.order || 0) - (b.order || 0))
})

// 表单验证规则
const formRules: FormRules = {
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  items: [
    { required: true, message: '请至少添加一条合同明细', trigger: 'change' },
    {
      validator: (rule: any, value: CreateContractItemDto[] | undefined, callback: any) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少添加一条合同明细'))
          return
        }
        // 验证每个明细项都选择了产品
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
                const v = (item as any).priceComponents?.[component.key]
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
const formatCurrency = (value: number | string | null | undefined) => {
  if (!value && value !== 0) return '¥0.00'
  const numValue = typeof value === 'string' ? parseFloat(value) : Number(value)
  if (isNaN(numValue)) return '¥0.00'
  return `¥${numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

// 加载客户列表
const loadCustomers = async () => {
  try {
    const response = await customerApi.getList({ page: 1, limit: 1000 })
    if (response.code === 200) {
      availableCustomers.value = response.data.customers.map((c: any) => ({
        id: c.id,
        name: c.name,
      }))
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
      availableProducts.value = response.data.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        code: p.code,
      }))
    }
  } catch (error) {
    console.error('加载产品列表失败:', error)
  }
}

// 加载默认税率
const loadDefaultTaxRate = async () => {
  const tenantId = authStore.currentTenant?.id
  if (!tenantId) {
    return
  }
  try {
    const tenant = authStore.currentTenant
    if (tenant && typeof (tenant as any).defaultTaxRate === 'number') {
      defaultTaxRate.value = (tenant as any).defaultTaxRate
    } else if (tenant && typeof (tenant as any).defaultTaxRate === 'string') {
      defaultTaxRate.value = parseFloat((tenant as any).defaultTaxRate) || 0
    } else {
      // 如果租户信息中没有，尝试从租户详情中获取
      try {
        const tenantResponse = await tenantApi.getDetail(tenantId)
        if (tenantResponse.code === 200 && tenantResponse.data) {
          const tenantData = tenantResponse.data as any
          if (typeof tenantData.defaultTaxRate === 'number') {
            defaultTaxRate.value = tenantData.defaultTaxRate
          } else if (typeof tenantData.defaultTaxRate === 'string') {
            defaultTaxRate.value = parseFloat(tenantData.defaultTaxRate) || 0
          }
        }
      } catch {
        // 如果获取失败，使用默认值 0
        defaultTaxRate.value = 0
      }
    }
    defaultTaxRateLoaded.value = true
  } catch (error) {
    console.error('加载默认税率失败:', error)
    defaultTaxRate.value = 0
    defaultTaxRateLoaded.value = true
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
      pricingConfig.value = {
        pricingMode: 'simple',
        priceComponents: [],
      }
    }
  } catch (error) {
    console.error('加载价格配置失败:', error)
    pricingConfig.value = {
      pricingMode: 'simple',
      priceComponents: [],
    }
  } finally {
    pricingConfigLoading.value = false
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

// 获取单位的中文标签
const getUnitLabel = (unitValue: string): string => {
  if (!unitValue) return ''
  const unitOption = unitOptions.value.find(opt => opt.value === unitValue)
  return unitOption ? unitOption.label : unitValue
}

// 获取包装单位标签（只显示用途为销售的单位）
const getPackagingUnitLabel = (row: ContractFormData['items'][0]): string => {
  if (!row.packagingUnit) return ''
  return getUnitLabel(row.packagingUnit)
}

// 获取显示用的数量（根据包装单位转换）
const getDisplayQuantityForItem = (index: number): number => {
  const item = formData.items[index]
  return getDisplayQuantity(item)
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
  if (item && item.quantity && item.unitPrice) {
    const discount = item.discount || 0
    item.amount = item.quantity * item.unitPrice * (1 - discount / 100)
  } else {
    item.amount = 0
  }
  // 重新计算税额相关字段
  calculateItemTaxAmounts(index)
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

// 添加明细项
const addItem = async () => {
  // 确保默认税率已加载
  if (!defaultTaxRateLoaded.value) {
    await loadDefaultTaxRate()
  }

  const newItem: CreateContractItemDto & { amount?: number; priceComponents?: Record<string, number>; taxRate?: number; unitPriceExclTax?: number; taxAmount?: number; amountExclTax?: number; packagingUnit?: string; packagingSpec?: string; _product?: ProductInfo } = {
    productId: undefined as any, // 未选择产品，用户必须选择产品后才能提交
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
    newItem.unitPrice = Object.values(newItem.priceComponents).reduce(
      (sum, val) => sum + (Number(val) || 0),
      0,
    )
  }

  formData.items.push(newItem)
  // 初始化时计算税额相关字段
  calculateItemTaxAmounts(formData.items.length - 1)
}

// 移除明细项
const removeItem = (index: number) => {
  formData.items.splice(index, 1)
  // 重新计算总金额
  formData.items.forEach((item, idx) => {
    calculateItemAmount(idx)
  })
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

// 客户变化时加载联系人
const handleCustomerChange = async () => {
  formData.contactId = undefined
  availableContacts.value = []

  if (formData.customerId) {
    try {
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
  }
}

// 附件上传前检查
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isValidType = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
  ].includes(file.type)
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isValidType) {
    ElMessage.error('只支持PDF、Word、Excel、图片格式')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过10MB')
    return false
  }
  return true
}

// 附件上传成功
const handleAttachmentSuccess: UploadProps['onSuccess'] = (response: any, file: UploadFile) => {
  const url = response?.data?.url || response?.url || response
  if (url) {
    file.url = url
    ElMessage.success('附件上传成功')
  } else {
    ElMessage.error('上传失败：未获取到文件URL')
  }
}

// 附件移除
const handleAttachmentRemove: UploadProps['onRemove'] = (file: UploadFile) => {
  // 从附件列表中移除
  const resp: any = file.response || {}
  const url = file.url || resp.data?.url || resp.url || resp
  if (url) {
    formData.attachments = (formData.attachments || []).filter((att) => att !== url)
  }
}

// 初始化表单数据
const initFormData = async () => {
  if (props.contract) {
    // 编辑模式：加载合同数据
    try {
      const response = await contractApi.getDetail(props.contract.id)
      if (response.code === 200) {
        const contract = response.data
        Object.assign(formData, {
          customerId: parseInt(contract.customerId),
          contactId: contract.contactId ? parseInt(contract.contactId) : undefined,
          quoteId: contract.quoteId ? parseInt(contract.quoteId) : undefined,
          opportunityId: contract.opportunityId ? parseInt(contract.opportunityId) : undefined,
          type: contract.type,
          status: contract.status,
          signDate: contract.signDate || '',
          effectiveDate: contract.effectiveDate || '',
          expiryDate: contract.expiryDate || '',
          content: contract.content || '',
          attachments: contract.attachments || [],
          templateId: contract.templateId ? parseInt(contract.templateId) : undefined,
          notes: contract.notes || '',
          items: await Promise.all((contract.items || []).map(async (item: any) => {
            const itemData: any = {
              productId: parseInt(item.productId),
              quantity: item.quantity,
              packagingUnit: item.packagingUnit,
              packagingSpec: item.packagingSpec,
              unitPrice: item.unitPrice,
              priceComponents: item.priceComponents || {},
              discount: item.discount || 0,
              taxRate: item.taxRate ?? defaultTaxRate.value,
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
        // 加载该客户的联系人列表
        await handleCustomerChange()
        // 恢复联系人选择
        if (contract.contactId) {
          formData.contactId = parseInt(contract.contactId)
        }
        // 重新计算税额相关字段
        formData.items.forEach((item, index) => {
          if (item.taxRate === undefined || item.taxRate === null || item.taxRate === 0) {
            if (defaultTaxRate.value > 0) {
              item.taxRate = defaultTaxRate.value
            }
          }
          calculateItemTaxAmounts(index)
        })

        // 设置附件列表
        attachmentList.value = (contract.attachments || []).map((url: string, index: number) => ({
          name: url.split('/').pop() || '附件',
          url,
          status: 'success',
          uid: Date.now() + index,
        })) as unknown as UploadFile[]
      }
    } catch (error) {
      console.error('加载合同详情失败:', error)
      ElMessage.error('加载合同详情失败')
    }
  } else {
    // 新建模式：初始化默认值
    const today = new Date().toISOString().split('T')[0]
    Object.assign(formData, {
      customerId: props.defaultCustomerId ? Number(props.defaultCustomerId) : undefined,
      contactId: undefined,
      quoteId: undefined,
      opportunityId: undefined,
      type: 'sales',
      status: 'draft',
      signDate: '',
      effectiveDate: '',
      expiryDate: '',
      content: '',
      attachments: [],
      templateId: undefined,
      notes: '',
      items: [],
    })

    if (props.defaultCustomerId) {
      formData.customerId = Number(props.defaultCustomerId)
      handleCustomerChange()
    }
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    customerId: props.defaultCustomerId ? Number(props.defaultCustomerId) : undefined,
    contactId: undefined,
    quoteId: undefined,
    opportunityId: undefined,
    type: 'sales',
    status: 'draft',
    signDate: '',
    effectiveDate: '',
    expiryDate: '',
    content: '',
    attachments: [],
    templateId: undefined,
    notes: '',
    items: [],
  })
  availableContacts.value = []
  attachmentList.value = []
  formRef.value?.clearValidate()
}

// 提交表单
const submit = async (): Promise<boolean> => {
  try {
    await formRef.value?.validate()

    // 验证所有明细项都选择了产品
    const invalidItems = formData.items.filter((item) => !item.productId || item.productId === 0 || item.productId === undefined)
    if (invalidItems.length > 0) {
      ElMessage.warning('请为所有明细项选择产品')
      return false
    }

    // 确保所有明细项都有金额
    formData.items.forEach((item, index) => {
      calculateItemAmount(index)
    })

    // 从附件列表获取URL
    formData.attachments = attachmentList.value
      .map((file) => {
        const resp: any = file.response || {}
        return file.url || resp.data?.url || resp.url || resp
      })
      .filter(Boolean)

    // 过滤掉无效的明细项，确保所有明细项都有有效的产品ID
    const validItems = formData.items.filter((item) => item.productId && item.productId > 0 && item.productId !== undefined)

    if (props.contract) {
      // 编辑时，确保明细项不包含 id 字段，避免后端误认为是更新操作
      const updateData: UpdateContractDto = {
        customerId: formData.customerId,
        contactId: formData.contactId,
        quoteId: formData.quoteId,
        opportunityId: formData.opportunityId,
        type: formData.type,
        status: formData.status,
        signDate: formData.signDate,
        effectiveDate: formData.effectiveDate,
        expiryDate: formData.expiryDate,
        content: formData.content,
        attachments: formData.attachments,
        templateId: formData.templateId,
        notes: formData.notes,
        items: validItems.map(item => ({
          productId: item.productId,
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
      // 创建时不发送contractNumber，让后端自动生成
      const createData: Omit<CreateContractDto, 'contractNumber'> = {
        customerId: formData.customerId as number,
        contactId: formData.contactId,
        quoteId: formData.quoteId,
        opportunityId: formData.opportunityId,
        type: formData.type,
        status: formData.status,
        signDate: formData.signDate,
        effectiveDate: formData.effectiveDate,
        expiryDate: formData.expiryDate,
        content: formData.content,
        attachments: formData.attachments,
        templateId: formData.templateId,
        notes: formData.notes,
        items: validItems.map(item => ({
          productId: item.productId,
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
    if (error !== false) {
      console.error('提交失败:', error)
      ElMessage.error(error.message || '提交失败')
    }
    return false
  }
}

// 监听 defaultCustomerId 变化
watch(
  () => props.defaultCustomerId,
  (newVal) => {
    if (newVal && !props.contract) {
      formData.customerId = Number(newVal)
      handleCustomerChange()
    }
  },
)

// 监听 contract 变化
watch(
  () => props.contract,
  async (newVal) => {
    if (newVal) {
      await initFormData()
    } else {
      resetForm()
    }
  },
  { deep: true },
)

// 暴露方法
defineExpose({
  submit,
  resetForm,
  formRef,
})

onMounted(async () => {
  // 加载默认税率
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
  if (props.defaultCustomerId && !props.contract) {
    formData.customerId = Number(props.defaultCustomerId)
    await handleCustomerChange()
  }
})
</script>

<style lang="scss" scoped>
.contract-form {
  :deep(.el-form-item__label) {
    white-space: nowrap;
  }
}

.contract-items-section {
  width: 100%;
}

.total-amount {
  margin-top: 10px;
  text-align: right;
  font-size: 16px;
  color: var(--el-color-primary);
}
</style>

