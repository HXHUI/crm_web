import request from '@/utils/request'

// 成员接口类型定义
export interface Member {
  id: string | number
  userId: string | number
  tenantId: string | number
  status: 'active' | 'inactive' | 'suspended'
  position?: string
  isManager: boolean
  createdAt: string
  updatedAt: string
  user: {
    id: string | number
    username: string
    email?: string
    phone?: string
    avatar?: string
    realName?: string
    status: 'active' | 'inactive' | 'suspended'
    createdAt: string
  }
  departments?: Array<{
    id: string | number
    name: string
  }>
  memberRoles?: Array<{
    id: string | number
    role: {
      id: string | number
      name: string
    }
  }>
  createdBy?: {
    id: string | number
    username: string
  }
}

export interface MemberListResponse {
  members: Member[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface QueryMemberDto {
  page?: number
  limit?: number
  search?: string
  status?: 'active' | 'inactive' | 'suspended'
}

// 成员管理API
export const memberApi = {
  // 获取成员列表（当前租户）
  getList: (params?: QueryMemberDto): Promise<{ code: number; message: string; data: MemberListResponse }> => {
    return request.get('/tenants/members', { params })
  },

  // 更新成员状态
  updateStatus: (id: string | number, status: 'active' | 'inactive' | 'suspended'): Promise<{ code: number; message: string; data: Member }> => {
    return request.patch(`/users/${id}/status`, { status })
  },

  // 删除成员（通过删除用户）
  delete: (id: string | number): Promise<{ code: number; message: string }> => {
    return request.delete(`/users/${id}`)
  },
}

export default memberApi

