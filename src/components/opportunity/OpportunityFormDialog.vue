<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="handleDialogUpdate"
    :title="title"
    width="800px"
    :close-on-click-modal="false"
  >
    <OpportunityForm
      ref="opportunityFormRef"
      :default-customer-id="defaultCustomerId"
      :opportunity="opportunity"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSave">
        {{ opportunity ? '保存' : '提交' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import OpportunityForm from './OpportunityForm.vue'
import opportunityApi, { type Opportunity, type CreateOpportunityDto, type UpdateOpportunityDto } from '@/api/opportunity'

const props = defineProps<{
  modelValue: boolean
  title?: string
  opportunity?: Opportunity | null
  defaultCustomerId?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
  'cancel': []
}>()

const opportunityFormRef = ref<InstanceType<typeof OpportunityForm>>()
const submitLoading = ref(false)

// 处理对话框显示状态变化
const handleDialogUpdate = (value: boolean) => {
  emit('update:modelValue', value)
  if (!value) {
    emit('cancel')
  }
}

// 处理取消
const handleCancel = () => {
  emit('update:modelValue', false)
  emit('cancel')
}

// 处理保存
const handleSave = async () => {
  if (!opportunityFormRef.value) {
    ElMessage.warning('表单未初始化')
    return
  }
  const success = await opportunityFormRef.value.submit()
  if (!success) {
    // 表单验证失败，submit 方法已经显示了错误消息
    return
  }
  // submit 事件会在 handleSubmit 中处理
}

// 处理表单提交事件
const handleSubmit = async (data: CreateOpportunityDto | UpdateOpportunityDto) => {
  try {
    submitLoading.value = true

    if (props.opportunity) {
      // 编辑模式
      await opportunityApi.update(props.opportunity.id, data as UpdateOpportunityDto)
      ElMessage.success('更新成功')
    } else {
      // 新建模式
      await opportunityApi.create(data as CreateOpportunityDto)
      ElMessage.success('创建成功')
    }

    emit('update:modelValue', false)
    emit('success')
  } catch (error: any) {
    console.error('提交失败:', error)
    ElMessage.error(error?.response?.data?.message || error?.message || '提交失败')
  } finally {
    submitLoading.value = false
  }
}

// 监听 modelValue 变化，打开时重置表单
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    nextTick(() => {
      opportunityFormRef.value?.resetForm()
    })
  }
})
</script>

<style scoped lang="scss">
// 样式可以根据需要添加
</style>

