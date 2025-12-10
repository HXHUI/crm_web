import { Injectable, BadRequestException } from '@nestjs/common';
import type { TenantPricingConfig } from '../../modules/tenant/tenant.service';

export interface PriceItemWithComponents {
  unitPrice: number;
  priceComponents?: Record<string, number>;
}

@Injectable()
export class PricingCalculatorService {
  /**
   * 根据租户价格配置计算单价
   * - 简单模式：直接返回 unitPrice
   * - 复杂模式：根据价格组成项求和，并校验必填项
   */
  async calculateUnitPrice(
    item: PriceItemWithComponents,
    pricingConfig: TenantPricingConfig,
  ): Promise<number> {
    if (pricingConfig.pricingMode === 'simple') {
      return item.unitPrice;
    }

    // 复杂模式：从 priceComponents 计算
    if (!item.priceComponents || Object.keys(item.priceComponents).length === 0) {
      throw new BadRequestException('复杂模式下必须提供价格组成项');
    }

    // 校验必填项
    if (pricingConfig.priceComponents) {
      for (const component of pricingConfig.priceComponents) {
        if (component.required) {
          const value = item.priceComponents[component.key];
          if (value === undefined || value === null) {
            throw new BadRequestException(`价格组成项"${component.label}"为必填项`);
          }
        }
      }
    }

    // 求和得到单价
    const total = Object.values(item.priceComponents).reduce((sum, value) => {
      return sum + (Number(value) || 0);
    }, 0);

    return total;
  }
}


