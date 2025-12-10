<template>
  <div class="contract-print" id="contract-print-content">
    <div class="print-header">
      <div class="company-info">
        <h2>{{ tenantName }}</h2>
        <p v-if="tenantAddress">{{ tenantAddress }}</p>
        <p v-if="tenantPhone">电话：{{ tenantPhone }}</p>
      </div>
      <div class="contract-title">
        <h1>销售合同</h1>
      </div>
    </div>

    <div class="print-body">
      <!-- 合同基本信息 -->
      <div class="contract-info">
        <div class="info-row">
          <div class="info-item">
            <span class="label">合同编号：</span>
            <span class="value">{{ contract.contractNumber }}</span>
          </div>
          <div class="info-item">
            <span class="label">合同类型：</span>
            <span class="value">{{ getTypeName(contract.type) }}</span>
          </div>
        </div>
        <div class="info-row">
          <div class="info-item">
            <span class="label">签署日期：</span>
            <span class="value">{{ contract.signDate ? formatDate(contract.signDate) : '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">生效日期：</span>
            <span class="value">{{ contract.effectiveDate ? formatDate(contract.effectiveDate) : '-' }}</span>
          </div>
        </div>
        <div class="info-row">
          <div class="info-item">
            <span class="label">到期日期：</span>
            <span class="value">{{ contract.expiryDate ? formatDate(contract.expiryDate) : '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">状态：</span>
            <span class="value">{{ getStatusName(contract.status) }}</span>
          </div>
        </div>
      </div>

      <!-- 客户信息 -->
      <div class="customer-info">
        <h3>客户信息</h3>
        <div class="info-row">
          <div class="info-item">
            <span class="label">客户名称：</span>
            <span class="value">{{ contract.customer?.name || '-' }}</span>
          </div>
          <div class="info-item" v-if="contract.contact">
            <span class="label">联系人：</span>
            <span class="value">{{ contract.contact.name }}</span>
          </div>
        </div>
        <div class="info-row" v-if="contract.quote">
          <div class="info-item">
            <span class="label">关联报价：</span>
            <span class="value">{{ contract.quote.quoteNumber }}</span>
          </div>
        </div>
      </div>

      <!-- 合同明细 -->
      <div class="contract-items">
        <h3>合同明细</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 4%">序号</th>
              <th style="width: 15%">产品名称</th>
              <th style="width: 8%">规格型号</th>
              <th style="width: 6%">包装单位</th>
              <th style="width: 8%">包装规格</th>
              <th style="width: 6%">数量</th>
              <th style="width: 8%">单价</th>
              <th style="width: 6%">折扣(%)</th>
              <th style="width: 6%">税率(%)</th>
              <th style="width: 8%">金额</th>
              <th style="width: 6%">备注</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in contract.items" :key="item.id">
              <td class="text-center">{{ index + 1 }}</td>
              <td>{{ item.product?.name || '-' }}</td>
              <td>{{ item.product?.code || '-' }}</td>
              <td class="text-center">{{ getDisplayUnit(item) }}</td>
              <td class="text-center">{{ item.packagingSpec || '-' }}</td>
              <td class="text-right">{{ formatNumber(getDisplayQuantity(item)) }}</td>
              <td class="text-right">{{ formatCurrency(getDisplayUnitPrice(item)) }}</td>
              <td class="text-right">{{ item.discount || 0 }}%</td>
              <td class="text-right">{{ item.taxRate || 0 }}%</td>
              <td class="text-right">{{ formatCurrency(item.amount) }}</td>
              <td>{{ item.notes || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 金额汇总 -->
      <div class="contract-summary">
        <div class="summary-row">
          <span class="label">不含税总金额：</span>
          <span class="value">{{ formatCurrency(totalAmountExclTax) }}</span>
        </div>
        <div class="summary-row">
          <span class="label">总税金：</span>
          <span class="value">{{ formatCurrency(totalTaxAmount) }}</span>
        </div>
        <div class="summary-row total">
          <span class="label">总金额（含税）：</span>
          <span class="value">{{ formatCurrency(contract.totalAmount) }}</span>
        </div>
      </div>

      <!-- 备注 -->
      <div class="contract-notes" v-if="contract.notes">
        <h3>备注</h3>
        <p>{{ contract.notes }}</p>
      </div>

      <!-- 页脚 -->
      <div class="print-footer">
        <p>本合同有效期至：{{ contract.expiryDate ? formatDate(contract.expiryDate) : '-' }}</p>
        <p>打印时间：{{ formatDateTime(new Date()) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Contract } from '@/api/contract'
import { useAuthStore } from '@/stores/modules/auth'
import dictionaryApi, { type DictItemTreeNode } from '@/api/dictionary'

interface Props {
  contract: Contract
}

const props = defineProps<Props>()

const authStore = useAuthStore()
const tenantName = ref<string>('')
const tenantAddress = ref<string>('')
const tenantPhone = ref<string>('')

// 单位选项（从系统字典加载）
const unitOptions = ref<{ label: string; value: string }[]>([])

// 计算总税金（如果后端没有返回，则从明细项计算）
const totalTaxAmount = computed(() => {
  if (props.contract.totalTaxAmount !== undefined && props.contract.totalTaxAmount !== null) {
    return props.contract.totalTaxAmount
  }
  // 如果后端没有返回，从明细项计算
  return props.contract.items?.reduce((sum, item) => {
    return sum + (item.taxAmount || 0)
  }, 0) || 0
})

// 计算不含税总金额（如果后端没有返回，则从明细项计算）
const totalAmountExclTax = computed(() => {
  if (props.contract.totalAmountExclTax !== undefined && props.contract.totalAmountExclTax !== null) {
    return props.contract.totalAmountExclTax
  }
  // 如果后端没有返回，从明细项计算
  return props.contract.items?.reduce((sum, item) => {
    return sum + (item.amountExclTax || 0)
  }, 0) || 0
})

// 格式化日期
const formatDate = (date: string | Date) => {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// 格式化日期时间
const formatDateTime = (date: Date) => {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
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

// 格式化数字
const formatNumber = (value: number) => {
  if (value === undefined || value === null) return '0.00'
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// 获取类型名称
const getTypeName = (type: string) => {
  const map: Record<string, string> = {
    sales: '销售合同',
    service: '服务合同',
    maintenance: '维护合同',
    other: '其他',
  }
  return map[type] || type
}

// 获取状态名称
const getStatusName = (status: string) => {
  const map: Record<string, string> = {
    draft: '草稿',
    pending_sign: '待签署',
    signed: '已签署',
    active: '已生效',
    expired: '已到期',
    terminated: '已终止',
  }
  return map[status] || status
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

// 获取显示单位（中文名称）
const getDisplayUnit = (item: Contract['items'][0]) => {
  if (item.packagingUnit) {
    return getUnitLabel(item.packagingUnit)
  }
  if (item.product?.unit) {
    return getUnitLabel(item.product.unit)
  }
  return '-'
}

// 获取包装数量（根据包装单位转换）
const getDisplayQuantity = (item: Contract['items'][0]) => {
  if (!item.packagingUnit || !item.product?.unit) {
    return item.quantity
  }
  // 如果包装单位等于主单位，直接返回数量
  if (item.packagingUnit === item.product.unit) {
    return item.quantity
  }
  // 查找辅助单位的转换率
  const auxUnit = item.product.auxiliaryUnits?.find(aux => aux.unit === item.packagingUnit)
  if (auxUnit && auxUnit.conversionRate > 0) {
    // 主单位数量 / 转换率 = 包装单位数量
    return Math.round((item.quantity / auxUnit.conversionRate) * 100) / 100
  }
  return item.quantity
}

// 获取包装单位单价（根据包装单位转换）
const getDisplayUnitPrice = (item: Contract['items'][0]) => {
  if (!item.packagingUnit || !item.product?.unit) {
    return item.unitPrice
  }
  // 如果包装单位等于主单位，直接返回单价
  if (item.packagingUnit === item.product.unit) {
    return item.unitPrice
  }
  // 查找辅助单位的转换率
  const auxUnit = item.product.auxiliaryUnits?.find(aux => aux.unit === item.packagingUnit)
  if (auxUnit && auxUnit.conversionRate > 0) {
    // 主单位单价 * 转换率 = 包装单位单价
    return Math.round((item.unitPrice * auxUnit.conversionRate) * 100) / 100
  }
  return item.unitPrice
}

// 加载租户信息
onMounted(async () => {
  const tenant = authStore.currentTenant
  if (tenant) {
    tenantName.value = tenant.name || ''
    // 可以从租户配置中获取地址和电话
    // tenantAddress.value = tenant.address || ''
    // tenantPhone.value = tenant.phone || ''
  }
  // 加载单位选项
  await loadUnitOptions()
})

// 打印方法
const print = () => {
  window.print()
}

defineExpose({
  print,
})
</script>

<style lang="scss" scoped>
.contract-print {
  padding: 40px;
  background: white;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  color: #333;
  max-width: 210mm;
  margin: 0 auto;

  .print-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #333;

    .company-info {
      flex: 1;

      h2 {
        margin: 0 0 10px 0;
        font-size: 24px;
        font-weight: bold;
      }

      p {
        margin: 5px 0;
        font-size: 14px;
        color: #666;
      }
    }

    .contract-title {
      text-align: right;

      h1 {
        margin: 0;
        font-size: 32px;
        font-weight: bold;
      }
    }
  }

  .print-body {
    .contract-info,
    .customer-info {
      margin-bottom: 20px;

      h3 {
        margin: 0 0 10px 0;
        font-size: 16px;
        font-weight: bold;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
      }

      .info-row {
        display: flex;
        margin-bottom: 8px;

        .info-item {
          flex: 1;
          font-size: 14px;

          .label {
            font-weight: bold;
            margin-right: 8px;
          }

          .value {
            color: #333;
          }
        }
      }
    }

    .contract-items {
      margin-bottom: 20px;

      h3 {
        margin: 0 0 10px 0;
        font-size: 16px;
        font-weight: bold;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
      }

      .items-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;

        th,
        td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }

        th {
          background-color: #f5f5f5;
          font-weight: bold;
          text-align: center;
        }

        .text-center {
          text-align: center;
        }

        .text-right {
          text-align: right;
        }
      }
    }

    .contract-summary {
      margin-bottom: 20px;
      text-align: right;

      .summary-row {
        margin-bottom: 8px;
        font-size: 14px;

        .label {
          display: inline-block;
          width: 150px;
          text-align: right;
          margin-right: 10px;
        }

        .value {
          display: inline-block;
          width: 120px;
          text-align: right;
          font-weight: bold;
        }

        &.total {
          font-size: 16px;
          font-weight: bold;
          padding-top: 10px;
          border-top: 2px solid #333;
          margin-top: 10px;

          .value {
            color: #e74c3c;
          }
        }
      }
    }

    .contract-notes {
      margin-bottom: 20px;

      h3 {
        margin: 0 0 10px 0;
        font-size: 16px;
        font-weight: bold;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
      }

      p {
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
        white-space: pre-wrap;
      }
    }

    .print-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 12px;
      color: #666;

      p {
        margin: 5px 0;
      }
    }
  }
}

// 打印样式
@media print {
  body {
    margin: 0;
    padding: 0;
  }

  .contract-print {
    padding: 20px;
    margin: 0;
    box-shadow: none;
  }

  // 隐藏不需要打印的元素
  .no-print {
    display: none !important;
  }

  // 确保表格不跨页断开
  .items-table {
    page-break-inside: avoid;
  }

  // 确保汇总信息在同一页
  .contract-summary {
    page-break-inside: avoid;
  }
}
</style>

