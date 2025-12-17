<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="100px"
    label-position="right"
  >
  <el-form-item label="产品名称" prop="productId">
    <el-select
      v-model="form.productId"
      filterable
      placeholder="请选择本公司可替代产品"
      style="width: 100%"
      :loading="productLoading"
      clearable
      @change="handleProductChange"
    >
      <el-option
        v-for="p in productOptions"
        :key="p.id"
        :label="getProductLabel(p)"
        :value="p.id"
      />
    </el-select>
  </el-form-item>
    <el-form-item label="规格型号" prop="spec">
      <el-input v-model="form.spec" placeholder="如：型号、包装规格等" />
    </el-form-item>
    <el-form-item label="单位" prop="unit">
      <el-select
        v-model="form.unit"
        filterable
        placeholder="请选择单位"
        style="width: 180px"
        clearable
      >
        <el-option
          v-for="u in unitOptions"
          :key="u"
          :label="getUnitLabel(u)"
          :value="u"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="单价(元)" prop="unitPrice">
      <el-input
        v-model="form.unitPrice"
        style="width: 180px"
        placeholder="请输入单价"
      />
    </el-form-item>
    <el-form-item label="年用量(万元)" prop="annualPotentialAmount">
      <el-input-number
        v-model="form.annualPotentialAmount"
        :min="0"
        :precision="2"
        :step="0.01"
        :controls="false"
        style="width: 180px"
        placeholder="请输入预估年用量/金额"
      />
    </el-form-item>
    <el-form-item label="优势" prop="advantages">
      <el-input
        v-model="form.advantages"
        type="textarea"
        :rows="3"
        placeholder="相对竞品的优势，如价格、性能、交期、服务等"
      />
    </el-form-item>
    <el-form-item label="销售政策" prop="strategy">
      <el-input
        v-model="form.strategy"
        type="textarea"
        :rows="3"
        placeholder="销售政策、报价策略等"
      />
    </el-form-item>
    <el-form-item label="备注" prop="notes">
      <el-input
        v-model="form.notes"
        type="textarea"
        :rows="3"
        placeholder="其他需要说明的内容"
      />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onMounted, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { CompetitorAlternative } from '@/api/competitorAlternative'
import { productApi, type Product } from '@/api/product'

const props = defineProps<{
  alternative: CompetitorAlternative | null
}>()

const formRef = ref<FormInstance | null>(null)

const form = reactive<{
  productId: string | number | null
  productName: string
  spec?: string | null
  unit?: string | null
  unitPrice?: number | null
  annualPotentialAmount?: number | null
  advantages?: string | null
  strategy?: string | null
  notes?: string | null
}>({
  productId: null,
  productName: '',
  spec: '',
  unit: '',
  unitPrice: null,
  annualPotentialAmount: null,
  advantages: '',
  strategy: '',
  notes: '',
})

const productLoading = ref(false)
const products = ref<Product[]>([])

const loadProducts = async () => {
  try {
    productLoading.value = true
    const resp = await productApi.getList({ status: 'active', page: 1, limit: 1000 })
    // 根据当前 request 拦截器和接口返回：
    // resp 形如：{ code, message, data: { products, total, page, limit, totalPages } }
    const body = resp as unknown as { data?: { products?: Product[] } }
    const list = (body.data?.products ?? []) as Product[]
    products.value = list
  } catch (e) {
    console.error('加载产品列表失败', e)
  } finally {
    productLoading.value = false
  }
}

const productOptions = products

// 当前选中的产品
const selectedProduct = computed<Product | undefined>(() => {
  if (!form.productId) return undefined
  return products.value.find((p) => String(p.id) === String(form.productId))
})

// 单位选项：只来自当前产品的主计量单位 + 辅助计量单位
const unitOptions = computed(() => {
  const units: string[] = []
  const p = selectedProduct.value
  if (p?.unit) {
    units.push(p.unit)
  }
  if (Array.isArray(p?.auxiliaryUnits)) {
    p!.auxiliaryUnits!.forEach((au) => {
      if (au.unit && !units.includes(au.unit)) {
        units.push(au.unit)
      }
    })
  }
  return units
})

const getUnitLabel = (u: string) => {
  const upper = (u || '').toUpperCase()
  switch (upper) {
    case 'KG':
    case 'QIANKE':
      return '千克'
    case 'G':
      return '克'
    case 'TON':
    case 'TONNE':
      return '吨'
    case 'BAO':
      return '包'
    case 'PCS':
    case 'PC':
      return '件'
    case 'BOX':
      return '箱'
    default:
      return u
  }
}

const getProductLabel = (p: Product) => {
  if (p.specification) {
    return `${p.name} / ${p.specification}`
  }
  return p.name
}

const handleProductChange = (val: string | number | null) => {
  if (!val) {
    form.productName = ''
    form.unit = ''
    return
  }
  const p = products.value.find((item) => String(item.id) === String(val))
  if (p) {
    form.productName = p.name
    // 如果尚未填写规格/单位，则自动带出
    if (!form.spec) {
      form.spec = p.specification || ''
    }
    // 默认单位：主计量单位优先，其次第一个辅助计量单位
    if (p.unit) {
      form.unit = p.unit
    } else if (Array.isArray(p.auxiliaryUnits) && p.auxiliaryUnits.length > 0) {
      form.unit = p.auxiliaryUnits[0].unit
    } else {
      form.unit = ''
    }
  }
}

const rules: FormRules = {
  productId: [{ required: true, message: '请选择产品', trigger: 'change' }],
}

watch(
  () => props.alternative,
  (val: CompetitorAlternative | null) => {
    if (val) {
      // 后端暂未显式返回 productId，这里只回填名称等信息
      form.productId = null
      form.productName = val.productName
      form.spec = val.spec || ''
      form.unit = val.unit || ''
      form.unitPrice = val.unitPrice ?? null
      form.annualPotentialAmount = val.annualPotentialAmount ?? null
      form.advantages = val.advantages || ''
      form.strategy = val.strategy || ''
      form.notes = (val as unknown as { notes?: string }).notes || ''
    } else {
      form.productId = null
      form.productName = ''
      form.spec = ''
      form.unit = ''
      form.unitPrice = null
      form.annualPotentialAmount = null
      form.advantages = ''
      form.strategy = ''
      form.notes = ''
    }
  },
  { immediate: true },
)

// 当产品列表或编辑数据就绪时，根据已保存的 productName 自动回填下拉选中项
watch(
  [products, () => props.alternative],
  ([prodList, alt]) => {
    if (!alt || form.productId || !Array.isArray(prodList) || prodList.length === 0) return
    const matched = prodList.find((p) => p.name === alt.productName)
    if (matched) {
      form.productId = matched.id
    }
  },
  { immediate: true },
)

onMounted(() => {
  loadProducts()
})

const validate = async () => {
  if (!formRef.value) return null
  await formRef.value.validate()
  // 确保 productName 与当前选择的产品同步
  if (form.productId) {
    const p = products.value.find((item) => String(item.id) === String(form.productId))
    if (p) {
      form.productName = p.name
    }
  }
  return { ...form }
}

defineExpose({
  validate,
})
</script>


