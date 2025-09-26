import request from '@/utils/request'

// 客户标签接口类型定义
export interface CustomerTag {
  id: string
  name: string
  color: string
  description?: string
  tenantId: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface CreateCustomerTagDto {
  name: string
  color?: string
  description?: string
}

export interface UpdateCustomerTagDto {
  name?: string
  color?: string
  description?: string
}

export interface QueryCustomerTagDto {
  name?: string
  color?: string
  page?: number
  limit?: number
}

export interface CustomerTagListResponse {
  tags: CustomerTag[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CustomerTagStats {
  total: number
  colorStats: Array<{
    color: string
    count: number
  }>
}

// 客户标签API
export const customerTagApi = {
  // 创建标签
  create: (data: CreateCustomerTagDto) => 
    request.post<{ code: number; message: string; data: CustomerTag }>('/customer-tags', data),

  // 获取标签列表
  getList: (params?: QueryCustomerTagDto) => 
    request.get<{ code: number; message: string; data: CustomerTagListResponse }>('/customer-tags', { params }),

  // 获取标签详情
  getById: (id: string) => 
    request.get<{ code: number; message: string; data: CustomerTag }>(`/customer-tags/${id}`),

  // 更新标签
  update: (id: string, data: UpdateCustomerTagDto) => 
    request.patch<{ code: number; message: string; data: CustomerTag }>(`/customer-tags/${id}`, data),

  // 删除标签
  delete: (id: string) => 
    request.delete<{ code: number; message: string }>(`/customer-tags/${id}`),

  // 批量删除标签
  deleteBatch: (ids: string[]) => 
    request.delete<{ code: number; message: string }>('/customer-tags/batch', { data: { ids } }),

  // 获取标签统计
  getStats: () => 
    request.get<{ code: number; message: string; data: CustomerTagStats }>('/customer-tags/stats'),
}

export default customerTagApi
