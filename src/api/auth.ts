import request from '@/utils/request'
import type { LoginRequest, RegisterRequest, LoginResponse, ApiResponse, User, Member, Tenant } from '@/types'

// 登录
export const login = (data: LoginRequest): Promise<LoginResponse> => {
  return request.post('/auth/login', data)
}

// 注册
export const register = (data: RegisterRequest): Promise<LoginResponse> => {
  return request.post('/auth/register', data)
}

// 登出
export const logout = (): Promise<ApiResponse> => {
  return request.post('/auth/logout')
}

// 获取当前用户信息
export const getCurrentUser = (): Promise<{ user: User; member: Member; tenant: Tenant }> => {
  return request.get('/auth/me')
}

// 刷新 token
export const refreshToken = (): Promise<ApiResponse<{ token: string }>> => {
  return request.post('/auth/refresh')
}

// 检查手机号码是否已存在
export const checkPhoneExists = (phone: string): Promise<ApiResponse<{ exists: boolean }>> => {
  return request.get('/auth/check-phone', {
    params: { phone }
  })
}
