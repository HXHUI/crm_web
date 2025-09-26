import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Tenant, Member, Department, Role, PaginatedResponse } from '@/types'
import { getTenantMembers, getTenantDepartments, getTenantRoles } from '@/api/tenant'

export const useTenantStore = defineStore('tenant', () => {
  // 状态
  const currentTenant = ref<Tenant | null>(null)
  const members = ref<Member[]>([])
  const departments = ref<Department[]>([])
  const roles = ref<Role[]>([])
  const loading = ref(false)

  // 计算属性
  const memberCount = computed(() => members.value.length)
  const departmentCount = computed(() => departments.value.length)
  const roleCount = computed(() => roles.value.length)

  // 获取租户成员
  const fetchMembers = async (page = 1, pageSize = 10) => {
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
  }

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
    
    // 计算属性
    memberCount,
    departmentCount,
    roleCount,
    
    // 方法
    fetchMembers,
    fetchDepartments,
    fetchRoles,
    setCurrentTenant,
    clearTenantData
  }
})
