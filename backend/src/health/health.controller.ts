import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HttpHealthIndicator, MicroserviceHealthIndicator, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { Transport } from '@nestjs/microservices';

@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private http: HttpHealthIndicator,
        private microservice: MicroserviceHealthIndicator,
        private prisma: PrismaService,
    ) { }

    @Get()
    @HealthCheck()
    check() {
        return this.health.check([
            // Check Database
            async () => {
                try {
                    await this.prisma.$queryRaw`SELECT 1`;
                    return { promotion_db: { status: 'up' as const } };
                } catch (e) {
                    throw new HealthCheckError('Database check failed', { promotion_db: { status: 'down' as const, message: e.message } });
                }
            },
            // Check Kafka
            () => this.microservice.pingCheck('kafka', {
                transport: Transport.KAFKA,
                options: {
                    client: { brokers: ['localhost:9092'] },
                    consumer: { groupId: 'health-check' },
                },
            }),
        ]);
    }
}
