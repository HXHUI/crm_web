export interface RegionOption {
  label: string
  value: string
  children?: RegionOption[]
}

// 精简示例数据（可按需扩展）
export const REGION_OPTIONS: RegionOption[] = [
  {
    label: '北京市', value: '北京市', children: [
      { label: '北京市', value: '北京市', children: [
        { label: '朝阳区', value: '朝阳区' },
        { label: '海淀区', value: '海淀区' },
        { label: '东城区', value: '东城区' },
        { label: '西城区', value: '西城区' },
      ] }
    ]
  },
  {
    label: '上海市', value: '上海市', children: [
      { label: '上海市', value: '上海市', children: [
        { label: '浦东新区', value: '浦东新区' },
        { label: '黄浦区', value: '黄浦区' },
        { label: '徐汇区', value: '徐汇区' },
      ] }
    ]
  },
  {
    label: '广东省', value: '广东省', children: [
      { label: '广州市', value: '广州市', children: [
        { label: '天河区', value: '天河区' },
        { label: '越秀区', value: '越秀区' },
      ] },
      { label: '深圳市', value: '深圳市', children: [
        { label: '南山区', value: '南山区' },
        { label: '福田区', value: '福田区' },
        { label: '龙岗区', value: '龙岗区' },
      ] }
    ]
  }
]
