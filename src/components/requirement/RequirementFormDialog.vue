<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <RequirementForm
      ref="formRef"
      :requirement="requirement"
      :default-related-type="defaultRelatedType"
      :default-related-id="defaultRelatedId"
      :show-related-selector="showRelatedSelector"
      :common-tags="commonTags"
    />
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import RequirementForm from './RequirementForm.vue'
import {
  RequirementRelatedType,
  type CustomerRequirement,
  type CreateRequirementDto,
} from '@/api/customerRequirement'
import customerRequirementApi from '@/api/customerRequirement'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    // 需求数据（编辑时传入）
    requirement?: CustomerRequirement | null
    // 默认关联类型
    defaultRelatedType?: RequirementRelatedType
    // 默认关联ID
    defaultRelatedId?: number | string
    // 是否显示关联对象选择器
    showRelatedSelector?: boolean
    // 常用标签列表
    commonTags?: string[]
  }>(),
  {
    requirement: null,
    defaultRelatedType: RequirementRelatedType.CUSTOMER,
    defaultRelatedId: undefined,
    showRelatedSelector: false,
    commonTags: undefined,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
  cancel: []
}>()

const formRef = ref<InstanceType<typeof RequirementForm> | null>(null)
const saving = ref(false)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const title = computed(() => {
  return props.requirement ? '编辑需求' : '新增需求'
})

const handleConfirm = async () => {
  if (!formRef.value) return
  saving.value = true
  try {
    const formData = formRef.value.getFormData()
    
    // 验证表单
    if (!formRef.value.validate) {
      ElMessage.error('表单验证失败')
      return
    }

    const valid = await formRef.value.validate()
    if (!valid) {
      return
    }

    // 构建提交数据
    const payload: CreateRequirementDto = {
      relatedType: formData.relatedType!,
      relatedId: formData.relatedId!,
      type: formData.type!,
      content: formData.content!,
      problemToSolve: formData.problemToSolve,
      tags: formData.tags,
      priority: formData.priority ?? 0,
      status: formData.status || 'pending',
      notes: formData.notes,
    }

    // 提交数据
    if (props.requirement?.id) {
      // 编辑
      await customerRequirementApi.update(props.requirement.id, payload)
      ElMessage.success('更新需求成功')
    } else {
      // 新建
      await customerRequirementApi.create(payload)
      ElMessage.success('创建需求成功')
    }

    dialogVisible.value = false
    emit('success')
  } catch (error: any) {
    console.error('提交失败:', error)
    ElMessage.error(error.message || '操作失败，请稍后重试')
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

// 监听对话框显示状态，重置表单
watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      formRef.value?.clearValidate()
    }
  }
)
</script>

<style lang="scss" scoped>
// 组件样式
</style>

