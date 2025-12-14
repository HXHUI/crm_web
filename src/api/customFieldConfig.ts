import request from '@/utils/request'

export type CustomFieldType = 'text' | 'number' | 'date' | 'datetime' | 'select' | 'multiselect' | 'textarea' | 'boolean' | 'file'
export type EntityType = 'customer' | 'contact' | 'opportunity'

export interface FieldOptions {
  sourceType?: 'manual' | 'dict'
  options?: Array<{ label: string; value: string }>
  dictTypeCode?: string
}

export interface ValidationRules {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  message?: string
}

export interface CustomFieldConfig {
  id: number
  tenantId: number
  entityType: EntityType
  fieldCode: string
  fieldName: string
  fieldType: CustomFieldType
  fieldOptions?: FieldOptions
  isRequired: boolean
  defaultValue?: string
  placeholder?: string
  helpText?: string
  validationRules?: ValidationRules
  displayOrder: number
  isActive: boolean
  groupName?: string
  createdBy?: number
  createdAt: string
  updatedAt: string
}

export interface CreateCustomFieldConfigDto {
  entityType: EntityType
  fieldCode: string
  fieldName: string
  fieldType: CustomFieldType
  fieldOptions?: FieldOptions
  isRequired?: boolean
  defaultValue?: string
  placeholder?: string
  helpText?: string
  validationRules?: ValidationRules
  displayOrder?: number
  isActive?: boolean
  groupName?: string
}

export interface UpdateCustomFieldConfigDto extends Partial<CreateCustomFieldConfigDto> {}

export interface QueryCustomFieldConfigDto {
  entityType?: EntityType
  groupName?: string
  page?: number
  pageSize?: number
  keyword?: string
}

export interface CustomFieldConfigListResponse {
  items: CustomFieldConfig[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 获取字段配置列表
 */
export function getCustomFieldConfigs(params?: QueryCustomFieldConfigDto) {
  return request<CustomFieldConfigListResponse>({
    url: '/custom-field-configs',
    method: 'get',
    params,
  })
}

/**
 * 获取单个字段配置
 */
export function getCustomFieldConfig(id: number) {
  return request<CustomFieldConfig>({
    url: `/custom-field-configs/${id}`,
    method: 'get',
  })
}

/**
 * 根据实体类型获取字段配置
 */
export function getCustomFieldConfigsByEntityType(entityType: EntityType) {
  return request<CustomFieldConfig[]>({
    url: `/custom-field-configs/entity/${entityType}`,
    method: 'get',
  })
}

/**
 * 创建字段配置
 */
export function createCustomFieldConfig(data: CreateCustomFieldConfigDto) {
  return request<CustomFieldConfig>({
    url: '/custom-field-configs',
    method: 'post',
    data,
  })
}

/**
 * 更新字段配置
 */
export function updateCustomFieldConfig(id: number, data: UpdateCustomFieldConfigDto) {
  return request<CustomFieldConfig>({
    url: `/custom-field-configs/${id}`,
    method: 'patch',
    data,
  })
}

/**
 * 删除字段配置
 */
export function deleteCustomFieldConfig(id: number) {
  return request({
    url: `/custom-field-configs/${id}`,
    method: 'delete',
  })
}

