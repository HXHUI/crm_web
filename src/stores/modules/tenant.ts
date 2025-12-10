import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Tenant, Member, Department, Role, PaginatedResponse } from '@/types'
import { getTenantMembers, getTenantDepartments, getTenantRoles, tenantApi } from '@/api/tenant'

export const useTenantStore = defineStore('tenant', () => {
  // 状态
  const currentTenant = ref<Tenant | null>(null)
  const members = ref<Member[]>([])
  const departments = ref<Department[]>([])
  const roles = ref<Role[]>([])
  const loading = ref(false)

  // 集团相关状态
  const currentViewType = ref<'tenant' | 'group'>('tenant')
  const hasChildren = ref(false)
  const isGroupAdmin = ref(false)

  // 计算属性
  const memberCount = computed(() => members.value.length)
  const departmentCount = computed(() => departments.value.length)
  const roleCount = computed(() => roles.value.length)

  // 获取租户成员
  const fetchMembers = async (page = 1, pageSize = 50) => {
    try {
      loading.value = true
      const response = await getTenantMembers(page, pageSize)
      members.value = response.items
      return response
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取租户部门
  const fetchDepartments = async () => {
    try {
      loading.value = true
      const response = await getTenantDepartments()
      departments.value = response
      return response
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取租户角色
  const fetchRoles = async () => {
    try {
      loading.value = true
      const response = await getTenantRoles()
      roles.value = response
      return response
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 设置当前租户
  const setCurrentTenant = (tenant: Tenant) => {
    currentTenant.value = tenant
    // 不在这里自动检查子租户，避免非所有者调用 API 导致 403 错误
    // 由调用方根据权限决定是否调用 checkHasChildrenWithPermission
    hasChildren.value = false
  }

  // 检查是否有子租户（仅租户所有者可以查看）
  const checkHasChildren = async () => {
    if (!currentTenant.value?.id) {
      hasChildren.value = false
      return
    }
    
    // 只有租户所有者才能查看子租户，非所有者直接设置为 false
    // 这里需要从 authStore 获取 isTenantOwner，但为了避免循环依赖，我们通过参数传递
    // 或者在这里不检查，让调用方传入权限信息
    // 暂时先不调用 API，避免 403 错误
    hasChildren.value = false
  }
  
  // 检查是否有子租户（带权限检查）
  const checkHasChildrenWithPermission = async (isOwner: boolean) => {
    if (!currentTenant.value?.id || !isOwner) {
      hasChildren.value = false
      return
    }
    try {
      const response = await tenantApi.getChildren(currentTenant.value.id)
      hasChildren.value = (response.data?.length || 0) > 0
    } catch {
      hasChildren.value = false
    }
  }

  // 切换视图类型
  const setViewType = (viewType: 'tenant' | 'group') => {
    currentViewType.value = viewType
  }

  // 设置是否为集团管理员
  const setIsGroupAdmin = (value: boolean) => {
    isGroupAdmin.value = value
  }

  // 检查是否可以切换到集团视图（有子租户且是管理员）
  const canViewGroup = computed(() => {
    return hasChildren.value && isGroupAdmin.value
  })

  // 清除租户数据
  const clearTenantData = () => {
    currentTenant.value = null
    members.value = []
    departments.value = []
    roles.value = []
  }

  return {
    // 状态
    currentTenant,
    members,
    departments,
    roles,
    loading,
    currentViewType,
    hasChildren,
    isGroupAdmin,
    
    // 计算属性
    memberCount,
    departmentCount,
    roleCount,
    canViewGroup,
    
    // 方法
    fetchMembers,
    fetchDepartments,
    fetchRoles,
    setCurrentTenant,
    clearTenantData,
    setViewType,
    setIsGroupAdmin,
    checkHasChildrenWithPermission,
  }
})
