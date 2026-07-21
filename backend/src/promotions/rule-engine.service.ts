import { Injectable } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RuleEngineService {
    constructor(
        private promotionsService: PromotionsService,
        private prisma: PrismaService
    ) { }

    async evaluateEvent(event: any) {
        console.log('Evaluating event:', event.eventType);

        // 1. Log the raw event to DB
        const eventLog = await this.logEvent(event);

        // 2. Fetch active promotions
        const activePromotions = await this.promotionsService.findActive();
        console.log(`Found ${activePromotions.length} active promotions`);

        for (const promo of activePromotions) {
            if (this.checkCondition(promo, event)) {
                await this.triggerAction(promo, event, eventLog.id);
            }
        }

        // 3. Mark event as processed
        await this.prisma.eventLog.update({
            where: { id: eventLog.id },
            data: { processed: true }
        });
    }

    private async logEvent(event: any) {
        return this.prisma.eventLog.create({
            data: {
                type: event.eventType || 'unknown',
                payload: event,
            }
        });
    }

    private checkCondition(promo: any, event: any): boolean {
        // Simple matching logic (MVP)
        // Match if the event amount > 50 and it is a bet placement
        if (event.eventType === 'bet_placed' && event.amount > 50) {
            return true;
        }
        return false;
    }

    private async triggerAction(promo: any, event: any, eventLogId: string) {
        console.log(`✅ PROMOTION TRIGGERED: "${promo.name}" for player ${event.playerId}`);

        // Record the trigger
        await this.prisma.promotionTrigger.create({
            data: {
                promotionId: promo.id,
                eventLogId: eventLogId,
                actionTaken: { type: 'bonus_credit', amount: 10, currency: 'KES' } // Mock action
            }
        });
    }
}
