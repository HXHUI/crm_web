import request from '@/utils/request'

// 角色接口类型定义
export interface Role {
  id: string
  name: string
  description?: string
  isActive: boolean
  tenantId: string
  createdAt: string
  updatedAt: string
}

export interface CreateRoleDto {
  name: string
  description?: string
  isActive?: boolean
}

export interface UpdateRoleDto {
  name?: string
  description?: string
  isActive?: boolean
}

export interface QueryRoleDto {
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export interface RoleListResponse {
  roles: Role[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface RoleOption {
  id: string
  name: string
}

// 角色管理API
export const roleApi = {
  // 创建角色
  create: (data: CreateRoleDto): Promise<{ code: number; message: string; data: Role }> => {
    return request.post('/roles', data)
  },

  // 获取角色列表
  getList: (params?: QueryRoleDto): Promise<{ code: number; message: string; data: RoleListResponse }> => {
    return request.get('/roles', { params })
  },

  // 获取角色选项
  getOptions: (): Promise<{ code: number; message: string; data: RoleOption[] }> => {
    return request.get('/roles/options')
  },

  // 获取角色详情
  getDetail: (id: string): Promise<{ code: number; message: string; data: Role }> => {
    return request.get(`/roles/${id}`)
  },

  // 更新角色
  update: (id: string, data: UpdateRoleDto): Promise<{ code: number; message: string; data: Role }> => {
    return request.patch(`/roles/${id}`, data)
  },

  // 更新角色状态
  updateStatus: (id: string, isActive: boolean): Promise<{ code: number; message: string; data: Role }> => {
    return request.patch(`/roles/${id}/status`, { isActive })
  },

  // 删除角色
  delete: (id: string): Promise<{ code: number; message: string }> => {
    return request.delete(`/roles/${id}`)
  },

  // 批量删除角色
  deleteBatch: (ids: string[]): Promise<{ code: number; message: string }> => {
    return request.delete('/roles/batch', { data: { ids } })
  }
}

// 导出默认对象
export default roleApi
