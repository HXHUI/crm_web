import request from '@/utils/request'

// 价格组成项配置
export interface PriceComponentConfig {
  key: string           // 字段key（如：factoryPrice）
  label: string         // 显示名称（如：出厂价）
  required: boolean     // 是否必填
  defaultValue: number  // 默认值
  order: number         // 排序
}

// 租户价格配置
export interface TenantPricingConfig {
  pricingMode: 'simple' | 'complex'
  priceComponents?: PriceComponentConfig[]
}

export interface TenantTaxConfig {
  defaultTaxRate: number
}

// 产品分类字段配置
export interface ProductCategoryFieldConfig {
  fieldKey: string           // 字段标识，如 brand、series
  fieldName: string          // 显示名称，如 品牌、系列
  level: number              // 层级顺序
  codeLength?: number        // 在编码中的长度
  required?: boolean         // 是否必填
  isCascade?: boolean        // 是否参与级联
  parentFieldKey?: string    // 上级字段标识
  participateInCode?: boolean// 是否参与编码
  dictTypeCode?: string      // 关联的字典类型编码（如果设置，则从字典获取选项）
}

// 产品分类选项配置（级联值）
export interface ProductCategoryValueConfig {
  fieldKey: string        // 字段标识
  valueId: string         // 选项ID（前端可用作级联值）
  valueName: string       // 显示名称
  valueCode: string       // 在编码中的代码
  parentValueId?: string  // 上级选项ID
}

// 产品编码规则片段类型
export type ProductCodeRuleSegmentType =
  | 'CONST' // 常量
  | 'FIELD' // 字段
  | 'DATE'  // 日期
  | 'SEQ'   // 流水号
  | 'SEP'   // 分隔符

// 产品编码规则片段
export interface ProductCodeRuleSegment {
  id?: string             // 片段ID（前端用）
  orderNo: number         // 顺序
  segmentType: ProductCodeRuleSegmentType
  segmentValue: string    // 根据类型含义不同
  length?: number         // 期望长度
  padChar?: string        // 补齐字符
  padDirection?: 'LEFT' | 'RIGHT' // 补齐方向
}

// 产品编码规则配置
export interface ProductCodeRuleConfig {
  segments: ProductCodeRuleSegment[]
}

// 产品名称规则片段类型（名称规则不需要日期和流水号）
export type ProductNameRuleSegmentType =
  | 'CONST' // 常量
  | 'FIELD' // 字段（显示名称）
  | 'SEP'   // 分隔符

// 产品名称规则片段
export interface ProductNameRuleSegment {
  id?: string             // 片段ID（前端用）
  orderNo: number         // 顺序
  segmentType: ProductNameRuleSegmentType
  segmentValue: string    // 根据类型含义不同
}

// 产品名称规则配置
export interface ProductNameRuleConfig {
  segments: ProductNameRuleSegment[]
}

// 租户产品配置整体
export interface TenantProductConfig {
  categoryFields: ProductCategoryFieldConfig[]
  categoryValues: ProductCategoryValueConfig[]
  codeRule?: ProductCodeRuleConfig
  nameRule?: ProductNameRuleConfig
}

// 租户接口类型定义
export interface Tenant {
  id: string
  name: string
  slug?: string
  description?: string
  logo?: string
  status: 'active' | 'inactive' | 'suspended'
  ownerId: string
  parentId?: string
  parentName?: string
  level?: number
  config?: Record<string, unknown>
  defaultTaxRate?: number
  createdAt: string
  updatedAt: string
  memberCount?: number
}

export interface CreateTenantDto {
  name: string
  slug?: string
  description?: string
  parentId?: string | number
  status?: 'active' | 'inactive' | 'suspended'
}

export interface UpdateTenantDto {
  name?: string
  slug?: string
  status?: 'active' | 'inactive' | 'suspended'
  description?: string
  logo?: string
  config?: Record<string, unknown>
  defaultTaxRate?: number
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
  },

  // 上传Logo
  uploadLogo: (file: File): Promise<{ code: number; message: string; data: { url: string; filename: string } }> => {
    const formData = new FormData()
    formData.append('logo', file)
    return request.post('/upload/logo', formData)
  },

  // 获取子租户列表
  getChildren: (id: string): Promise<{ code: number; message: string; data: Tenant[] }> => {
    return request.get(`/tenants/${id}/children`)
  },

  // 获取租户价格配置
  getPricingConfig: (id: string): Promise<{ code: number; message: string; data: TenantPricingConfig }> => {
    return request.get(`/tenants/${id}/pricing-config`)
  },

  // 更新租户价格配置
  updatePricingConfig: (id: string, data: TenantPricingConfig): Promise<{ code: number; message: string; data: Tenant }> => {
    return request.put(`/tenants/${id}/pricing-config`, data)
  },

  // 获取租户税务配置
  getTaxConfig: (id: string): Promise<{ code: number; message: string; data: TenantTaxConfig }> => {
    return request.get(`/tenants/${id}/tax-config`)
  },

  // 更新租户税务配置
  updateTaxConfig: (id: string, data: TenantTaxConfig): Promise<{ code: number; message: string; data: TenantTaxConfig }> => {
    return request.put(`/tenants/${id}/tax-config`, data)
  },

  // 获取租户产品配置
  getProductConfig: (id: string): Promise<{ code: number; message: string; data: TenantProductConfig }> => {
    return request.get(`/tenants/${id}/product-config`)
  },

  // 更新租户产品配置
  updateProductConfig: (id: string, data: TenantProductConfig): Promise<{ code: number; message: string; data: Tenant }> => {
    return request.put(`/tenants/${id}/product-config`, data)
  },

  // 预览产品编码
  previewProductCode: (
    id: string,
    data: { fieldCodes?: Record<string, string>; date?: Date | string }
  ): Promise<{ code: number; message: string; data: { code: string } }> => {
    return request.post(`/tenants/${id}/product-code/preview`, data)
  }
}

// 导出默认对象
export default tenantApi

// 获取租户成员（用于 store）
export const getTenantMembers = async (page = 1, pageSize = 50): Promise<{ items: any[]; total: number }> => {
  // 优先使用 /tenants/members 端点（获取当前租户成员）
  try {
    const response = await request.get('/tenants/members', {
      params: { page, limit: pageSize }
    })
    if (response.code === 200 && response.data) {
      return {
        items: response.data.members || response.data.items || [],
        total: response.data.total || 0
      }
    }
  } catch (error) {
    console.warn('使用 /tenants/members 失败，尝试备用方案:', error)
  }
  
  // 备用方案：使用 /members 端点
  try {
    const response = await request.get('/members', {
      params: { page, limit: pageSize }
    })
    return {
      items: response.data?.items || response.data?.members || response.data || [],
      total: response.data?.total || 0
    }
  } catch (error) {
    console.error('获取成员列表失败:', error)
    return {
      items: [],
      total: 0
    }
  }
}

// 获取租户部门（用于 store）
export const getTenantDepartments = async (): Promise<any[]> => {
  const response = await request.get('/departments/tree')
  return response.data || []
}

// 获取租户角色（用于 store）
export const getTenantRoles = async (): Promise<any[]> => {
  const response = await request.get('/roles', {
    params: { isActive: true }
  })
  return response.data?.roles || response.data || []
}
