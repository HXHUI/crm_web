import request from '@/utils/request'

// 租户接口类型定义
export interface Tenant {
  id: string
  name: string
  slug: string
  status: 'active' | 'inactive' | 'suspended'
  ownerId: string
  createdAt: string
  updatedAt: string
  memberCount?: number
}

export interface CreateTenantDto {
  name: string
  slug?: string
  status?: 'active' | 'inactive' | 'suspended'
}

export interface UpdateTenantDto {
  name?: string
  slug?: string
  status?: 'active' | 'inactive' | 'suspended'
}

export interface QueryTenantDto {
  search?: string
  status?: 'active' | 'inactive' | 'suspended'
  page?: number
  limit?: number
}

export interface TenantListResponse {
  tenants: Tenant[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 租户管理API
export const tenantApi = {
  // 获取租户列表
  getList: (params?: QueryTenantDto): Promise<{ code: number; message: string; data: TenantListResponse }> => {
    return request.get('/tenants', { params })
  },

  // 获取租户详情
  getDetail: (id: string): Promise<{ code: number; message: string; data: Tenant }> => {
    return request.get(`/tenants/${id}`)
  },

  // 创建租户
  create: (data: CreateTenantDto): Promise<{ code: number; message: string; data: Tenant }> => {
    return request.post('/tenants', data)
  },

  // 更新租户
  update: (id: string, data: UpdateTenantDto): Promise<{ code: number; message: string; data: Tenant }> => {
    return request.put(`/tenants/${id}`, data)
  },

  // 删除租户
  delete: (id: string): Promise<{ code: number; message: string }> => {
    return request.delete(`/tenants/${id}`)
  },

  // 获取租户成员列表
  getMembers: (id: string, params?: { page?: number; limit?: number; search?: string }): Promise<{ code: number; message: string; data: any }> => {
    return request.get(`/tenants/${id}/members`, { params })
  },

  // 添加租户成员
  addMember: (id: string, data: { userId: string; role?: string }): Promise<{ code: number; message: string; data: any }> => {
    return request.post(`/tenants/${id}/members`, data)
  },

  // 移除租户成员
  removeMember: (id: string, memberId: string): Promise<{ code: number; message: string }> => {
    return request.delete(`/tenants/${id}/members/${memberId}`)
  }
}

// 导出默认对象
export default tenantApi
