import request from '@/utils/request'

export interface Product {
  id: string
  name: string
  code?: string
  category?: string
  specification?: string
  unit?: string
  auxiliaryUnits?: Array<{
    unit: string
    conversionRate: number
    purpose: 'sales' | 'purchase' | 'internal' | 'external'
    description?: string
  }>
  price?: number
  costPrice?: number
  status: 'active' | 'inactive'
  mainImage?: string
  detailImages?: string[]
  description?: string
  tenantId?: string
  createdAt: string
  updatedAt: string
  // 动态分类字段（根据租户配置的分类字段动态添加）
  [key: string]: any
}

export interface CreateProductDto {
  name: string
  code?: string
  category?: string
  specification?: string
  unit?: string
  auxiliaryUnits?: Array<{
    unit: string
    conversionRate: number
    purpose: 'sales' | 'purchase' | 'internal' | 'external'
    description?: string
  }>
  price?: number
  costPrice?: number
  status?: 'active' | 'inactive'
  mainImage?: string
  detailImages?: string[]
  description?: string
}

export interface UpdateProductDto {
  name?: string
  code?: string
  category?: string
  specification?: string
  unit?: string
  auxiliaryUnits?: Array<{
    unit: string
    conversionRate: number
    purpose: 'sales' | 'purchase' | 'internal' | 'external'
    description?: string
  }>
  price?: number
  costPrice?: number
  status?: 'active' | 'inactive'
  mainImage?: string
  detailImages?: string[]
  description?: string
}

export interface QueryProductDto {
  search?: string
  category?: string
  status?: 'active' | 'inactive'
  page?: number
  limit?: number
}

export interface ProductListResponse {
  products: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 产品管理API
export const productApi = {
  getList: (
    params?: QueryProductDto,
  ): Promise<{ code: number; message: string; data: ProductListResponse }> => {
    return request.get('/products', { params })
  },

  getDetail: (id: string): Promise<{ code: number; message: string; data: Product }> => {
    return request.get(`/products/${id}`)
  },

  create: (data: CreateProductDto): Promise<{ code: number; message: string; data: Product }> => {
    return request.post('/products', data)
  },

  update: (
    id: string,
    data: UpdateProductDto,
  ): Promise<{ code: number; message: string; data: Product }> => {
    return request.patch(`/products/${id}`, data)
  },

  delete: (id: string): Promise<{ code: number; message: string }> => {
    return request.delete(`/products/${id}`)
  },

  deleteBatch: (ids: string[]): Promise<{ code: number; message: string }> => {
    return request.delete('/products/batch', { data: { ids } })
  },
}

export default productApi

