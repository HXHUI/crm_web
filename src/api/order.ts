import request from '@/utils/request'

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  product?: {
    id: string
    name: string
    code?: string
  }
  quantity: number
  unitPrice: number
  amount: number
  discount?: number
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
  quoteId?: string
  quote?: {
    id: string
    quoteNumber: string
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
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled'
  notes?: string
  ownerId?: string
  owner?: {
    id: string
    username: string
  }
  items?: OrderItem[]
  tenantId?: string
  createdAt: string
  updatedAt: string
}

export interface CreateOrderItemDto {
  productId: number
  quantity: number
  unitPrice: number
  discount?: number
  notes?: string
}

export interface CreateOrderDto {
  orderNumber: string
  customerId: number
  quoteId?: number
  opportunityId?: number
  orderDate: string
  deliveryDate?: string
  status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled'
  notes?: string
  items: CreateOrderItemDto[]
}

export interface UpdateOrderDto {
  orderNumber?: string
  customerId?: number
  quoteId?: number
  opportunityId?: number
  orderDate?: string
  deliveryDate?: string
  status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled'
  notes?: string
  items?: CreateOrderItemDto[]
}

export interface QueryOrderDto {
  search?: string
  customerId?: number
  quoteId?: number
  opportunityId?: number
  status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled'
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

  createFromQuote: (quoteId: string): Promise<{ code: number; message: string; data: Order }> => {
    return request.post(`/orders/from-quote/${quoteId}`)
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

