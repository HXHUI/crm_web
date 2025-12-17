<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="120px"
  >
    <!-- 关联对象选择（仅在需要时显示） -->
    <el-form-item
      v-if="showRelatedSelector"
      label="关联对象"
      prop="relatedType"
    >
      <el-radio-group v-model="formData.relatedType" @change="handleRelatedTypeChange">
        <el-radio label="customer">客户</el-radio>
        <el-radio label="opportunity">商机</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item
      v-if="showRelatedSelector"
      :label="formData.relatedType === 'customer' ? '客户' : '商机'"
      prop="relatedId"
    >
      <el-select
        v-if="formData.relatedType === 'customer'"
        v-model="formData.relatedId"
        filterable
        remote
        :remote-method="searchCustomers"
        :loading="customerLoading"
        placeholder="请选择客户"
        style="width: 100%"
      >
        <el-option
          v-for="customer in customerOptions"
          :key="customer.id"
          :label="customer.name"
          :value="customer.id"
        />
      </el-select>
      <el-select
        v-else
        v-model="formData.relatedId"
        filterable
        remote
        :remote-method="searchOpportunities"
        :loading="opportunityLoading"
        placeholder="请选择商机"
        style="width: 100%"
      >
        <el-option
          v-for="opportunity in opportunityOptions"
          :key="opportunity.id"
          :label="opportunity.name"
          :value="opportunity.id"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="需求类型" prop="type">
      <el-radio-group v-model="formData.type">
        <el-radio :label="RequirementType.EXPLICIT">显性需求（客户提出的需求）</el-radio>
        <el-radio :label="RequirementType.IMPLICIT">隐性需求（客户可能会有的需求）</el-radio>
        <el-radio :label="RequirementType.INTANGIBLE">无形需求（需要自己主动发现）</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="需求内容" prop="content">
      <el-input
        v-model="formData.content"
        type="textarea"
        :rows="3"
        placeholder="请输入需求内容"
      />
    </el-form-item>
    <el-form-item label="要解决的问题" prop="problemToSolve">
      <el-input
        v-model="formData.problemToSolve"
        type="textarea"
        :rows="3"
        placeholder="请输入需求背后要解决的问题"
      />
    </el-form-item>
    <el-form-item label="优先级" prop="priority">
      <el-radio-group v-model="formData.priority">
        <el-radio :label="0">低</el-radio>
        <el-radio :label="1">中</el-radio>
        <el-radio :label="2">高</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="状态" prop="status">
      <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
        <el-option label="待处理" value="pending" />
        <el-option label="处理中" value="processing" />
        <el-option label="已解决" value="resolved" />
        <el-option label="已关闭" value="closed" />
      </el-select>
    </el-form-item>
    <el-form-item label="标签" prop="tags">
      <el-select
        v-model="formData.tags"
        multiple
        filterable
        allow-create
        default-first-option
        placeholder="请输入或选择标签"
        style="width: 100%"
      >
        <el-option v-for="tag in commonTags" :key="tag" :label="tag" :value="tag" />
      </el-select>
    </el-form-item>
    <el-form-item label="备注" prop="notes">
      <el-input
        v-model="formData.notes"
        type="textarea"
        :rows="3"
        placeholder="请输入备注信息"
      />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  RequirementType,
  RequirementRelatedType,
  type CustomerRequirement,
  type CreateRequirementDto,
} from '@/api/customerRequirement'
import customerApi from '@/api/customer'
import opportunityApi from '@/api/opportunity'

const props = withDefaults(
  defineProps<{
    // 需求数据（编辑时传入）
    requirement?: CustomerRequirement | null
    // 默认关联类型
    defaultRelatedType?: RequirementRelatedType
    // 默认关联ID
    defaultRelatedId?: number | string
    // 是否显示关联对象选择器（需求管理列表需要，详情页不需要）
    showRelatedSelector?: boolean
    // 常用标签列表
    commonTags?: string[]
  }>(),
  {
    requirement: null,
    defaultRelatedType: RequirementRelatedType.CUSTOMER,
    defaultRelatedId: undefined,
    showRelatedSelector: false,
    commonTags: () => [
      '价格便宜',
      '质量稳定',
      '长账期',
      '技术支持',
      '售后服务',
      '新产品',
      '新技术',
      '行业需求',
      '业务需求',
      '资质使用',
      '法务需求',
      '管理需求',
      '利益需求',
    ],
  }
)

// 不再需要 emit submit，由父组件直接调用 getFormData

const formRef = ref()
const formData = reactive<Partial<CreateRequirementDto>>({
  relatedType: props.defaultRelatedType,
  relatedId: props.defaultRelatedId ? Number(props.defaultRelatedId) : undefined,
  type: RequirementType.EXPLICIT,
  content: '',
  problemToSolve: '',
  tags: [],
  priority: 0,
  status: 'pending',
  notes: '',
})

// 关联对象选择相关
const customerLoading = ref(false)
const opportunityLoading = ref(false)
const customerOptions = ref<Array<{ id: number; name: string }>>([])
const opportunityOptions = ref<Array<{ id: number; name: string }>>([])

// 表单验证规则
const rules = {
  type: [{ required: true, message: '请选择需求类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入需求内容', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  relatedType: props.showRelatedSelector
    ? [{ required: true, message: '请选择关联类型', trigger: 'change' }]
    : [],
  relatedId: props.showRelatedSelector
    ? [{ required: true, message: '请选择关联对象', trigger: 'blur' }]
    : [],
}

// 搜索客户
const searchCustomers = async (query?: string) => {
  if (!query) {
    customerOptions.value = []
    return
  }
  try {
    customerLoading.value = true
    const response = await customerApi.getList({ search: query, page: 1, limit: 20 })
    if (response.code === 200) {
      customerOptions.value = response.data.customers.map((c: any) => ({
        id: c.id,
        name: c.name,
      }))
    }
  } catch (error) {
    console.error('搜索客户失败:', error)
  } finally {
    customerLoading.value = false
  }
}

// 搜索商机
const searchOpportunities = async (query?: string) => {
  if (!query) {
    opportunityOptions.value = []
    return
  }
  try {
    opportunityLoading.value = true
    const response = await opportunityApi.getList({ search: query, page: 1, limit: 20 })
    if (response.code === 200) {
      opportunityOptions.value = response.data.opportunities.map((o: any) => ({
        id: o.id,
        name: o.name || o.title,
      }))
    }
  } catch (error) {
    console.error('搜索商机失败:', error)
  } finally {
    opportunityLoading.value = false
  }
}

// 关联类型变化时清空关联ID
const handleRelatedTypeChange = () => {
  formData.relatedId = undefined
  customerOptions.value = []
  opportunityOptions.value = []
}

// 初始化表单数据
const initFormData = () => {
  if (props.requirement) {
    // 编辑模式：使用传入的需求数据
    Object.assign(formData, {
      id: props.requirement.id,
      relatedType: props.requirement.relatedType,
      relatedId: props.requirement.relatedId,
      type: props.requirement.type,
      content: props.requirement.content,
      problemToSolve: props.requirement.problemToSolve || '',
      tags: props.requirement.tags || [],
      priority: props.requirement.priority,
      status: props.requirement.status,
      notes: props.requirement.notes || '',
    })
  } else {
    // 新建模式：使用默认值
    Object.assign(formData, {
      id: undefined,
      relatedType: props.defaultRelatedType,
      relatedId: props.defaultRelatedId ? Number(props.defaultRelatedId) : undefined,
      type: RequirementType.EXPLICIT,
      content: '',
      problemToSolve: '',
      tags: [],
      priority: 0,
      status: 'pending',
      notes: '',
    })
  }
}

// 监听 requirement 变化
watch(
  () => props.requirement,
  () => {
    initFormData()
  },
  { immediate: true, deep: true }
)

// 监听默认值变化
watch(
  () => [props.defaultRelatedType, props.defaultRelatedId],
  () => {
    if (!props.requirement) {
      formData.relatedType = props.defaultRelatedType
      formData.relatedId = props.defaultRelatedId ? Number(props.defaultRelatedId) : undefined
    }
  }
)

// 暴露方法给父组件
defineExpose({
  validate: async () => {
    if (!formRef.value) return false
    try {
      await formRef.value.validate()
      return true
    } catch (error) {
      return false
    }
  },
  clearValidate: () => {
    formRef.value?.clearValidate()
  },
  resetFields: () => {
    formRef.value?.resetFields()
    initFormData()
  },
  getFormData: () => formData,
})

onMounted(() => {
  initFormData()
})
</script>

<style lang="scss" scoped>
// 组件样式
</style>

