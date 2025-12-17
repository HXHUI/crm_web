<template>
  <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" class="opportunity-form">
    <el-form-item label="商机标题" prop="title">
      <el-input
        v-model="formData.title"
        placeholder="请输入商机标题"
        maxlength="100"
        show-word-limit
      />
    </el-form-item>
    <el-form-item label="关联客户" prop="customerId">
      <el-select
        v-model="formData.customerId"
        placeholder="请选择关联客户"
        style="width: 100%"
        filterable
        :disabled="!!props.defaultCustomerId"
        :loading="customerLoading"
      >
        <el-option
          v-for="customer in customerOptions"
          :key="customer.id"
          :label="customer.name"
          :value="customer.id"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="商机价值" prop="value">
      <el-input-number
        v-model="formData.value"
        placeholder="请输入商机价值"
        :min="0"
        :precision="2"
        style="width: 100%"
      />
    </el-form-item>
    <el-form-item label="商机阶段" prop="stage">
      <el-select v-model="formData.stage" placeholder="请选择商机阶段" style="width: 100%">
        <el-option label="初步接触" value="initial_contact" />
        <el-option label="需求分析" value="needs_analysis" />
        <el-option label="方案/报价" value="proposal_quote" />
        <el-option label="谈判审核" value="negotiation_review" />
        <el-option label="赢单" value="closed_won" />
        <el-option label="输单" value="closed_lost" />
      </el-select>
    </el-form-item>
    <el-form-item label="商机状态" prop="status">
      <el-select v-model="formData.status" placeholder="请选择商机状态" style="width: 100%">
        <el-option label="积极跟进" value="active" />
        <el-option label="等待客户" value="waiting_client" />
        <el-option label="已搁置" value="on_hold" />
        <el-option label="面临风险" value="at_risk" />
        <el-option label="已结束" value="closed" />
      </el-select>
    </el-form-item>
    <el-form-item label="成交概率" prop="probability">
      <el-select v-model="formData.probability" placeholder="请选择成交概率" style="width: 100%">
        <el-option label="10%" :value="10" />
        <el-option label="20%" :value="20" />
        <el-option label="30%" :value="30" />
        <el-option label="40%" :value="40" />
        <el-option label="50%" :value="50" />
        <el-option label="60%" :value="60" />
        <el-option label="70%" :value="70" />
        <el-option label="80%" :value="80" />
        <el-option label="90%" :value="90" />
        <el-option label="100%" :value="100" />
      </el-select>
    </el-form-item>
    <el-form-item label="预计成交日期" prop="expectedCloseDate">
      <el-date-picker
        v-model="formData.expectedCloseDate"
        type="date"
        placeholder="请选择预计成交日期"
        style="width: 100%"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
      />
    </el-form-item>
    <el-form-item label="商机描述" prop="description">
      <el-input
        v-model="formData.description"
        type="textarea"
        placeholder="请输入商机描述"
        :rows="3"
        maxlength="500"
        show-word-limit
      />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import opportunityApi, {
  type Opportunity,
  type CreateOpportunityDto,
  type UpdateOpportunityDto,
} from '@/api/opportunity'
import customerApi from '@/api/customer'

interface Props {
  // 默认客户ID（如果提供，则禁用客户选择，并设置为该值）
  defaultCustomerId?: string
  // 编辑时的商机数据
  opportunity?: Opportunity | null
}

const props = withDefaults(defineProps<Props>(), {
  defaultCustomerId: undefined,
  opportunity: null,
})

const emit = defineEmits<{
  submit: [data: CreateOpportunityDto | UpdateOpportunityDto]
  cancel: []
}>()

const formRef = ref<FormInstance>()
const customerLoading = ref(false)

// 表单数据
interface FormData {
  id?: string
  title: string
  description?: string
  value: number
  currency: string
  stage: string
  status: string
  probability: number
  expectedCloseDate: string
  customerId: string
}

const formData = reactive<FormData>({
  title: '',
  description: '',
  value: 0,
  currency: 'CNY',
  stage: 'initial_contact',
  status: 'active',
  probability: 10,
  expectedCloseDate: '',
  customerId: props.defaultCustomerId ? String(props.defaultCustomerId) : '',
})

// 表单验证规则
const formRules: FormRules = {
  title: [
    { required: true, message: '请输入商机标题', trigger: 'blur' },
    { min: 2, max: 100, message: '商机标题长度在 2 到 100 个字符', trigger: 'blur' },
  ],
  customerId: [{ required: true, message: '请选择关联客户', trigger: 'change' }],
  value: [
    { required: true, message: '请输入商机价值', trigger: 'blur' },
    { type: 'number', min: 0, message: '商机价值必须大于等于0', trigger: 'blur' },
  ],
  stage: [{ required: true, message: '请选择商机阶段', trigger: 'change' }],
  probability: [
    { required: true, message: '请选择成交概率', trigger: 'change' },
    { type: 'number', min: 10, max: 100, message: '成交概率必须在10-100之间', trigger: 'change' },
  ],
  // 预计成交日期改为非必填
  // expectedCloseDate: [{ required: true, message: '请选择预计成交日期', trigger: 'change' }],
}

// 客户选项
const customerOptions = ref<Array<{ id: string; name: string }>>([])

// 初始化表单数据
const initFormData = () => {
  if (props.opportunity) {
    // 编辑模式
    Object.assign(formData, {
      id: props.opportunity.id,
      title: props.opportunity.title,
      description: props.opportunity.description || '',
      value: Number(props.opportunity.value) || 0,
      currency: props.opportunity.currency || 'CNY',
      stage: props.opportunity.stage,
      status: props.opportunity.status,
      probability: Number(props.opportunity.probability) || 10,
      expectedCloseDate: props.opportunity.expectedCloseDate
        ? props.opportunity.expectedCloseDate.split('T')[0]
        : '',
      customerId: props.opportunity.customerId || (props.defaultCustomerId ? String(props.defaultCustomerId) : ''),
    })
  } else {
    // 新建模式
    Object.assign(formData, {
      id: undefined,
      title: '',
      description: '',
      value: 0,
      currency: 'CNY',
      stage: 'initial_contact',
      status: 'active',
      probability: 10,
      expectedCloseDate: '',
      customerId: props.defaultCustomerId ? String(props.defaultCustomerId) : '',
    })
  }
}

// 监听商机数据变化（编辑模式）
watch(
  () => props.opportunity,
  () => {
    initFormData()
    formRef.value?.clearValidate()
  },
  { immediate: true },
)

// 监听默认客户ID变化
watch(
  () => props.defaultCustomerId,
  async (newId) => {
    if (newId && !props.opportunity) {
      // 只在新建模式下设置默认客户
      formData.customerId = String(newId)

      // 如果客户列表中还没有该客户，需要单独加载
      if (!customerOptions.value.find(c => c.id === String(newId))) {
        try {
          const customerResponse = await customerApi.getDetail(String(newId))
          if (customerResponse.code === 200 && customerResponse.data) {
            customerOptions.value.push({
              id: String(customerResponse.data.id),
              name: customerResponse.data.name,
            })
          }
        } catch (error) {
          console.error('加载默认客户信息失败:', error)
        }
      }
    }
  },
  { immediate: true },
)

// 加载客户列表
const loadCustomers = async () => {
  try {
    customerLoading.value = true
    const response = await customerApi.getList({ page: 1, limit: 1000 })
    if (response.code === 200) {
      customerOptions.value = (response.data.customers || []).map((customer: any) => ({
        id: String(customer.id),
        name: customer.name,
      }))

      // 如果有默认客户ID，但客户列表中还没有该客户，需要单独加载
      if (props.defaultCustomerId && !customerOptions.value.find(c => c.id === String(props.defaultCustomerId))) {
        try {
          const customerResponse = await customerApi.getDetail(String(props.defaultCustomerId))
          if (customerResponse.code === 200 && customerResponse.data) {
            customerOptions.value.push({
              id: String(customerResponse.data.id),
              name: customerResponse.data.name,
            })
          }
        } catch (error) {
          console.error('加载默认客户信息失败:', error)
        }
      }
    }
  } catch (error) {
    console.error('加载客户列表失败:', error)
    ElMessage.error('加载客户列表失败')
  } finally {
    customerLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  initFormData()
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

    const submitData: CreateOpportunityDto | UpdateOpportunityDto = {
      title: formData.title,
      description: formData.description,
      value: formData.value,
      currency: formData.currency,
      stage: formData.stage as CreateOpportunityDto['stage'],
      status: formData.status as CreateOpportunityDto['status'],
      probability: formData.probability,
      expectedCloseDate: formData.expectedCloseDate,
      customerId: formData.customerId,
    }

    if (props.opportunity && formData.id) {
      // 编辑模式
      emit('submit', submitData as UpdateOpportunityDto)
    } else {
      // 新建模式
      emit('submit', submitData as CreateOpportunityDto)
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
  initFormData()
  // 加载客户列表
  await loadCustomers()
})
</script>

<style lang="scss" scoped>
.opportunity-form {
  :deep(.el-form-item__label) {
    white-space: nowrap;
  }
}
</style>

