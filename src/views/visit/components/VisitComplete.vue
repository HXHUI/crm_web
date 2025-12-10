<template>
  <el-form ref="formRef" :model="formData" label-width="100px">
    <el-form-item label="拜访结果">
      <el-input
        v-model="formData.result"
        type="textarea"
        :rows="4"
        placeholder="请输入拜访结果/反馈"
      />
    </el-form-item>
    <el-form-item label="客户反馈">
      <el-input
        v-model="formData.feedback"
        type="textarea"
        :rows="4"
        placeholder="请输入客户反馈"
      />
    </el-form-item>
    <el-form-item label="下一步行动">
      <el-input
        v-model="formData.nextAction"
        type="textarea"
        :rows="4"
        placeholder="请输入下一步行动计划"
      />
    </el-form-item>
    <el-form-item>
      <div style="display: flex; gap: 10px; justify-content: flex-end; width: 100%">
        <el-button @click="$emit('cancel')">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">完成拜访</el-button>
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import visitApi, { type Visit } from '@/api/visit'

const props = defineProps<{
  visit: Visit | null
}>()

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const formRef = ref<FormInstance>()
const submitting = ref(false)

const formData = reactive({
  result: '',
  feedback: '',
  nextAction: '',
})

const handleSubmit = async () => {
  if (!props.visit) return

  submitting.value = true
  try {
    await visitApi.complete(props.visit.id, formData)
    ElMessage.success('拜访已完成')
    emit('success')
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
</style>

