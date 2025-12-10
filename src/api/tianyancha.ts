import axios from 'axios'
import { ElMessage } from 'element-plus'

export interface CompanySearchResult {
  id: string
  name: string
  unifiedSocialCreditCode?: string
  legalRepresentative?: string
  registeredAddress?: string
  operatingStatus?: string
}

// 创建专门用于天眼查API的axios实例，设置更长的超时时间
const tianyanchaRequest = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 60000, // 60秒超时，因为天眼查API可能需要较长时间
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加token
tianyanchaRequest.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
tianyanchaRequest.interceptors.response.use(
  (response) => {
    const { data } = response
    if (data.code >= 200 && data.code < 300) {
      return data
    } else {
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
  },
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      ElMessage.error('请求超时，请稍后重试')
    } else if (error.response) {
      const { status, data } = error.response
      ElMessage.error(data.message || `请求失败 (${status})`)
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

export const tianyanchaApi = {
  /**
   * 搜索企业
   * @param keyword 搜索关键词（公司名称或统一社会信用代码）
   * @param signal 可选的 AbortSignal，用于取消请求
   */
  search: (
    keyword: string,
    signal?: AbortSignal
  ): Promise<{ code: number; message: string; data: CompanySearchResult[] }> => {
    return tianyanchaRequest.get('/tianyancha/search', {
      params: { keyword },
      signal, // 支持请求取消
    })
  },
}

