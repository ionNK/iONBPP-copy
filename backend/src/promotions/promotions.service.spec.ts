import { Test, TestingModule } from '@nestjs/testing';
import { PromotionsService } from './promotions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PromotionsService', () => {
  let service: PromotionsService;
  let prisma: {
    promotion: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      promotion: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PromotionsService>(PromotionsService);

    // Silence noisy console logs from the service under test
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('passes through provided fields and parses dates', async () => {
      const dto = {
        name: 'Welcome Bonus',
        type: 'cashback',
        status: 'ACTIVE' as const,
        config: { amount: 10 },
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-02-01T00:00:00.000Z',
      };
      prisma.promotion.create.mockResolvedValue({ id: 'p1', ...dto });

      const result = await service.create(dto);

      expect(prisma.promotion.create).toHaveBeenCalledWith({
        data: {
          name: 'Welcome Bonus',
          type: 'cashback',
          status: 'ACTIVE',
          config: { amount: 10 },
          startDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: new Date('2026-02-01T00:00:00.000Z'),
        },
      });
      expect(result).toEqual({ id: 'p1', ...dto });
    });

    it('applies sensible defaults when optional fields are missing', async () => {
      prisma.promotion.create.mockResolvedValue({ id: 'p2' });

      await service.create({ config: {} } as any);

      expect(prisma.promotion.create).toHaveBeenCalledWith({
        data: {
          name: 'Untitled Promotion',
          type: 'unknown',
          status: 'DRAFT',
          config: {},
          startDate: undefined,
          endDate: undefined,
        },
      });
    });

    it('rethrows errors from prisma', async () => {
      const err = new Error('db down');
      prisma.promotion.create.mockRejectedValue(err);

      await expect(service.create({ config: {} } as any)).rejects.toThrow('db down');
    });
  });

  describe('findAll', () => {
    it('delegates to prisma.findMany', () => {
      const rows = [{ id: 'p1' }];
      prisma.promotion.findMany.mockReturnValue(rows);

      expect(service.findAll()).toBe(rows);
      expect(prisma.promotion.findMany).toHaveBeenCalledWith();
    });
  });

  describe('findActive', () => {
    it('filters by ACTIVE status and the date window OR clause', () => {
      prisma.promotion.findMany.mockReturnValue([]);

      service.findActive();

      const arg = prisma.promotion.findMany.mock.calls[0][0];
      expect(arg.where.status).toBe('ACTIVE');
      expect(Array.isArray(arg.where.OR)).toBe(true);
      expect(arg.where.OR).toHaveLength(4);
      // Fully-open window (no start/end) must be included
      expect(arg.where.OR).toContainEqual({ startDate: null, endDate: null });
    });
  });

  describe('findOne', () => {
    it('queries by id', () => {
      prisma.promotion.findUnique.mockReturnValue({ id: 'p1' });

      const result = service.findOne('p1');

      expect(prisma.promotion.findUnique).toHaveBeenCalledWith({ where: { id: 'p1' } });
      expect(result).toEqual({ id: 'p1' });
    });
  });

  describe('update', () => {
    it('coerces config JSON when provided', () => {
      prisma.promotion.update.mockReturnValue({ id: 'p1' });

      service.update('p1', { name: 'New', config: { a: 1 } } as any);

      expect(prisma.promotion.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { name: 'New', config: { a: 1 } },
      });
    });

    it('sets config to undefined when not provided', () => {
      prisma.promotion.update.mockReturnValue({ id: 'p1' });

      service.update('p1', { name: 'New' } as any);

      const arg = prisma.promotion.update.mock.calls[0][0];
      expect(arg.data.config).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('deletes by id', () => {
      prisma.promotion.delete.mockReturnValue({ id: 'p1' });

      service.remove('p1');

      expect(prisma.promotion.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });
  });
});
