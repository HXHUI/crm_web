<template>
  <div class="visit-checkin">
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <el-form-item label="签到照片" prop="checkInPhoto">
        <el-upload
          :action="uploadAction"
          :headers="uploadHeaders"
          :on-success="handleUploadSuccess"
          :before-upload="beforeUpload"
          list-type="picture"
          :limit="1"
        >
          <el-button :icon="Upload">上传照片</el-button>
        </el-upload>
      </el-form-item>
      <el-form-item label="签到备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入签到备注（可选）"
        />
      </el-form-item>
      <el-form-item>
        <div style="display: flex; gap: 10px; justify-content: flex-end; width: 100%">
          <el-button @click="$emit('cancel')">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">确认签到</el-button>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import visitApi, { type Visit, type CheckInDto } from '@/api/visit'

const props = defineProps<{
  visit: Visit | null
}>()

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const formRef = ref<FormInstance>()
const submitting = ref(false)

const formData = reactive<CheckInDto>({
  checkInPhoto: undefined,
  remark: '',
})

const rules: FormRules = {}

const uploadAction = computed(() => `${import.meta.env.VITE_API_BASE_URL || ''}/upload`)
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

// 上传前验证
const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

// 上传成功
const handleUploadSuccess = (response: any) => {
  const url = response?.data?.url || response?.url || response
  if (url) {
    formData.checkInPhoto = url
    ElMessage.success('上传成功')
  } else {
    ElMessage.error('上传失败：未获取到文件URL')
  }
}

// 提交
const handleSubmit = async () => {
  if (!formRef.value || !props.visit) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await visitApi.checkIn(props.visit.id, formData)
        ElMessage.success('签到成功')
        emit('success')
      } catch (error: any) {
        ElMessage.error(error.message || '签到失败')
      } finally {
        submitting.value = false
      }
    }
  })
}
</script>

<style scoped lang="scss">
.visit-checkin {
}
</style>

