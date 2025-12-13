<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="handleDialogUpdate"
    :title="title"
    width="1200px"
    :close-on-click-modal="false"
  >
    <OrderForm
      ref="orderFormRef"
      :default-customer-id="defaultCustomerId"
      :order="order"
      @submit="handleSubmitEvent"
      @cancel="handleCancel"
    />
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button
        v-if="hasWorkflowTemplate"
        :loading="submitLoading"
        @click="handleSaveDraft"
      >
        保存草稿
      </el-button>
      <el-button
        v-if="hasWorkflowTemplate"
        type="primary"
        :loading="submitLoading"
        @click="handleSubmitApproval"
      >
        提交审批
      </el-button>
      <el-button
        v-if="!hasWorkflowTemplate"
        type="primary"
        :loading="submitLoading"
        @click="handleSave"
      >
        {{ order ? '保存' : '提交' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import OrderForm from './OrderForm.vue'
import orderApi, { type Order, type CreateOrderDto, type UpdateOrderDto } from '@/api/order'
import { getWorkflowTemplates, submitOrderApproval, type WorkflowTemplate } from '@/api/workflow'

const props = defineProps<{
  modelValue: boolean
  title?: string
  order?: Order | null
  defaultCustomerId?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
  'cancel': []
}>()

const orderFormRef = ref<InstanceType<typeof OrderForm>>()
const submitLoading = ref(false)
const hasWorkflowTemplate = ref(false)
const workflowTemplates = ref<WorkflowTemplate[]>([])
const submitStatus = ref<'draft' | 'pending_approval' | 'approved'>('draft')

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

// 检查是否有审批流模板
const checkWorkflowTemplate = async () => {
  try {
    const response = await getWorkflowTemplates('order') as unknown as {
      code: number
      data?: WorkflowTemplate[]
    }
    if (response.code === 200) {
      const activeTemplates = (response.data || []).filter((t: WorkflowTemplate) => t.isActive)
      workflowTemplates.value = activeTemplates
      hasWorkflowTemplate.value = activeTemplates.length > 0
    } else {
      workflowTemplates.value = []
      hasWorkflowTemplate.value = false
    }
  } catch (error) {
    console.error('检查审批流模板失败:', error)
    workflowTemplates.value = []
    hasWorkflowTemplate.value = false
  }
}

// 处理表单提交（带状态）
const handleOrderSubmit = async (data: CreateOrderDto | UpdateOrderDto, status?: 'draft' | 'pending_approval' | 'approved', needSubmitApproval = false) => {
  try {
    submitLoading.value = true

    // 设置状态
    if (status) {
      if ('status' in data) {
        (data as any).status = status
      } else {
        (data as any).status = status
      }
    }

    let orderId: string | number | undefined

    if (props.order) {
      // 编辑模式
      await orderApi.update(props.order.id, data as UpdateOrderDto)
      orderId = props.order.id
      ElMessage.success('更新成功')
    } else {
      // 新建模式
      const response = await orderApi.create(data as Omit<CreateOrderDto, 'orderNumber'>) as unknown as {
        code: number
        data?: Order
      }
      if (response.code === 201 && response.data) {
        orderId = response.data.id
        ElMessage.success('创建成功')
      }
    }

    // 如果需要提交审批，且订单已创建/更新成功
    if (needSubmitApproval && orderId && workflowTemplates.value.length > 0) {
      try {
        // 如果只有一个启用的模板，直接提交
        if (workflowTemplates.value.length === 1) {
          await submitOrderApproval(Number(orderId), {
            templateId: workflowTemplates.value[0].id,
          }) as unknown as { code: number }
          ElMessage.success('提交审批成功')
        } else {
          // 如果有多个模板，需要用户选择（这里暂时使用第一个，后续可以优化为弹出选择对话框）
          await submitOrderApproval(Number(orderId), {
            templateId: workflowTemplates.value[0].id,
          }) as unknown as { code: number }
          ElMessage.success('提交审批成功')
        }
      } catch (error) {
        console.error('提交审批失败:', error)
        ElMessage.warning('订单已保存，但提交审批失败，请稍后手动提交审批')
      }
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

// 处理表单提交（带状态）
const handleOrderSubmitWithStatus = async (data: CreateOrderDto | UpdateOrderDto) => {
  let status: 'draft' | 'pending_approval' | 'approved' = 'draft'
  let needSubmitApproval = false
  
  if (hasWorkflowTemplate.value) {
    // 有审批流配置，根据按钮类型设置状态
    if (submitStatus.value === 'pending_approval') {
      // 提交审批时，先保存为草稿状态，然后通过API提交审批（API会将状态改为pending_approval）
      status = 'draft'
      needSubmitApproval = true
    } else {
      status = 'draft'
    }
  } else {
    // 没有审批流配置，直接设置为已审批
    status = 'approved'
  }
  
  await handleOrderSubmit(data, status, needSubmitApproval)
  // 重置状态
  submitStatus.value = 'draft'
}

// 处理提交（简单模式，无审批流）
const handleSave = async () => {
  if (!orderFormRef.value) {
    ElMessage.warning('表单未初始化')
    return
  }
  const success = await orderFormRef.value.submit()
  if (success) {
    // submit 事件会在 handleSubmitEvent 中处理
  }
}

// 保存草稿
const handleSaveDraft = async () => {
  if (!orderFormRef.value) {
    ElMessage.warning('表单未初始化')
    return
  }
  submitStatus.value = 'draft'
  const success = await orderFormRef.value.submit()
  if (!success) {
    submitStatus.value = 'draft'
  }
}

// 提交审批
const handleSubmitApproval = async () => {
  if (!orderFormRef.value) {
    ElMessage.warning('表单未初始化')
    return
  }
  submitStatus.value = 'pending_approval'
  const success = await orderFormRef.value.submit()
  if (!success) {
    submitStatus.value = 'draft'
  }
}

// 处理表单提交事件
const handleSubmitEvent = async (data: CreateOrderDto | UpdateOrderDto) => {
  if (hasWorkflowTemplate.value) {
    await handleOrderSubmitWithStatus(data)
  } else {
    // 简单模式：直接保存为已审批状态
    await handleOrderSubmit(data, 'approved', false)
  }
}

// 监听 modelValue 变化，打开时检查审批流模板
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    checkWorkflowTemplate()
    nextTick(() => {
      orderFormRef.value?.resetForm()
    })
  }
})
</script>

<style scoped lang="scss">
// 样式可以根据需要添加
</style>

