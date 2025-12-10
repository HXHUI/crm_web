import request from '@/utils/request'

// 工商信息主表
export interface BusinessInfo {
  id: number
  customerId?: number
  unifiedSocialCreditCode?: string
  companyName?: string
  legalRepresentative?: string
  operatingStatus?: string
  registeredCapital?: number
  paidInCapital?: number
  businessRegistrationNumber?: string
  organizationCode?: string
  establishmentDate?: string
  companyType?: string
  businessTerm?: string
  registrationAuthority?: string
  approvalDate?: string
  registeredAddress?: string
  businessScope?: string
  lastSyncTime?: string
  expiresAt?: string
  personnel?: BusinessPersonnel[]
  shareholders?: BusinessShareholder[]
  branches?: BusinessBranch[]
  investments?: BusinessInvestment[]
  changeRecords?: BusinessChangeRecord[]
}

// 主要人员
export interface BusinessPersonnel {
  id: number
  businessInfoId: number
  name?: string
  position?: string
}

// 股东信息
export interface BusinessShareholder {
  id: number
  businessInfoId: number
  shareholderName?: string
  shareholdingRatio?: number
  shareholderType?: string
  investmentAmount?: number
}

// 分支机构
export interface BusinessBranch {
  id: number
  businessInfoId: number
  companyName?: string
  personInCharge?: string
  establishmentDate?: string
  operatingStatus?: string
}

// 对外投资
export interface BusinessInvestment {
  id: number
  businessInfoId: number
  investedCompany?: string
  shareholderType?: string
  shareholdingRatio?: number
  investmentAmount?: number
}

// 变更记录
export interface BusinessChangeRecord {
  id: number
  businessInfoId: number
  changeDate?: string
  changeItem?: string
  beforeChange?: string
  afterChange?: string
}

// 企业搜索结果
export interface CompanySearchResult {
  id: string
  name: string
  unifiedSocialCreditCode?: string
  legalRepresentative?: string
  registeredAddress?: string
  operatingStatus?: string
}

// API响应
export interface BusinessInfoResponse {
  data: BusinessInfo | null
  expired: boolean
  lastSyncTime?: string
  expiresAt?: string
}

// 获取工商信息
export function getBusinessInfo(customerId: number): Promise<BusinessInfoResponse> {
  return request.get(`/business-info/${customerId}`)
}

// 刷新工商信息
export function refreshBusinessInfo(customerId: number): Promise<{
  data: BusinessInfo
  lastSyncTime?: string
  expiresAt?: string
}> {
  return request.post(`/business-info/${customerId}/refresh`)
}

// 通过公司名称获取工商信息（用于线索）
export function getBusinessInfoByCompanyName(companyName: string, tenantId?: number): Promise<BusinessInfoResponse> {
  return request.get('/business-info/by-company', {
    params: { companyName, ...(tenantId ? { tenantId } : {}) },
  })
}

// 通过公司名称刷新工商信息（用于线索）
export function refreshBusinessInfoByCompanyName(companyName: string): Promise<{
  data: BusinessInfo
  lastSyncTime?: string
  expiresAt?: string
}> {
  return request.post('/business-info/by-company/refresh', {
    companyName,
  })
}

// 搜索企业（用于创建线索）
export function searchCompany(keyword: string): Promise<{
  data: CompanySearchResult[]
}> {
  return request.get('/business-info/search', {
    params: { keyword },
  })
}

export default {
  getBusinessInfo,
  refreshBusinessInfo,
  getBusinessInfoByCompanyName,
  refreshBusinessInfoByCompanyName,
  searchCompany,
}

