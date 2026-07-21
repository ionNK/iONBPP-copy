import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_COUNTRIES = [
    { code: 'KE', name: 'Kenya', currency: 'KES', countryLimit: 10000000, promoLimit: 100000 },
    { code: 'GH', name: 'Ghana', currency: 'GHS', countryLimit: 800000, promoLimit: 8000 },
    { code: 'TZ', name: 'Tanzania', currency: 'TZS', countryLimit: 15000000, promoLimit: 150000 },
    { code: 'UG', name: 'Uganda', currency: 'UGX', countryLimit: 25000000, promoLimit: 250000 },
    { code: 'ET', name: 'Ethiopia', currency: 'ETB', countryLimit: 300000, promoLimit: 3000 },
    { code: 'NG', name: 'Nigeria', currency: 'NGN', countryLimit: 5000000, promoLimit: 50000 },
    { code: 'ZM', name: 'Zambia', currency: 'ZMW', countryLimit: 100000, promoLimit: 1000 },
];

@Injectable()
export class CountriesService implements OnModuleInit {
    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        // Seed default countries if empty
        const count = await this.prisma.country.count();
        if (count === 0) {
            console.log('Seeding default countries...');
            for (const country of DEFAULT_COUNTRIES) {
                await this.prisma.country.create({ data: country });
            }
        }
    }

    async findAll() {
        return this.prisma.country.findMany({
            orderBy: { name: 'asc' }
        });
    }

    async create(data: any) {
        return this.prisma.country.create({ data });
    }

    async update(code: string, data: any) {
        return this.prisma.country.update({
            where: { code },
            data
        });
    }

    async delete(code: string) {
        return this.prisma.country.delete({
            where: { code }
        });
    }
}
