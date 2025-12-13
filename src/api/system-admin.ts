import request from '@/utils/request'

export interface SystemAdmin {
  id: string
  username: string
  email?: string
  phone: string
  avatar?: string
  status: 'active' | 'inactive' | 'suspended'
  isSystemAdmin: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSystemAdminDto {
  username: string
  email?: string
  phone: string
  password: string
}

export interface QuerySystemAdminDto {
  search?: string
  page?: number
  limit?: number
}

export interface SystemAdminListResponse {
  users: SystemAdmin[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const systemAdminApi = {
  // 获取系统管理员列表
  getList: (params?: QuerySystemAdminDto): Promise<{ code: number; message: string; data: SystemAdminListResponse }> => {
    return request.get('/system-admins', { params })
  },

  // 创建系统管理员
  create: (data: CreateSystemAdminDto): Promise<{ code: number; message: string; data: SystemAdmin }> => {
    return request.post('/system-admins', data)
  },

  // 移除系统管理员权限
  remove: (id: string): Promise<{ code: number; message: string }> => {
    return request.delete(`/system-admins/${id}`)
  },

  // 恢复系统管理员权限
  restore: (id: string): Promise<{ code: number; message: string; data: SystemAdmin }> => {
    return request.post(`/system-admins/${id}/restore`)
  },
}

export default systemAdminApi

