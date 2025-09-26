import request from '@/utils/request'

// 部门相关接口
export interface Department {
  id: string
  name: string
  code?: string
  description?: string
  managerId?: string
  sortOrder: number
  parentId?: string
  tenantId: string
  createdAt: string
  updatedAt: string
  parent?: Department
  children?: Department[]
  members?: Member[]
  memberCount?: number
}

export interface Member {
  id: string
  userId: string
  tenantId: string
  status: string
  nickname?: string
  position?: string
  isManager: boolean
  permissions?: Record<string, any>
  createdAt: string
  updatedAt: string
  user: {
    id: string
    username: string
    email?: string
    phone?: string
    avatar?: string
    realName?: string
  }
}

export interface CreateDepartmentDto {
  name: string
  parentId?: string
  description?: string
  managerId?: string
}

export interface UpdateDepartmentDto {
  name?: string
  parentId?: string
  description?: string
  managerId?: string
}

// 获取部门树形结构
export const getDepartmentTree = (): Promise<{ code: number; message: string; data: Department[] }> => {
  return request.get('/departments/tree')
}

// 获取部门列表
export const getDepartments = (params: {
  page?: number
  limit?: number
  search?: string
}): Promise<{ code: number; message: string; data: any }> => {
  return request.get('/departments', { params })
}

// 获取部门详情
export const getDepartmentById = (id: string): Promise<{ code: number; message: string; data: Department }> => {
  return request.get(`/departments/${id}`)
}

// 创建部门
export const createDepartment = (data: CreateDepartmentDto): Promise<{ code: number; message: string; data: Department }> => {
  return request.post('/departments', data)
}

// 更新部门
export const updateDepartment = (id: string, data: UpdateDepartmentDto): Promise<{ code: number; message: string; data: Department }> => {
  return request.put(`/departments/${id}`, data)
}

// 删除部门
export const deleteDepartment = (id: string): Promise<{ code: number; message: string }> => {
  return request.delete(`/departments/${id}`)
}

// 获取部门成员
export const getDepartmentMembers = (id: string, params: {
  page?: number
  limit?: number
  search?: string
}): Promise<{ code: number; message: string; data: any }> => {
  return request.get(`/departments/${id}/members`, { params })
}

// 添加部门成员
export const addDepartmentMember = (id: string, data: {
  memberId: string
  position?: string
  isManager?: boolean
}): Promise<{ code: number; message: string; data: any }> => {
  return request.post(`/departments/${id}/members`, data)
}

// 移除部门成员
export const removeDepartmentMember = (id: string, memberId: string): Promise<{ code: number; message: string }> => {
  return request.delete(`/departments/${id}/members/${memberId}`)
}
