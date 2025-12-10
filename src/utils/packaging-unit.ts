/**
 * 包装单位转换工具函数
 * 用于处理产品的主单位和辅助单位之间的转换
 */

export interface AuxiliaryUnit {
  unit: string
  conversionRate: number
  purpose: 'sales' | 'purchase' | 'internal' | 'external'
  description?: string
}

export interface ProductInfo {
  unit?: string
  auxiliaryUnits?: AuxiliaryUnit[]
}

export interface ItemWithPackaging {
  quantity: number
  packagingUnit?: string
  packagingSpec?: string
  unitPrice: number
  _product?: ProductInfo
}

/**
 * 获取可用的辅助单位列表（根据用途过滤）
 * @param product 产品信息
 * @param purpose 用途：'sales' | 'purchase' | 'internal' | 'external'
 * @returns 可用的辅助单位列表
 */
export function getAvailableAuxiliaryUnits(
  product: ProductInfo | undefined,
  purpose: 'sales' | 'purchase' | 'internal' | 'external' = 'sales'
): AuxiliaryUnit[] {
  if (!product?.auxiliaryUnits) return []
  return product.auxiliaryUnits.filter(aux => aux.purpose === purpose)
}

/**
 * 获取转换率（根据包装单位）
 * @param item 明细项
 * @returns 转换率（1个包装单位 = conversionRate个主单位）
 */
export function getConversionRate(item: ItemWithPackaging): number {
  if (!item.packagingUnit || !item._product) return 1
  if (item.packagingUnit === item._product.unit) return 1
  const auxUnit = item._product.auxiliaryUnits?.find(aux => aux.unit === item.packagingUnit)
  return auxUnit?.conversionRate || 1
}

/**
 * 获取显示用的数量（根据包装单位转换）
 * @param item 明细项
 * @returns 显示用的数量（包装单位）
 */
export function getDisplayQuantity(item: ItemWithPackaging): number {
  if (!item) return 0
  const conversionRate = getConversionRate(item)
  return Math.round((item.quantity / conversionRate) * 100) / 100
}

/**
 * 处理数量输入（转换为主单位存储）
 * @param item 明细项
 * @param displayValue 用户输入的数量（包装单位）
 * @returns 主单位数量
 */
export function convertQuantityToMainUnit(item: ItemWithPackaging, displayValue: number): number {
  const conversionRate = getConversionRate(item)
  return Math.round((displayValue * conversionRate) * 100) / 100
}

/**
 * 获取显示用的单价（根据包装单位转换）
 * @param item 明细项
 * @returns 显示用的单价（包装单位）
 */
export function getDisplayUnitPrice(item: ItemWithPackaging): number {
  if (!item) return 0
  const conversionRate = getConversionRate(item)
  return Math.round((item.unitPrice * conversionRate) * 100) / 100
}

/**
 * 处理单价输入（转换为主单位存储）
 * @param item 明细项
 * @param displayValue 用户输入的单价（包装单位）
 * @returns 主单位单价
 */
export function convertUnitPriceToMainUnit(item: ItemWithPackaging, displayValue: number): number {
  const conversionRate = getConversionRate(item)
  return Math.round((displayValue / conversionRate) * 100) / 100
}

/**
 * 处理包装单位变化
 * @param item 明细项
 * @param unit 新的包装单位
 * @returns 更新后的包装规格说明
 */
export function handlePackagingUnitChange(item: ItemWithPackaging, unit: string): string {
  if (!item._product) return ''
  
  // 更新包装规格说明
  if (unit === item._product.unit) {
    return ''
  } else {
    const auxUnit = item._product.auxiliaryUnits?.find(aux => aux.unit === unit)
    if (auxUnit) {
      return auxUnit.description || `${auxUnit.conversionRate}${item._product.unit}`
    }
  }
  return ''
}

