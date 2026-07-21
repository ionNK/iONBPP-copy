import { Injectable } from '@nestjs/common';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) { }

  async create(createPromotionDto: CreatePromotionDto) {
    try {
      console.log('Creating promotion:', createPromotionDto);
      // Transform DTO to Prisma input (Json handling)
      const result = await this.prisma.promotion.create({
        data: {
          name: createPromotionDto.name || 'Untitled Promotion',
          type: createPromotionDto.type || 'unknown',
          status: createPromotionDto.status || 'DRAFT',
          config: createPromotionDto.config || {},
          startDate: createPromotionDto.startDate ? new Date(createPromotionDto.startDate) : undefined,
          endDate: createPromotionDto.endDate ? new Date(createPromotionDto.endDate) : undefined,
        },
      });
      console.log('Promotion created:', result);
      return result;
    } catch (error) {
      console.error('Error creating promotion:', error);
      throw error;
    }
  }

  findAll() {
    return this.prisma.promotion.findMany();
  }

  findActive() {
    const now = new Date();
    return this.prisma.promotion.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { startDate: { lte: now }, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: null, endDate: null },
        ],
      },
    });
  }

  findOne(id: string) {
    return this.prisma.promotion.findUnique({ where: { id } });
  }

  update(id: string, updatePromotionDto: UpdatePromotionDto) {
    return this.prisma.promotion.update({
      where: { id },
      data: {
        ...updatePromotionDto,
        config: updatePromotionDto.config ? (updatePromotionDto.config as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  remove(id: string) {
    return this.prisma.promotion.delete({ where: { id } });
  }
}
