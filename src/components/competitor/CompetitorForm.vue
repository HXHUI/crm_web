<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" class="competitor-form">
    <el-form-item label="竞品厂家" prop="manufacturer">
      <el-input v-model="form.manufacturer" placeholder="请输入竞品厂家" />
    </el-form-item>

    <el-form-item label="产品名称" prop="productName">
      <el-input v-model="form.productName" placeholder="请输入产品名称" />
    </el-form-item>

    <el-form-item label="年用量(万元)" prop="annualUsageAmount">
      <el-input-number
        v-model="form.annualUsageAmount"
        :min="0"
        :precision="2"
        :step="0.1"
        placeholder="请输入年用量（万元）"
        style="width: 100%"
      />
    </el-form-item>

    <el-form-item label="单位" prop="unit">
      <el-input v-model="form.unit" placeholder="如：吨、件、套" />
    </el-form-item>

    <el-form-item label="单价(万元)" prop="unitPrice">
      <el-input-number
        v-model="form.unitPrice"
        :min="0"
        :precision="2"
        :step="0.1"
        placeholder="请输入单价（万元）"
        style="width: 100%"
      />
    </el-form-item>

    <el-form-item label="政策" prop="policy">
      <el-input v-model="form.policy" type="textarea" :rows="2" placeholder="请输入政策" />
    </el-form-item>

    <el-form-item label="优势" prop="advantages">
      <el-input v-model="form.advantages" type="textarea" :rows="2" placeholder="请输入优势" />
    </el-form-item>

    <el-form-item label="存在的问题" prop="problems">
      <el-input v-model="form.problems" type="textarea" :rows="2" placeholder="请输入存在的问题" />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Competitor, CreateCompetitorDto, RelatedType } from '@/api/competitor'

const props = defineProps<{
  competitor?: Competitor | null
  relatedType: RelatedType
  relatedId: number | string
}>()

const formRef = ref<FormInstance>()

const form = reactive<{
  manufacturer: string
  productName?: string | null
  annualUsageAmount?: number | null
  unit?: string | null
  unitPrice?: number | null
  policy?: string | null
  advantages?: string | null
  problems?: string | null
}>({
  manufacturer: '',
  productName: '',
  annualUsageAmount: null,
  unit: '',
  unitPrice: null,
  policy: '',
  advantages: '',
  problems: '',
})

const rules = computed<FormRules>(() => ({
  manufacturer: [{ required: true, message: '请输入竞品厂家', trigger: 'blur' }],
  annualUsageAmount: [{ type: 'number', min: 0, message: '年用量需为非负数', trigger: 'blur' }],
  unitPrice: [{ type: 'number', min: 0, message: '单价需为非负数', trigger: 'blur' }],
}))

const resetForm = () => {
  form.manufacturer = ''
  form.productName = ''
  form.annualUsageAmount = null
  form.unit = ''
  form.unitPrice = null
  form.policy = ''
  form.advantages = ''
  form.problems = ''
}

const setForm = (data?: Competitor | null) => {
  resetForm()
  if (data) {
    form.manufacturer = data.manufacturer || ''
    form.productName = data.productName || ''
    form.annualUsageAmount = data.annualUsageAmount ?? null
    form.unit = data.unit || ''
    form.unitPrice = data.unitPrice ?? null
    form.policy = data.policy || ''
    form.advantages = data.advantages || ''
    form.problems = data.problems || ''
  }
}

watch(
  () => props.competitor,
  (val) => {
    setForm(val || null)
  },
  { immediate: true },
)

const validate = async (): Promise<CreateCompetitorDto> => {
  await formRef.value?.validate()
  return {
    relatedType: props.relatedType,
    relatedId: typeof props.relatedId === 'string' ? parseInt(props.relatedId, 10) : props.relatedId,
    manufacturer: form.manufacturer.trim(),
    productName: form.productName?.trim() || undefined,
    annualUsageAmount: form.annualUsageAmount ?? undefined,
    unit: form.unit?.trim() || undefined,
    unitPrice: form.unitPrice ?? undefined,
    policy: form.policy?.trim() || undefined,
    advantages: form.advantages?.trim() || undefined,
    problems: form.problems?.trim() || undefined,
  }
}

defineExpose({
  validate,
  resetForm,
})
</script>

<style scoped>
.competitor-form {
  padding: 8px 4px;
}
</style>

