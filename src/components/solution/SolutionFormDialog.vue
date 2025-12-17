<template>
  <el-dialog
    v-model="dialogVisible"
    title="沉淀方案到方案库"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      v-loading="loading"
    >
      <!-- 基本信息 -->
      <el-form-item label="方案标题" prop="title">
        <el-input v-model="form.title" placeholder="自动生成或手动填写" />
      </el-form-item>

      <el-form-item label="应用场景">
        <el-input
          v-model="form.applicationScenario"
          type="textarea"
          :rows="2"
          placeholder="简要描述应用场景"
        />
      </el-form-item>

      <!-- 关联信息（只读展示，从来源自动提取） -->
      <el-form-item v-if="extractedData.requirementTags && extractedData.requirementTags.length > 0" label="关联需求标签">
        <el-tag
          v-for="tag in extractedData.requirementTags"
          :key="tag"
          style="margin-right: 8px; margin-bottom: 4px"
        >
          {{ tag }}
        </el-tag>
      </el-form-item>

      <el-form-item v-if="extractedData.competitorIds && extractedData.competitorIds.length > 0" label="关联竞品">
        <div style="color: #909399; font-size: 12px">
          已关联 {{ extractedData.competitorIds.length }} 个竞品
        </div>
      </el-form-item>

      <!-- 方案内容 -->
      <el-form-item v-if="extractedData.productList && extractedData.productList.length > 0" label="产品清单">
        <el-table :data="extractedData.productList" border style="width: 100%">
          <el-table-column prop="productName" label="产品名称" />
          <el-table-column prop="spec" label="规格" />
          <el-table-column prop="quantity" label="数量" />
          <el-table-column prop="unitPrice" label="单价">
            <template #default="{ row }">
              {{ formatCurrency(row.unitPrice) }}
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额">
            <template #default="{ row }">
              {{ formatCurrency(row.amount) }}
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>

      <el-form-item label="价格策略">
        <el-input
          v-model="form.pricingStrategy"
          type="textarea"
          :rows="3"
          placeholder="请输入价格策略说明"
        />
      </el-form-item>

      <el-form-item label="服务策略">
        <el-input
          v-model="form.serviceStrategy"
          type="textarea"
          :rows="3"
          placeholder="请输入服务策略说明（技术支持、交期、付款条件等）"
        />
      </el-form-item>

      <el-form-item label="技术方案">
        <el-input
          v-model="form.technicalSolution"
          type="textarea"
          :rows="3"
          placeholder="请输入技术方案说明（配方、工艺等，如适用）"
        />
      </el-form-item>

      <!-- 结果与复盘 -->
      <el-form-item label="结果" prop="result">
        <el-radio-group v-model="form.result">
          <el-radio :label="SolutionResult.WON">赢单</el-radio>
          <el-radio :label="SolutionResult.LOST">输单</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 赢单原因 -->
      <el-form-item v-if="form.result === SolutionResult.WON" label="成功原因" prop="winReasons">
        <el-checkbox-group v-model="form.winReasons">
          <el-checkbox label="price">价格优势</el-checkbox>
          <el-checkbox label="technology">技术优势</el-checkbox>
          <el-checkbox label="delivery">交期优势</el-checkbox>
          <el-checkbox label="relationship">关系优势</el-checkbox>
          <el-checkbox label="service">服务优势</el-checkbox>
          <el-checkbox label="other">其他</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <!-- 失败原因 -->
      <el-form-item v-if="form.result === SolutionResult.LOST" label="失败原因" prop="loseReasons">
        <el-checkbox-group v-model="form.loseReasons">
          <el-checkbox label="price">价格劣势</el-checkbox>
          <el-checkbox label="technology">技术劣势</el-checkbox>
          <el-checkbox label="delivery">交期劣势</el-checkbox>
          <el-checkbox label="relationship">关系劣势</el-checkbox>
          <el-checkbox label="budget_change">预算变化</el-checkbox>
          <el-checkbox label="competitor">竞争对手优势</el-checkbox>
          <el-checkbox label="other">其他</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="客户关键反馈">
        <el-input
          v-model="form.keyFeedback"
          type="textarea"
          :rows="3"
          placeholder="请输入客户关键反馈"
        />
      </el-form-item>

      <el-form-item label="经验教训">
        <el-input
          v-model="form.lessonsLearned"
          type="textarea"
          :rows="3"
          placeholder="请输入经验教训总结"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleConfirm">保存到方案库</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import solutionLibraryApi, {
  type CreateSolutionDto,
  type ExtractedData,
  SolutionResult,
  type LoseReason,
  type WinReason,
} from '@/api/solutionLibrary'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    sourceType: 'customer' | 'opportunity'
    sourceId: number | string
    result?: 'won' | 'lost'
  }>(),
  {
    modelValue: false,
    sourceType: 'customer',
    sourceId: 0,
    result: 'lost',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
  cancel: []
}>()

const formRef = ref()
const loading = ref(false)
const saving = ref(false)
const extractedData = ref<ExtractedData>({
  requirementTags: [],
  competitorIds: [],
  alternativeIds: [],
  productList: [],
})

const form = reactive<CreateSolutionDto>({
  title: '',
  industry: '',
  applicationScenario: '',
  pricingStrategy: '',
  serviceStrategy: '',
  technicalSolution: '',
  result: SolutionResult.LOST,
  winReasons: [],
  loseReasons: [],
  keyFeedback: '',
  lessonsLearned: '',
})

const rules = computed(() => {
  const baseRules = {
    title: [{ required: true, message: '请输入方案标题', trigger: 'blur' }],
    result: [{ required: true, message: '请选择结果', trigger: 'change' }],
  }
  
  if (form.result === SolutionResult.WON) {
    return {
      ...baseRules,
      winReasons: [{ required: true, message: '请至少选择一个成功原因', trigger: 'change' }],
    }
  } else {
    return {
      ...baseRules,
      loseReasons: [{ required: true, message: '请至少选择一个失败原因', trigger: 'change' }],
    }
  }
})

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// 格式化货币
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

// 提取数据
const extractData = async () => {
  if (!props.sourceId) return

  loading.value = true
  try {
    const response =
      props.sourceType === 'customer'
        ? await solutionLibraryApi.extractCustomerData(Number(props.sourceId))
        : await solutionLibraryApi.extractOpportunityData(Number(props.sourceId))

    if (response.code === 200) {
      extractedData.value = response.data

      // 自动填充表单
      if (response.data.customer) {
        form.industry = response.data.customer.industry || ''
        form.customerType = response.data.customer.type || ''
      }

      // 自动生成标题
      if (response.data.customer) {
        const parts: string[] = [response.data.customer.name]
        if (response.data.customer.industry) {
          parts.push(response.data.customer.industry)
        }
        if (props.sourceType === 'opportunity' && response.data.opportunity) {
          parts.unshift(response.data.opportunity.name)
        }
        form.title = parts.join(' - ')
      }
    }
  } catch (error: any) {
    console.error('提取数据失败:', error)
    ElMessage.error(error.message || '提取数据失败')
  } finally {
    loading.value = false
  }
}

// 确认保存
const handleConfirm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    saving.value = true

    const payload: CreateSolutionDto = {
      title: form.title,
      industry: form.industry,
      customerType: form.customerType,
      applicationScenario: form.applicationScenario,
      pricingStrategy: form.pricingStrategy,
      serviceStrategy: form.serviceStrategy,
      technicalSolution: form.technicalSolution,
      result: form.result,
      winReasons: form.winReasons as WinReason[],
      loseReasons: form.loseReasons as LoseReason[],
      keyFeedback: form.keyFeedback,
      lessonsLearned: form.lessonsLearned,
    }

    if (props.sourceType === 'customer') {
      await solutionLibraryApi.createFromCustomer(Number(props.sourceId), payload)
    } else {
      await solutionLibraryApi.createFromOpportunity(Number(props.sourceId), payload)
    }

    ElMessage.success('方案已保存到方案库')
    dialogVisible.value = false
    emit('success')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('保存失败:', error)
      ElMessage.error(error.message || '保存失败，请稍后重试')
    }
  } finally {
    saving.value = false
  }
}

const handleCancel = () => {
  dialogVisible.value = false
  emit('cancel')
}

const handleClose = () => {
  formRef.value?.clearValidate()
  emit('cancel')
}

// 监听对话框显示状态
watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      // 重置表单
      const defaultResult = props.result === 'won' ? SolutionResult.WON : SolutionResult.LOST
      Object.assign(form, {
        title: '',
        applicationScenario: '',
        pricingStrategy: '',
        serviceStrategy: '',
        technicalSolution: '',
        result: defaultResult,
        winReasons: [],
        loseReasons: [],
        keyFeedback: '',
        lessonsLearned: '',
      })
      extractedData.value = {
        requirementTags: [],
        competitorIds: [],
        alternativeIds: [],
        productList: [],
      }
      // 加载数据
      loadIndustryOptions()
      extractData()
    } else {
      formRef.value?.clearValidate()
    }
  }
)
</script>

<style lang="scss" scoped>
// 组件样式
</style>

