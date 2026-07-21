import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PromotionsModule } from './promotions/promotions.module';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';
import { HealthModule } from './health/health.module';
import { CountriesModule } from './countries/countries.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PromotionsModule,
    PrismaModule,
    EventsModule,
    HealthModule,
    CountriesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
