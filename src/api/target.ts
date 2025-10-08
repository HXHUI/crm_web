import request from '@/utils/request'

const targetApi = {
  list(params: any) {
    return request.get('/targets', { params })
  },
  saveYearTargets(data: any) {
    return request.post('/targets/save-year', data)
  },
  ownerOptions(params: any) {
    return request.get('/targets/owner-options', { params })
  },
}

export default targetApi
