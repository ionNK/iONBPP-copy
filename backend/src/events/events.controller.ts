import { Controller, Get, Post, Body, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka, Payload, EventPattern } from '@nestjs/microservices';
import { RuleEngineService } from '../promotions/rule-engine.service';
import { PrismaService } from '../prisma/prisma.service';
import { EVENT_CATALOG } from './schema/event.catalog';

@Controller('events')
export class EventsController implements OnModuleInit {
    constructor(
        private ruleEngine: RuleEngineService,
        private prisma: PrismaService,
        @Inject('KAFKA_SERVICE') private readonly client: ClientKafka
    ) { }

    async onModuleInit() {
        this.client.subscribeToResponseOf('player-events');
        await this.client.connect();
    }

    @Get('schema')
    getSchema() {
        return EVENT_CATALOG;
    }

    @Get('logs')
    async getEventLogs() {
        return this.prisma.eventLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20
        });
    }

    @Post('simulate')
    async simulateEvent(@Body() event: any) {
        console.log('Simulating event:', event);
        // Emit to the same topic the backend listens to
        this.client.emit('player-events', event);
        return { status: 'Event dispatched', event };
    }

    @EventPattern('player-events')
    async handlePlayerEvent(@Payload() data: any) {
        console.log('Core Engine received event:', JSON.stringify(data, null, 2));
        await this.ruleEngine.evaluateEvent(data);
    }
}
