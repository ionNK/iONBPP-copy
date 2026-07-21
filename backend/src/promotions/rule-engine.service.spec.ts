import { Test, TestingModule } from '@nestjs/testing';
import { RuleEngineService } from './rule-engine.service';
import { PromotionsService } from './promotions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RuleEngineService', () => {
  let service: RuleEngineService;
  let promotionsService: { findActive: jest.Mock };
  let prisma: {
    eventLog: { create: jest.Mock; update: jest.Mock };
    promotionTrigger: { create: jest.Mock };
  };

  beforeEach(async () => {
    promotionsService = { findActive: jest.fn() };
    prisma = {
      eventLog: {
        create: jest.fn().mockResolvedValue({ id: 'log1' }),
        update: jest.fn().mockResolvedValue({ id: 'log1', processed: true }),
      },
      promotionTrigger: { create: jest.fn().mockResolvedValue({ id: 't1' }) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuleEngineService,
        { provide: PromotionsService, useValue: promotionsService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<RuleEngineService>(RuleEngineService);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkCondition (via evaluateEvent trigger side-effects)', () => {
    const activePromo = { id: 'promo1', name: 'Big Bet Bonus' };

    it('triggers for a bet_placed event with amount > 50', async () => {
      promotionsService.findActive.mockResolvedValue([activePromo]);

      await service.evaluateEvent({ eventType: 'bet_placed', amount: 100, playerId: 'u1' });

      expect(prisma.promotionTrigger.create).toHaveBeenCalledTimes(1);
      expect(prisma.promotionTrigger.create).toHaveBeenCalledWith({
        data: {
          promotionId: 'promo1',
          eventLogId: 'log1',
          actionTaken: { type: 'bonus_credit', amount: 10, currency: 'KES' },
        },
      });
    });

    it('does NOT trigger when amount equals the threshold (50)', async () => {
      promotionsService.findActive.mockResolvedValue([activePromo]);

      await service.evaluateEvent({ eventType: 'bet_placed', amount: 50, playerId: 'u1' });

      expect(prisma.promotionTrigger.create).not.toHaveBeenCalled();
    });

    it('does NOT trigger for a non bet_placed event type', async () => {
      promotionsService.findActive.mockResolvedValue([activePromo]);

      await service.evaluateEvent({ eventType: 'deposit', amount: 500, playerId: 'u1' });

      expect(prisma.promotionTrigger.create).not.toHaveBeenCalled();
    });

    it('does NOT trigger when amount is missing', async () => {
      promotionsService.findActive.mockResolvedValue([activePromo]);

      await service.evaluateEvent({ eventType: 'bet_placed', playerId: 'u1' });

      expect(prisma.promotionTrigger.create).not.toHaveBeenCalled();
    });
  });

  describe('evaluateEvent orchestration', () => {
    it('logs the raw event, evaluates active promos, and marks event processed', async () => {
      promotionsService.findActive.mockResolvedValue([]);
      const event = { eventType: 'bet_placed', amount: 10, playerId: 'u1' };

      await service.evaluateEvent(event);

      // 1. logs raw event
      expect(prisma.eventLog.create).toHaveBeenCalledWith({
        data: { type: 'bet_placed', payload: event },
      });
      // 2. fetches active promotions
      expect(promotionsService.findActive).toHaveBeenCalledTimes(1);
      // 3. marks processed
      expect(prisma.eventLog.update).toHaveBeenCalledWith({
        where: { id: 'log1' },
        data: { processed: true },
      });
    });

    it('defaults event type to "unknown" when missing', async () => {
      promotionsService.findActive.mockResolvedValue([]);

      await service.evaluateEvent({ amount: 10 });

      expect(prisma.eventLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'unknown' }) }),
      );
    });

    it('only triggers the promotions whose conditions match', async () => {
      promotionsService.findActive.mockResolvedValue([
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ]);

      await service.evaluateEvent({ eventType: 'bet_placed', amount: 999, playerId: 'u1' });

      // Both active promos match the same simple condition => 2 triggers
      expect(prisma.promotionTrigger.create).toHaveBeenCalledTimes(2);
    });
  });
});
