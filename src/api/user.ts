import request from '@/utils/request'

// 用户接口类型定义
export interface User {
  id: string
  username: string
  email?: string
  phone: string
  avatar?: string
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
  updatedAt: string
  member?: {
    id: string
    tenantId: string
    departmentId?: string
    isManager: boolean
  }
}

export interface CreateUserDto {
  username: string
  email?: string
  phone: string
  password?: string
  avatar?: string
  tenantId: string
  departmentId?: string
  roleIds?: string[]
}

export interface UpdateUserDto {
  username?: string
  email?: string
  phone?: string
  avatar?: string
}

export interface UpdateUserProfileDto {
  avatar?: string
  username?: string
  phone?: string
  email?: string
}

export interface QueryUserDto {
  search?: string
  page?: number
  limit?: number
}

export interface UserListResponse {
  users: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 用户管理API
export const userApi = {
  // 创建用户
  create: (data: CreateUserDto): Promise<{ code: number; message: string; data: User }> => {
    return request.post('/users', data)
  },

  // 获取用户列表
  getList: (params?: QueryUserDto): Promise<{ code: number; message: string; data: UserListResponse }> => {
    return request.get('/users', { params })
  },

  // 获取用户详情
  getDetail: (id: string): Promise<{ code: number; message: string; data: User }> => {
    return request.get(`/users/${id}`)
  },

  // 更新用户
  update: (id: string, data: UpdateUserDto): Promise<{ code: number; message: string; data: User }> => {
    return request.put(`/users/${id}`, data)
  },

  // 更新用户个人资料
  updateProfile: (id: string, data: UpdateUserProfileDto): Promise<{ code: number; message: string; data: User }> => {
    return request.patch(`/users/${id}/profile`, data)
  },

  // 更新用户状态
  updateStatus: (id: string, status: 'active' | 'inactive' | 'suspended'): Promise<{ code: number; message: string; data: User }> => {
    return request.patch(`/users/${id}/status`, { status })
  },

  // 获取用户成员记录
  getMembers: (id: string): Promise<{ code: number; message: string; data: any }> => {
    return request.get(`/users/${id}/members`)
  },

  // 上传头像
  uploadAvatar: (file: File): Promise<{ code: number; message: string; data: { url: string; filename: string } }> => {
    const formData = new FormData()
    formData.append('avatar', file)
    return request.post('/upload/avatar', formData)
  }
}

export default userApi
