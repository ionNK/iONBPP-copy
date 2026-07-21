import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EventsController } from './events.controller';
import { PromotionsModule } from '../promotions/promotions.module';
import { PrismaModule } from '../prisma/prisma.module';


@Module({
  imports: [
    PromotionsModule,
    PrismaModule,
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'simulated-producer-' + Math.random(),
          },
        },
      },
    ]),
  ],
  controllers: [EventsController]
})
export class EventsModule { }
