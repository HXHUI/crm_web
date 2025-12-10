import request from '@/utils/request'

export interface DictType {
  id: number
  tenantId?: number | null
  code: string
  name: string
  description?: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface DictItem {
  id: number
  tenantId?: number | null
  typeCode: string
  value: string
  label: string
  parentId?: number | null
  sortOrder: number
  status: string
  createdAt: string
  updatedAt: string
}

export interface DictItemTreeNode extends DictItem {
  children?: DictItemTreeNode[]
}

export interface DictTypeListResult {
  items: DictType[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface DictTypeQuery {
  search?: string
  page?: number
  limit?: number
}

export interface CreateDictTypeDto {
  code: string
  name: string
  description?: string
  status?: 'active' | 'inactive'
}

export type UpdateDictTypeDto = Partial<CreateDictTypeDto>

export interface CreateDictItemDto {
  typeCode: string
  value: string
  label: string
  parentId?: number
  sortOrder?: number
  status?: 'active' | 'inactive'
}

export type UpdateDictItemDto = Partial<CreateDictItemDto>

export const dictionaryApi = {
  // 字典类型
  getTypes: (params?: DictTypeQuery): Promise<{ code: number; message: string; data: DictTypeListResult }> => {
    return request.get('/dictionaries/types', { params })
  },

  createType: (data: CreateDictTypeDto): Promise<{ code: number; message: string; data: DictType }> => {
    return request.post('/dictionaries/types', data)
  },

  updateType: (id: number | string, data: UpdateDictTypeDto): Promise<{ code: number; message: string; data: DictType }> => {
    return request.put(`/dictionaries/types/${id}`, data)
  },

  deleteType: (id: number | string): Promise<{ code: number; message: string }> => {
    return request.delete(`/dictionaries/types/${id}`)
  },

  // 字典项
  getItems: (typeCode: string): Promise<{ code: number; message: string; data: DictItem[] }> => {
    return request.get('/dictionaries/items', { params: { typeCode } })
  },

  getItemsTree: (typeCode: string): Promise<{ code: number; message: string; data: DictItemTreeNode[] }> => {
    return request.get('/dictionaries/items/tree', { params: { typeCode } })
  },

  createItem: (data: CreateDictItemDto): Promise<{ code: number; message: string; data: DictItem }> => {
    return request.post('/dictionaries/items', data)
  },

  updateItem: (id: number | string, data: UpdateDictItemDto): Promise<{ code: number; message: string; data: DictItem }> => {
    return request.put(`/dictionaries/items/${id}`, data)
  },

  deleteItem: (id: number | string): Promise<{ code: number; message: string }> => {
    return request.delete(`/dictionaries/items/${id}`)
  },
}

export default dictionaryApi


