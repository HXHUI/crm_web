import request from '@/utils/request'

export const commonApi = {
  industries: () => request.get<{ code: number; message: string; data: { key: string; label: string }[] }>(`/common/industries`),
  sources: () => request.get<{ code: number; message: string; data: { key: string; label: string }[] }>(`/common/sources`),
  regions: () => request.get<{ code: number; message: string; data: any[] }>(`/common/regions`),
  unqualifiedReasons: () => request.get<{ code: number; message: string; data: { key: string; label: string }[] }>(`/common/unqualified-reasons`),
  lostTypes: () => request.get<{ code: number; message: string; data: { key: string; label: string }[] }>(`/common/lost-types`),
}

export default commonApi
