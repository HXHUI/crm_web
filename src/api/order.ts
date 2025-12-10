import request from '@/utils/request'

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  product?: {
    id: string
    name: string
    code?: string
    unit?: string
    auxiliaryUnits?: Array<{
      unit: string
      conversionRate: number
      purpose: 'sales' | 'purchase' | 'internal' | 'external'
      description?: string
    }>
  }
  quantity: number
  packagingUnit?: string  // 包装单位（显示用）
  packagingSpec?: string   // 包装规格说明（显示用）
  unitPrice: number
  priceComponents?: Record<string, number>  // 价格组成项（复杂模式）
  amount: number
  discount?: number
  taxRate?: number  // 税率(%)
  unitPriceExclTax?: number  // 不含税单价
  taxAmount?: number  // 税金
  amountExclTax?: number  // 不含税金额
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  customer?: {
    id: string
    name: string
  }
  contractId?: string
  contract?: {
    id: string
    contractNumber: string
  }
  opportunityId?: string
  opportunity?: {
    id: string
    name: string
  }
  orderDate: string
  deliveryDate?: string
  totalAmount: number
  totalAmountExclTax?: number  // 不含税总金额
  totalTaxAmount?: number  // 总税金
  status: 'draft' | 'pending_approval' | 'approved' | 'active' | 'rejected' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled'
  notes?: string
  ownerId?: string
  owner?: {
    id: string
    username: string
  }
  items?: OrderItem[]
  tenantId?: string
  createdBy?: string
  creator?: {
    id: string
    username?: string
    nickname?: string
    user?: {
      id: string
      username: string
    }
  }
  createdAt: string
  updatedAt: string
}

export interface CreateOrderItemDto {
  productId: number
  quantity: number
  packagingUnit?: string  // 包装单位（显示用）
  packagingSpec?: string   // 包装规格说明（显示用）
  unitPrice: number
  priceComponents?: Record<string, number>  // 价格组成项（复杂模式）
  discount?: number
  taxRate?: number  // 税率(%)
  unitPriceExclTax?: number  // 不含税单价
  taxAmount?: number  // 税金
  amountExclTax?: number  // 不含税金额
  notes?: string
}

export interface CreateOrderDto {
  orderNumber?: string  // 可选，如果不提供则后端自动生成
  customerId: number
  contractId?: number
  opportunityId?: number
  orderDate: string
  deliveryDate?: string
  status?: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled'
  notes?: string
  items: CreateOrderItemDto[]
}

export interface UpdateOrderDto {
  orderNumber?: string
  customerId?: number
  contractId?: number
  opportunityId?: number
  orderDate?: string
  deliveryDate?: string
  status?: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled'
  notes?: string
  items?: CreateOrderItemDto[]
}

export interface QueryOrderDto {
  search?: string
  customerId?: number
  opportunityId?: number
  status?: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled'
  page?: number
  limit?: number
}

export interface OrderListResponse {
  orders: Order[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 订单管理API
export const orderApi = {
  getList: (
    params?: QueryOrderDto,
  ): Promise<{ code: number; message: string; data: OrderListResponse }> => {
    return request.get('/orders', { params })
  },

  getDetail: (id: string): Promise<{ code: number; message: string; data: Order }> => {
    return request.get(`/orders/${id}`)
  },

  create: (data: CreateOrderDto): Promise<{ code: number; message: string; data: Order }> => {
    return request.post('/orders', data)
  },

  createFromContract: (contractId: string): Promise<{ code: number; message: string; data: Order }> => {
    return request.post(`/orders/from-contract/${contractId}`)
  },

  update: (
    id: string,
    data: UpdateOrderDto,
  ): Promise<{ code: number; message: string; data: Order }> => {
    return request.patch(`/orders/${id}`, data)
  },

  delete: (id: string): Promise<{ code: number; message: string }> => {
    return request.delete(`/orders/${id}`)
  },
}

export default orderApi

