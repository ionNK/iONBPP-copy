import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CountriesService } from './countries.service';

@Controller('countries')
export class CountriesController {
    constructor(private readonly countriesService: CountriesService) { }

    @Get()
    findAll() {
        return this.countriesService.findAll();
    }

    @Post()
    create(@Body() data: any) {
        return this.countriesService.create(data);
    }

    @Put(':code')
    update(@Param('code') code: string, @Body() data: any) {
        return this.countriesService.update(code, data);
    }

    @Delete(':code')
    delete(@Param('code') code: string) {
        return this.countriesService.delete(code);
    }
}
