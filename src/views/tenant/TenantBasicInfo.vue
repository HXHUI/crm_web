<template>
  <div class="tenant-content-section">
    <h2 class="tenant-content-title">基本信息</h2>

    <!-- Logo设置 -->
    <div class="logo-section">
      <div class="logo-label">企业Logo</div>
      <div class="logo-wrapper">
        <el-avatar :size="120" shape="square" :src="tenantInfo?.logo" :key="tenantInfo?.logo || 'default'">
          <el-icon :size="60"><Picture /></el-icon>
        </el-avatar>
        <el-button
          type="primary"
          size="small"
          @click="handleLogoChange"
          :disabled="!isTenantOwner"
        >
          更换Logo
        </el-button>
        <input
          ref="logoInputRef"
          type="file"
          accept="image/*"
          style="display: none"
          @change="handleLogoUpload"
        />
      </div>
      <div class="logo-desc">
        <p>建议上传尺寸：200x200px，支持 JPG、PNG 格式</p>
        <p>文件大小不超过 5MB</p>
      </div>
    </div>

    <!-- 企业基本信息表单 -->
    <el-form
      ref="tenantFormRef"
      :model="tenantForm"
      :rules="tenantRules"
      label-width="140px"
      style="max-width: 600px"
    >
      <el-form-item label="* 企业名称" prop="name">
        <el-input
          v-model="tenantForm.name"
          placeholder="请输入企业名称"
          :disabled="!isTenantOwner"
        />
      </el-form-item>
      <el-form-item label="企业描述">
        <el-input
          v-model="tenantForm.description"
          type="textarea"
          :rows="4"
          placeholder="请输入企业描述"
          :disabled="!isTenantOwner"
        />
      </el-form-item>
      <el-form-item label="企业状态">
        <el-select
          v-model="tenantForm.status"
          placeholder="请选择状态"
          style="width: 100%"
          :disabled="!isTenantOwner"
        >
          <el-option label="活跃" value="active" />
          <el-option label="非活跃" value="inactive" />
          <el-option label="暂停" value="suspended" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="isTenantOwner">
        <el-button type="primary" @click="updateTenantInfo" :loading="tenantLoading">
          保存
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/modules/auth'
import { tenantApi } from '@/api/tenant'

const authStore = useAuthStore()

// 租户信息
const tenantInfo = computed(() => authStore.currentTenant)
const isTenantOwner = computed(() => authStore.isTenantOwner)

// Logo上传
const logoInputRef = ref<HTMLInputElement>()

// 租户表单
const tenantFormRef = ref<FormInstance>()
const tenantForm = reactive({
  name: '',
  description: '',
  status: 'active' as 'active' | 'inactive' | 'suspended'
})
const tenantLoading = ref(false)

// 表单验证规则
const tenantRules: FormRules = {
  name: [
    { required: true, message: '请输入企业名称', trigger: 'blur' },
    { min: 2, max: 50, message: '企业名称长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

// 初始化表单数据
const initFormData = () => {
  if (tenantInfo.value) {
    Object.assign(tenantForm, {
      name: tenantInfo.value.name || '',
      description: tenantInfo.value.description || '',
      status: tenantInfo.value.status || 'active'
    })
  }
}

// 处理Logo更换
const handleLogoChange = () => {
  if (!isTenantOwner.value) {
    ElMessage.warning('只有租户管理员可以修改企业Logo')
    return
  }
  logoInputRef.value?.click()
}

// 处理Logo上传
const handleLogoUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('不支持的文件类型，仅支持 JPG、PNG、GIF、WebP 格式的图片')
    target.value = ''
    return
  }

  // 验证文件大小（限制5MB）
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过5MB')
    target.value = ''
    return
  }

  try {
    // 上传Logo文件
    const uploadResponse = await tenantApi.uploadLogo(file)
    const logoUrl = uploadResponse.data.url

    // 更新租户Logo
    if (tenantInfo.value?.id) {
      await tenantApi.update(tenantInfo.value.id, { logo: logoUrl })
      ElMessage.success('Logo上传成功')
      // 刷新租户信息
      await authStore.fetchCurrentUser()
    }
  } catch (error: unknown) {
    let errorMessage = 'Logo上传失败'

    if (error && typeof error === 'object') {
      const err = error as {
        response?: {
          data?: {
            message?: string
            error?: string
          }
        }
        message?: string
      }

      errorMessage = err.response?.data?.message
        || err.response?.data?.error
        || err.message
        || errorMessage
    }

    ElMessage.error(errorMessage)
  } finally {
    if (target) {
      target.value = ''
    }
  }
}

// 更新租户信息
const updateTenantInfo = async () => {
  if (!tenantFormRef.value || !isTenantOwner.value) return

  try {
    const valid = await tenantFormRef.value.validate()
    if (!valid) return

    tenantLoading.value = true

    // 调用更新API
    if (tenantInfo.value?.id) {
      await tenantApi.update(tenantInfo.value.id, {
        name: tenantForm.name,
        description: tenantForm.description,
        status: tenantForm.status
      })
      ElMessage.success('企业信息更新成功')
      // 刷新租户信息
      await authStore.fetchCurrentUser()
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新失败'
    ElMessage.error(message)
  } finally {
    tenantLoading.value = false
  }
}

// 监听租户信息变化，自动更新表单数据
watch(
  () => tenantInfo.value,
  () => {
    if (tenantInfo.value) {
      initFormData()
    }
  },
  { deep: true }
)

onMounted(() => {
  initFormData()
})
</script>

<style lang="scss" scoped>
@use '@/styles/common/tenant-layout.scss';

.logo-section {
  margin-bottom: 32px;
}

.logo-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}

.logo-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.logo-desc {
  max-width: 600px;
}

.logo-desc p {
  margin: 4px 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
</style>

