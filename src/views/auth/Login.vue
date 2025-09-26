<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="login-logo">
          <img src="/logo.png" alt="CRM" class="logo-image" />
        </div>
        <h1 class="login-title">CRM管理系统</h1>
        <p class="login-subtitle">客户关系管理平台</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名或手机号码"
            size="large"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <div class="login-options">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            <el-link type="primary" :underline="false">忘记密码？</el-link>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-button"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p>
          还没有账号？
          <el-link type="primary" @click="goToRegister">立即注册</el-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/modules/auth'
import type { LoginRequest } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

// 表单引用
const loginFormRef = ref<FormInstance>()

// 表单数据
const loginForm = reactive<LoginRequest>({
  username: '',
  password: ''
})

// 记住我
const rememberMe = ref(false)

// 加载状态
const loading = ref(false)

// 用户名或手机号码验证
const validateUsernameOrPhone = (rule: any, value: string, callback: Function) => {
  if (value === '') {
    callback(new Error('请输入用户名或手机号码'))
    return
  }
  
  // 检查是否为手机号码格式
  const phonePattern = /^1[3-9]\d{9}$/
  // 检查是否为用户名格式（3-20个字符，字母数字下划线）
  const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/
  
  if (phonePattern.test(value) || usernamePattern.test(value)) {
    callback()
  } else {
    callback(new Error('请输入正确的用户名或手机号码格式'))
  }
}

// 表单验证规则
const loginRules: FormRules = {
  username: [
    { required: true, validator: validateUsernameOrPhone, trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  // 防止重复提交
  if (loading.value) {
    return
  }
  
  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) return
    
    loading.value = true
    
    try {
      await authStore.loginUser(loginForm)
      ElMessage.success('登录成功')
      router.push('/dashboard')
    } catch (apiError: any) {
      // 如果 API 调用失败，显示具体错误信息
      ElMessage.error(apiError.message || '登录失败，请检查用户名和密码')
    }
  } catch (error: any) {
    ElMessage.error('表单验证失败')
  } finally {
    loading.value = false
  }
}

// 跳转到注册页面
const goToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-logo {
  margin-bottom: 20px;
}

.logo-image {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.login-title {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 8px 0;
}

.login-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.login-form {
  margin-bottom: 20px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.login-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  font-weight: 500;
}

.login-footer {
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.login-footer p {
  margin: 0;
}
</style>
