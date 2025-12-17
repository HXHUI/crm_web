import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerCompetitor, RelatedType } from '../../entities/customer-competitor.entity';

export interface CreateCompetitorDto {
  relatedType: RelatedType;
  relatedId: number;
  manufacturer: string;
  productName?: string | null;
  annualUsageAmount?: number | null;
  unit?: string | null;
  unitPrice?: number | null;
  policy?: string | null;
  advantages?: string | null;
  problems?: string | null;
}

export interface UpdateCompetitorDto extends Partial<CreateCompetitorDto> {}

@Injectable()
export class CustomerCompetitorsService {
  constructor(
    @InjectRepository(CustomerCompetitor)
    private readonly competitorRepo: Repository<CustomerCompetitor>,
  ) {}

  async create(dto: CreateCompetitorDto, tenantId?: number | null) {
    const entity = this.competitorRepo.create({
      ...dto,
      tenantId,
    });
    return this.competitorRepo.save(entity);
  }

  async findAll(params: {
    tenantId?: number | null;
    relatedType?: RelatedType;
    relatedId?: number;
  }) {
    const query = this.competitorRepo.createQueryBuilder('competitor');

    if (params.tenantId !== undefined) {
      query.andWhere('competitor.tenantId = :tenantId', { tenantId: params.tenantId });
    }
    if (params.relatedType) {
      query.andWhere('competitor.relatedType = :relatedType', { relatedType: params.relatedType });
    }
    if (params.relatedId) {
      query.andWhere('competitor.relatedId = :relatedId', { relatedId: params.relatedId });
    }

    query.orderBy('competitor.createdAt', 'DESC');
    return query.getMany();
  }

  async findOne(id: number, tenantId?: number | null) {
    const where: any = { id };
    if (tenantId !== undefined) {
      where.tenantId = tenantId;
    }
    const entity = await this.competitorRepo.findOne({ where });
    if (!entity) {
      throw new NotFoundException('竞品不存在');
    }
    return entity;
  }

  async update(id: number, dto: UpdateCompetitorDto, tenantId?: number | null) {
    const entity = await this.findOne(id, tenantId);
    Object.assign(entity, dto);
    return this.competitorRepo.save(entity);
  }

  async remove(id: number, tenantId?: number | null) {
    const entity = await this.findOne(id, tenantId);
    await this.competitorRepo.softRemove(entity);
    return { affected: 1 };
  }
}

