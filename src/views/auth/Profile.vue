<template>
  <div class="profile">
    <div class="page-header">
      <h1 class="page-title">个人资料</h1>
    </div>
    
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="profile-card">
          <div class="profile-avatar">
            <el-avatar :size="120" :src="userInfo.avatar">
              {{ userInfo.username?.charAt(0).toUpperCase() }}
            </el-avatar>
            <el-button type="primary" size="small" class="upload-btn">更换头像</el-button>
          </div>
          <div class="profile-info">
            <h3>{{ userInfo.username }}</h3>
            <p>{{ userInfo.email }}</p>
            <p>{{ userInfo.phone || '未设置电话' }}</p>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="16">
        <el-card>
          <el-tabs v-model="activeTab">
            <el-tab-pane label="基本信息" name="basic">
              <el-form
                ref="basicFormRef"
                :model="basicForm"
                :rules="basicRules"
                label-width="100px"
              >
                <el-form-item label="用户名" prop="username">
                  <el-input v-model="basicForm.username" />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="basicForm.email" />
                </el-form-item>
                <el-form-item label="电话" prop="phone">
                  <el-input v-model="basicForm.phone" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="updateBasicInfo" :loading="basicLoading">
                    保存
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            
            <el-tab-pane label="修改密码" name="password">
              <el-form
                ref="passwordFormRef"
                :model="passwordForm"
                :rules="passwordRules"
                label-width="100px"
              >
                <el-form-item label="当前密码" prop="currentPassword">
                  <el-input
                    v-model="passwordForm.currentPassword"
                    type="password"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input
                    v-model="passwordForm.newPassword"
                    type="password"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    show-password
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="updatePassword" :loading="passwordLoading">
                    修改密码
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/modules/auth'
import type { User } from '@/types'

const authStore = useAuthStore()

// 当前用户信息
const userInfo = computed(() => authStore.currentUser || {} as User)

// 当前标签页
const activeTab = ref('basic')

// 基本信息表单
const basicFormRef = ref<FormInstance>()
const basicForm = reactive({
  username: '',
  email: '',
  phone: ''
})
const basicLoading = ref(false)

// 密码表单
const passwordFormRef = ref<FormInstance>()
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordLoading = ref(false)

// 确认密码验证
const validateConfirmPassword = (rule: any, value: string, callback: Function) => {
  if (value === '') {
    callback(new Error('请确认密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

// 基本信息表单验证规则
const basicRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

// 密码表单验证规则
const passwordRules: FormRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 初始化表单数据
const initFormData = () => {
  if (userInfo.value) {
    Object.assign(basicForm, {
      username: userInfo.value.username || '',
      email: userInfo.value.email || '',
      phone: userInfo.value.phone || ''
    })
  }
}

// 更新基本信息
const updateBasicInfo = async () => {
  if (!basicFormRef.value) return
  
  try {
    const valid = await basicFormRef.value.validate()
    if (!valid) return
    
    basicLoading.value = true
    
    // 这里应该调用更新API
    ElMessage.success('基本信息更新成功')
  } catch (error) {
    ElMessage.error('更新失败')
  } finally {
    basicLoading.value = false
  }
}

// 更新密码
const updatePassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    const valid = await passwordFormRef.value.validate()
    if (!valid) return
    
    passwordLoading.value = true
    
    // 这里应该调用更新密码API
    ElMessage.success('密码修改成功')
    
    // 重置密码表单
    Object.assign(passwordForm, {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    passwordFormRef.value.resetFields()
  } catch (error) {
    ElMessage.error('密码修改失败')
  } finally {
    passwordLoading.value = false
  }
}

onMounted(() => {
  initFormData()
})
</script>

<style scoped>
.profile {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.profile-card {
  text-align: center;
}

.profile-avatar {
  margin-bottom: 20px;
}

.upload-btn {
  margin-top: 10px;
}

.profile-info h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.profile-info p {
  margin: 5px 0;
  color: #909399;
}
</style>
