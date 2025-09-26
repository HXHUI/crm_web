import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Member, Tenant, LoginRequest, RegisterRequest } from '@/types'
import { login, register, logout, getCurrentUser } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)
  const member = ref<Member | null>(null)
  const tenant = ref<Tenant | null>(null)
  const loading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value)
  const currentUser = computed(() => user.value)
  const currentMember = computed(() => member.value)
  const currentTenant = computed(() => tenant.value)
  
  // 判断当前用户是否为租户负责人
  const isTenantOwner = computed(() => {
    return user.value && tenant.value && user.value.id === tenant.value.ownerId
  })

  // 登录
  const loginUser = async (loginData: LoginRequest) => {
    try {
      loading.value = true

      // 调用真实的后端登录接口
      const response = await login(loginData)

      // 更新状态 - 现在数据在 response.data 中
      token.value = response.data.access_token
      user.value = response.data.user as User
      member.value = response.data.member as Member
      tenant.value = response.data.tenant as Tenant

      // 保存到 localStorage
      localStorage.setItem('token', response.data.access_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      localStorage.setItem('member', JSON.stringify(response.data.member))
      localStorage.setItem('tenant', JSON.stringify(response.data.tenant))

      return response.data
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 注册
  const registerUser = async (registerData: RegisterRequest) => {
    try {
      loading.value = true

      // 调用真实的后端注册接口
      const response = await register(registerData)

      // 更新状态 - 现在数据在 response.data 中
      token.value = response.data.access_token
      user.value = response.data.user as User
      member.value = response.data.member as Member
      tenant.value = response.data.tenant as Tenant

      // 保存到 localStorage
      localStorage.setItem('token', response.data.access_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      localStorage.setItem('member', JSON.stringify(response.data.member))
      localStorage.setItem('tenant', JSON.stringify(response.data.tenant))

      return response.data
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }
  
  // 生成租户域名的辅助函数
  const generateDomainFromName = (tenantName: string) => {
    // 将公司名称转换为域名格式
    const domain = tenantName
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '') // 移除特殊字符，保留中文、字母、数字
      .replace(/[\u4e00-\u9fa5]/g, '') // 移除中文字符
      .substring(0, 20) // 限制长度
    return domain || 'tenant' + Date.now()
  }

  // 登出
  const logoutUser = async () => {
    try {
      if (token.value) {
        await logout()
      }
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      // 清除状态
      token.value = null
      user.value = null
      member.value = null
      tenant.value = null
      
      // 清除 localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('member')
      localStorage.removeItem('tenant')
    }
  }

  // 获取当前用户信息
  const fetchCurrentUser = async () => {
    try {
      if (!token.value) return
      
      loading.value = true
      const response = await getCurrentUser()
      
      // 现在数据在 response.data 中
      user.value = response.data.user
      member.value = response.data.member
      tenant.value = response.data.tenant
      
      // 更新 localStorage
      localStorage.setItem('user', JSON.stringify(response.data.user))
      localStorage.setItem('member', JSON.stringify(response.data.member))
      localStorage.setItem('tenant', JSON.stringify(response.data.tenant))
      
      return response.data
    } catch (error) {
      // 如果获取用户信息失败，清除认证状态
      await logoutUser()
      throw error
    } finally {
      loading.value = false
    }
  }

  // 初始化认证状态
  const initAuth = async () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const storedMember = localStorage.getItem('member')
    const storedTenant = localStorage.getItem('tenant')
    
    if (storedToken && storedUser && storedMember && storedTenant) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
      member.value = JSON.parse(storedMember)
      tenant.value = JSON.parse(storedTenant)
      
      // 验证token是否仍然有效
      try {
        await fetchCurrentUser()
      } catch (error) {
        // 如果token无效，清除认证状态
        console.error('Token验证失败:', error)
        await logoutUser()
      }
    }
  }

  return {
    // 状态
    token,
    user,
    member,
    tenant,
    loading,
    
    // 计算属性
    isAuthenticated,
    currentUser,
    currentMember,
    currentTenant,
    isTenantOwner,
    
    // 方法
    loginUser,
    registerUser,
    logoutUser,
    fetchCurrentUser,
    initAuth
  }
})
