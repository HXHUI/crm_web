import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Member, Tenant, LoginRequest, RegisterRequest } from '@/types'
import { login, register, logout, getCurrentUser, getAccessibleTenants, switchTenant } from '@/api/auth'
import { notificationSocketService } from '@/services/notification-socket.service'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)
  const member = ref<Member | null>(null)
  const tenant = ref<Tenant | null>(null)
  const accessibleTenants = ref<Tenant[]>([])
  const currentDepartmentId = ref<number | null>(null)
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

  // 判断当前用户是否为系统管理员
  const isSystemAdmin = computed(() => {
    return user.value?.isSystemAdmin === true
  })

  // 判断当前用户是否为租户管理员（基于角色系统，租户负责人自动拥有权限）
  const isTenantAdmin = computed(() => {
    if (isTenantOwner.value) {
      return true // 租户负责人自动拥有管理员权限
    }
    if (member.value?.memberRoles && member.value.memberRoles.length > 0) {
      return member.value.memberRoles.some(
        (mr: any) => mr.role?.name === '租户管理员'
      )
    }
    return false
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

      // 获取可访问的租户列表
      try {
        await fetchAccessibleTenants()
      } catch (error) {
        console.error('获取租户列表失败:', error)
        // 不影响登录流程
      }

      // 连接通知 WebSocket
      try {
        notificationSocketService.connect(response.data.access_token)
        // 请求浏览器通知权限
        notificationSocketService.requestPermission().catch(() => {
          // 用户拒绝权限，静默失败
        })
      } catch (error) {
        console.error('连接通知 WebSocket 失败:', error)
        // 不影响登录流程
      }

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

      // 获取可访问的租户列表
      try {
        await fetchAccessibleTenants()
      } catch (error) {
        console.error('获取租户列表失败:', error)
        // 不影响注册流程
      }

      // 连接通知 WebSocket
      try {
        notificationSocketService.connect(response.data.access_token)
        // 请求浏览器通知权限
        notificationSocketService.requestPermission().catch(() => {
          // 用户拒绝权限，静默失败
        })
      } catch (error) {
        console.error('连接通知 WebSocket 失败:', error)
        // 不影响注册流程
      }

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
      // 断开通知 WebSocket 连接
      notificationSocketService.disconnect()

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
      currentDepartmentId.value = null

      // 清除 localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('member')
      localStorage.removeItem('tenant')
      localStorage.removeItem('currentDepartmentId')
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

  // 获取可访问的租户列表
  const fetchAccessibleTenants = async () => {
    try {
      if (!token.value) return

      loading.value = true
      const response = await getAccessibleTenants()
      accessibleTenants.value = response.data || []

      // 标记当前租户
      if (tenant.value) {
        accessibleTenants.value = accessibleTenants.value.map(t => ({
          ...t,
          isCurrent: t.id === tenant.value?.id
        }))
      }

      return accessibleTenants.value
    } catch (error) {
      console.error('获取租户列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 切换租户
  const switchTenantUser = async (tenantId: string | number) => {
    try {
      loading.value = true

      const response = await switchTenant(tenantId)

      // 更新状态
      token.value = response.data.access_token
      user.value = response.data.user as User
      member.value = response.data.member as Member
      tenant.value = response.data.tenant as Tenant

      // 更新localStorage
      localStorage.setItem('token', response.data.access_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      localStorage.setItem('member', JSON.stringify(response.data.member))
      localStorage.setItem('tenant', JSON.stringify(response.data.tenant))

      // 重新获取可访问租户列表（因为切换后可能有新的租户列表）
      try {
        await fetchAccessibleTenants()
      } catch (error) {
        console.error('刷新租户列表失败:', error)
        // 即使刷新失败，也更新当前标记
        accessibleTenants.value = accessibleTenants.value.map(t => ({
          ...t,
          isCurrent: t.id === tenant.value?.id
        }))
      }

      return response.data
    } catch (error) {
      console.error('切换租户失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 设置当前部门ID
  const setCurrentDepartment = (departmentId: number | null) => {
    currentDepartmentId.value = departmentId
    if (departmentId) {
      localStorage.setItem('currentDepartmentId', departmentId.toString())
    } else {
      localStorage.removeItem('currentDepartmentId')
    }
  }

  // 初始化认证状态
  const initAuth = async () => {
    const storedToken = localStorage.getItem('token')

    if (!storedToken) {
      return // 没有token，不需要初始化
    }

    // 先设置token，这样请求拦截器可以使用它
    token.value = storedToken

    // 尝试从localStorage恢复用户信息（用于快速显示）
    const storedUser = localStorage.getItem('user')
    const storedMember = localStorage.getItem('member')
    const storedTenant = localStorage.getItem('tenant')
    const storedDepartmentId = localStorage.getItem('currentDepartmentId')

    if (storedUser && storedMember && storedTenant) {
      try {
      user.value = JSON.parse(storedUser)
      member.value = JSON.parse(storedMember)
      tenant.value = JSON.parse(storedTenant)
      } catch (error) {
        console.error('解析localStorage数据失败:', error)
      }
    }

    // 恢复当前部门ID
    if (storedDepartmentId) {
      currentDepartmentId.value = parseInt(storedDepartmentId, 10)
    }

    // 验证token是否仍然有效，并从服务器获取最新的用户信息
    // 这会确保使用token中的memberId和tenantId获取正确的租户信息
      try {
        await fetchCurrentUser()
      // 获取可访问的租户列表
      await fetchAccessibleTenants()
      } catch (error) {
        // 如果token无效，清除认证状态
        console.error('Token验证失败:', error)
        await logoutUser()
    }
  }

  return {
    // 状态
    token,
    user,
    member,
    tenant,
    accessibleTenants,
    currentDepartmentId,
    loading,

    // 计算属性
    isAuthenticated,
    currentUser,
    currentMember,
    currentTenant,
    isTenantOwner,
    isSystemAdmin,
    isTenantAdmin,

    // 方法
    loginUser,
    registerUser,
    logoutUser,
    fetchCurrentUser,
    fetchAccessibleTenants,
    switchTenantUser,
    setCurrentDepartment,
    initAuth
  }
})
