import request from '@/utils/request'

// 联系人接口类型定义
export interface Contact {
  id: string
  name: string
  position?: string
  department?: string
  email?: string
  phone?: string
  telephone?: string
  type: 'primary' | 'secondary' | 'decision_maker' | 'influencer' | 'user'
  isPrimary: boolean
  notes?: string
  otherContacts?: Record<string, string>
  customerId: string
  parentId?: string
  parent?: Contact
  children?: Contact[]
  customer?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface CreateContactDto {
  name: string
  position?: string
  department?: string
  email?: string
  phone?: string
  telephone?: string
  type?: 'primary' | 'secondary' | 'decision_maker' | 'influencer' | 'user'
  isPrimary?: boolean
  notes?: string
  otherContacts?: Record<string, string>
  customerId: string
  parentId?: number
}

export interface UpdateContactDto {
  name?: string
  position?: string
  department?: string
  email?: string
  phone?: string
  telephone?: string
  type?: 'primary' | 'secondary' | 'decision_maker' | 'influencer' | 'user'
  isPrimary?: boolean
  notes?: string
  otherContacts?: Record<string, string>
  parentId?: number
}

export interface QueryContactDto {
  search?: string
  name?: string
  email?: string
  phone?: string
  type?: 'primary' | 'secondary' | 'decision_maker' | 'influencer' | 'user'
  customerId?: string
  page?: number
  limit?: number
}

export interface ContactListResponse {
  contacts: Contact[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ContactStats {
  total: number
  typeStats: Array<{
    type: string
    count: number
  }>
  primaryCount: number
}

// 联系人API
export const contactApi = {
  // 创建联系人
  create: (data: CreateContactDto) => 
    request.post<{ code: number; message: string; data: Contact }>('/contacts', data),

  // 获取联系人列表
  getList: (params?: QueryContactDto) => 
    request.get<{ code: number; message: string; data: ContactListResponse }>('/contacts', { params }),

  // 获取联系人详情
  getById: (id: string) => 
    request.get<{ code: number; message: string; data: Contact }>(`/contacts/${id}`),

  // 更新联系人
  update: (id: string, data: UpdateContactDto) => 
    request.patch<{ code: number; message: string; data: Contact }>(`/contacts/${id}`, data),

  // 删除联系人
  delete: (id: string) => 
    request.delete<{ code: number; message: string }>(`/contacts/${id}`),

  // 批量删除联系人
  deleteBatch: (ids: string[]) => 
    request.delete<{ code: number; message: string }>('/contacts/batch', { data: { ids } }),

  // 获取联系人统计
  getStats: () => 
    request.get<{ code: number; message: string; data: ContactStats }>('/contacts/stats'),

  // 获取客户的所有联系人
  getContactsByCustomer: (customerId: string | number) => 
    request.get<{ code: number; message: string; data: Contact[] }>(`/contacts/customer/${customerId}`),
}

export default contactApi
