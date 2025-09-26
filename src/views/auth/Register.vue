<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-header">
        <div class="register-logo">
          <img src="/logo.png" alt="CRM" class="logo-image" />
        </div>
        <h1 class="register-title">注册账号</h1>
        <p class="register-subtitle">创建您的CRM账户</p>
      </div>
      
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
        @submit.prevent="handleRegister"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
        
                <el-form-item prop="phone">
                  <el-input
                    v-model="registerForm.phone"
                    placeholder="请输入手机号码"
                    size="large"
                    :prefix-icon="Phone"
                    clearable
                    @blur="handlePhoneBlur"
                    :loading="phoneChecking"
                  >
                    <template #suffix>
                      <el-icon v-if="phoneChecking" class="is-loading">
                        <Loading />
                      </el-icon>
                    </template>
                  </el-input>
                </el-form-item>
        
        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱（选填）"
            size="large"
            :prefix-icon="Message"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请确认密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleRegister"
          />
        </el-form-item>
        
        <el-form-item prop="tenantName">
          <el-input
            v-model="registerForm.tenantName"
            placeholder="请输入公司名称"
            size="large"
            :prefix-icon="OfficeBuilding"
            clearable
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="agreeTerms">
            我已阅读并同意
            <el-link type="primary" :underline="false">《用户协议》</el-link>
            和
            <el-link type="primary" :underline="false">《隐私政策》</el-link>
          </el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="register-button"
            :loading="loading"
            :disabled="!agreeTerms"
            @click="handleRegister"
          >
            {{ loading ? '注册中...' : '注册' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="register-footer">
        <p>
          已有账号？
          <el-link type="primary" @click="goToLogin">立即登录</el-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Phone, Message, Lock, OfficeBuilding, Loading } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/modules/auth'
import { checkPhoneExists } from '@/api/auth'
import type { RegisterRequest } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

// 表单引用
const registerFormRef = ref<FormInstance>()

// 表单数据
const registerForm = reactive<RegisterRequest & { confirmPassword: string }>({
  username: '黄孝辉',
  phone: '13713777064',
  email: '',
  password: 'rfd123456',
  confirmPassword: 'rfd123456',
  tenantName: '灵动云创'
})

// 同意条款
const agreeTerms = ref(false)

// 加载状态
const loading = ref(false)
const phoneChecking = ref(false)

// 防抖定时器
let phoneCheckTimer: number | null = null

// 确认密码验证
const validateConfirmPassword = (rule: any, value: string, callback: Function) => {
  if (value === '') {
    callback(new Error('请确认密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

// 手机号码格式验证
const validatePhoneFormat = (rule: any, value: string, callback: Function) => {
  if (value === '') {
    callback(new Error('请输入手机号码'))
    return
  }

  const phonePattern = /^1[3-9]\d{9}$/
  if (!phonePattern.test(value)) {
    callback(new Error('请输入正确的手机号码格式'))
    return
  }

  callback()
}

// 异步检查手机号码是否已存在
const checkPhoneUnique = async (phone: string) => {
  try {
    const response = await checkPhoneExists(phone)
    return !response.data.exists
  } catch (error) {
    console.error('检查手机号码失败:', error)
    return true // 如果检查失败，允许继续
  }
}

// 手机号码失焦时的异步校验
const handlePhoneBlur = async () => {
  if (!registerForm.phone) return

  // 先进行格式验证
  const phonePattern = /^1[3-9]\d{9}$/
  if (!phonePattern.test(registerForm.phone)) {
    return // 格式不正确时不进行唯一性检查
  }

  // 清除之前的定时器
  if (phoneCheckTimer) {
    clearTimeout(phoneCheckTimer)
  }

  // 设置防抖，500ms后执行校验
  phoneCheckTimer = setTimeout(async () => {
    phoneChecking.value = true
    try {
      const isUnique = await checkPhoneUnique(registerForm.phone)
      if (!isUnique) {
        ElMessage.error('该手机号码已被注册')
        // 清空手机号码输入框
        registerForm.phone = ''
      } else {
        ElMessage.success('手机号码可用')
      }
    } catch (error) {
      console.error('手机号码校验失败:', error)
      ElMessage.warning('手机号码校验失败，请稍后重试')
    } finally {
      phoneChecking.value = false
    }
  }, 500)
}

// 表单验证规则
const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, validator: validatePhoneFormat, trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
  tenantName: [
    { required: true, message: '请输入公司名称', trigger: 'blur' },
    { min: 2, max: 50, message: '公司名称长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return

  // 防止重复提交
  if (loading.value) {
    return
  }

  try {
    const valid = await registerFormRef.value.validate()
    if (!valid) return

    if (!agreeTerms.value) {
      ElMessage.warning('请先同意用户协议和隐私政策')
      return
    }

    // 手机号码唯一性检查已在失焦时完成，这里不需要重复检查

    loading.value = true

    const { confirmPassword, ...registerData } = registerForm

    try {
      const response = await authStore.registerUser(registerData)
      console.log('注册成功，响应数据:', response)
      console.log('当前认证状态:', authStore.isAuthenticated)
      console.log('当前用户:', authStore.user)
      ElMessage.success(`注册成功！欢迎 ${response.user.username}，您已成为 ${response.tenant.name} 的负责人`)
      
      // 等待状态完全更新
      await new Promise(resolve => setTimeout(resolve, 200))
      
      console.log('状态更新后 - 认证状态:', authStore.isAuthenticated)
      console.log('状态更新后 - 用户:', authStore.user)
      console.log('准备跳转到仪表盘')
      
      // 使用 replace 而不是 push，避免返回按钮问题
      try {
        await router.replace('/dashboard')
        console.log('跳转完成')
      } catch (routerError) {
        console.error('路由跳转失败:', routerError)
        // 如果路由跳转失败，尝试直接跳转
        window.location.href = '/dashboard'
      }
    } catch (apiError: any) {
      // 如果 API 调用失败，显示具体错误信息
      console.error('注册失败:', apiError)
      ElMessage.error(apiError.message || '注册失败，请检查网络连接')
    }
  } catch (error: any) {
    ElMessage.error('表单验证失败')
  } finally {
    loading.value = false
  }
}

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login')
}

// 组件卸载时清理定时器
onUnmounted(() => {
  if (phoneCheckTimer) {
    clearTimeout(phoneCheckTimer)
  }
})
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-box {
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-logo {
  margin-bottom: 20px;
}

.logo-image {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.register-title {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 8px 0;
}

.register-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.register-form {
  margin-bottom: 20px;
}

.register-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  font-weight: 500;
}

.register-footer {
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.register-footer p {
  margin: 0;
}
</style>
