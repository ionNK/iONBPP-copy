import { Module } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RuleEngineService } from './rule-engine.service';

@Module({
  imports: [PrismaModule],
  controllers: [PromotionsController],
  providers: [PromotionsService, RuleEngineService],
  exports: [PromotionsService, RuleEngineService],
})
export class PromotionsModule { }
