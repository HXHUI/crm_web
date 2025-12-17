import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerCompetitor } from '../../entities/customer-competitor.entity';
import { CustomerCompetitorsService } from './customer-competitors.service';
import { CustomerCompetitorsController } from './customer-competitors.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerCompetitor])],
  controllers: [CustomerCompetitorsController],
  providers: [CustomerCompetitorsService],
  exports: [CustomerCompetitorsService],
})
export class CustomerCompetitorsModule {}

