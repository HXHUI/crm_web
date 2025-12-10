<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="600px"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData" label-width="100px">
      <el-form-item
        v-if="actionType === 'transfer'"
        label="转办给"
        :rules="[{ required: true, message: '请选择转办对象' }]"
      >
        <el-select
          v-model="formData.transferredTo"
          placeholder="请选择转办对象"
          style="width: 100%"
          filterable
        >
          <!-- TODO: 从API获取成员列表 -->
          <el-option
            v-for="member in memberList"
            :key="member.id"
            :label="member.name"
            :value="member.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item
        v-if="actionType === 'add_sign'"
        label="加签人员"
        :rules="[{ required: true, message: '请选择加签人员' }]"
      >
        <el-select
          v-model="formData.approverIds"
          multiple
          placeholder="请选择加签人员"
          style="width: 100%"
          filterable
        >
          <!-- TODO: 从API获取成员列表 -->
          <el-option
            v-for="member in memberList"
            :key="member.id"
            :label="member.name"
            :value="member.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item
        v-if="actionType === 'return'"
        label="退回至"
      >
        <el-select
          v-model="formData.returnToNodeOrder"
          placeholder="退回至发起人（不选择则退回发起人）"
          clearable
          style="width: 100%"
        >
          <!-- TODO: 显示节点列表 -->
          <el-option
            v-for="node in nodeList"
            :key="node.order"
            :label="`节点 ${node.order}: ${node.name}`"
            :value="node.order"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="审批意见">
        <el-input
          v-model="formData.comment"
          type="textarea"
          :rows="4"
          placeholder="请输入审批意见"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button
        v-if="actionType === 'approve'"
        type="success"
        :loading="submitLoading"
        @click="handleApprove"
      >
        同意
      </el-button>
      <el-button
        v-if="actionType === 'reject'"
        type="danger"
        :loading="submitLoading"
        @click="handleReject"
      >
        驳回
      </el-button>
      <el-button
        v-if="actionType === 'transfer'"
        type="primary"
        :loading="submitLoading"
        @click="handleTransfer"
      >
        转办
      </el-button>
      <el-button
        v-if="actionType === 'add_sign'"
        type="primary"
        :loading="submitLoading"
        @click="handleAddSign"
      >
        加签
      </el-button>
      <el-button
        v-if="actionType === 'return'"
        type="warning"
        :loading="submitLoading"
        @click="handleReturn"
      >
        退回
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  approveWorkflow,
  rejectWorkflow,
  transferWorkflow,
  addSignWorkflow,
  returnWorkflow,
} from '@/api/workflow'

interface Props {
  modelValue: boolean
  instanceId?: number
  actionType: 'approve' | 'reject' | 'transfer' | 'add_sign' | 'return'
  nodeList?: Array<{ order: number; name: string }>
}

const props = withDefaults(defineProps<Props>(), {
  instanceId: undefined,
  nodeList: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

const formRef = ref()
const submitLoading = ref(false)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const dialogTitle = computed(() => {
  const titleMap: Record<string, string> = {
    approve: '同意',
    reject: '驳回',
    transfer: '转办',
    add_sign: '加签',
    return: '退回修改',
  }
  return titleMap[props.actionType] || '审批操作'
})

const formData = reactive({
  transferredTo: undefined as number | undefined,
  approverIds: [] as number[],
  returnToNodeOrder: undefined as number | undefined,
  comment: '',
})

// 成员列表（TODO: 从API获取）
const memberList = ref<any[]>([])

// 监听对话框打开，重置表单
watch(dialogVisible, (val) => {
  if (val) {
    formData.transferredTo = undefined
    formData.approverIds = []
    formData.returnToNodeOrder = undefined
    formData.comment = ''
  }
})

// 审批通过
const handleApprove = async () => {
  if (!props.instanceId) return

  try {
    submitLoading.value = true
    const response = await approveWorkflow(props.instanceId, formData.comment)
    if (response.code === 200) {
      ElMessage.success('审批通过成功')
      emit('success')
      dialogVisible.value = false
    }
  } catch (error: any) {
    console.error('审批通过失败:', error)
    ElMessage.error(error.message || '审批通过失败')
  } finally {
    submitLoading.value = false
  }
}

// 审批拒绝
const handleReject = async () => {
  if (!props.instanceId) return

  try {
    submitLoading.value = true
    const response = await rejectWorkflow(props.instanceId, formData.comment)
    if (response.code === 200) {
      ElMessage.success('审批拒绝成功')
      emit('success')
      dialogVisible.value = false
    }
  } catch (error: any) {
    console.error('审批拒绝失败:', error)
    ElMessage.error(error.message || '审批拒绝失败')
  } finally {
    submitLoading.value = false
  }
}

// 转办
const handleTransfer = async () => {
  if (!props.instanceId) return

  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    try {
      submitLoading.value = true
      const response = await transferWorkflow(props.instanceId, {
        transferredTo: formData.transferredTo!,
        comment: formData.comment,
      })
      if (response.code === 200) {
        ElMessage.success('转办成功')
        emit('success')
        dialogVisible.value = false
      }
    } catch (error: any) {
      console.error('转办失败:', error)
      ElMessage.error(error.message || '转办失败')
    } finally {
      submitLoading.value = false
    }
  })
}

// 加签
const handleAddSign = async () => {
  if (!props.instanceId) return

  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    try {
      submitLoading.value = true
      const response = await addSignWorkflow(props.instanceId, {
        approverIds: formData.approverIds,
        comment: formData.comment,
      })
      if (response.code === 200) {
        ElMessage.success('加签成功')
        emit('success')
        dialogVisible.value = false
      }
    } catch (error: any) {
      console.error('加签失败:', error)
      ElMessage.error(error.message || '加签失败')
    } finally {
      submitLoading.value = false
    }
  })
}

// 退回
const handleReturn = async () => {
  if (!props.instanceId) return

  try {
    submitLoading.value = true
    const response = await returnWorkflow(props.instanceId, {
      returnToNodeOrder: formData.returnToNodeOrder,
      comment: formData.comment,
    })
    if (response.code === 200) {
      ElMessage.success('退回成功')
      emit('success')
      dialogVisible.value = false
    }
  } catch (error: any) {
    console.error('退回失败:', error)
    ElMessage.error(error.message || '退回失败')
  } finally {
    submitLoading.value = false
  }
}

// 取消
const handleCancel = () => {
  dialogVisible.value = false
}
</script>

<style scoped lang="scss">
</style>

