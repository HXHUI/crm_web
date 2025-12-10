import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/modules/auth'

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 从 auth store 获取当前部门ID并添加到请求头
    try {
      const authStore = useAuthStore()
      if (authStore.currentDepartmentId && config.headers) {
        config.headers['X-Current-Department-Id'] = authStore.currentDepartmentId.toString()
      }
    } catch (error) {
      // 如果获取失败，忽略（可能是在 store 初始化之前）
      console.warn('获取当前部门ID失败:', error)
    }

    // 如果是FormData，删除Content-Type，让浏览器自动设置
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data, status } = response

    // 204 No Content 状态码表示成功，但没有响应体
    if (status === 204) {
      return { code: 204, message: '操作成功' }
    }

    // 根据RESTful规范，2xx状态码都表示成功
    // 如果响应有 data.code，使用它；否则使用 HTTP 状态码
    const code = data?.code ?? status
    if (code >= 200 && code < 300) {
      return data || { code, message: '操作成功' }
    } else {
      // 否则的话抛出错误
      ElMessage.error(data?.message || '请求失败')
      return Promise.reject(new Error(data?.message || '请求失败'))
    }
  },
  (error) => {
    console.error('响应错误:', error)

    if (error.response) {
      const { status, data } = error.response

      // 2xx状态码表示成功，不应该进入错误处理
      if (status >= 200 && status < 300) {
        return error.response
      }

      switch (status) {
        case 400:
          // 400错误时，优先显示data.message，如果没有则显示data.error，最后才显示默认消息
          ElMessage.error(data.message || data.error || '请求参数错误')
          break
        case 401:
          ElMessage.error('未授权，请重新登录')
          // 清除 token 并跳转到登录页
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error('拒绝访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 409:
          ElMessage.error(data.message || '数据冲突')
          break
        case 422:
          ElMessage.error(data.message || '数据验证失败')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        case 502:
          ElMessage.error('网关错误')
          break
        case 503:
          ElMessage.error('服务不可用')
          break
        case 504:
          ElMessage.error('网关超时')
          break
        default:
          ElMessage.error(data.message || `请求失败 (${status})`)
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }

    return Promise.reject(error)
  }
)

export default service
