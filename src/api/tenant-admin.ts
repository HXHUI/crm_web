import request from '@/utils/request'
import type { Member } from './member'

export interface TenantAdmin {
  id: string
  memberId: string
  userId: string
  username: string
  email?: string
  phone?: string
  avatar?: string
  status: 'active' | 'inactive' | 'suspended'
  roleId: string
  roleName: string
  createdAt: string
  updatedAt: string
  member?: Member
}

export interface CreateTenantAdminDto {
  memberId: string
}

export interface QueryTenantAdminDto {
  search?: string
  page?: number
  limit?: number
}

export interface TenantAdminListResponse {
  admins: TenantAdmin[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 租户管理员角色名称常量
export const TENANT_ADMIN_ROLE_NAME = '租户管理员'

export const tenantAdminApi = {
  // 获取租户管理员列表
  getList: (params?: QueryTenantAdminDto): Promise<{ code: number; message: string; data: TenantAdminListResponse }> => {
    return request.get('/tenants/admins', { params })
  },

  // 添加租户管理员（给成员分配租户管理员角色）
  create: (data: CreateTenantAdminDto): Promise<{ code: number; message: string; data: TenantAdmin }> => {
    return request.post('/tenants/admins', data)
  },

  // 移除租户管理员权限（移除成员的租户管理员角色）
  remove: (memberId: string): Promise<{ code: number; message: string }> => {
    return request.delete(`/tenants/admins/${memberId}`)
  },

  // 获取可用的成员列表（用于添加管理员时选择）
  getAvailableMembers: (params?: { search?: string; page?: number; limit?: number }): Promise<{ code: number; message: string; data: { members: Member[]; total: number } }> => {
    return request.get('/tenants/admins/available-members', { params })
  },
}

export default tenantAdminApi
