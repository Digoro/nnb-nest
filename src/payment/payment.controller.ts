import { Body, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Payment } from 'src/payment/model/payment.entity';
import { PaymentCreateDto, PaymentSearchDto, PaymentUpdateDto } from './model/payment.dto';
import { PaymentService } from './payment.service';

@Controller('api/payments')
export class PaymentController {
    constructor(
        private paymentService: PaymentService
    ) { }

    @UseGuards(AuthGuard('jwt'))
    @Post('')
    create(@Body() payment: PaymentCreateDto): Promise<Payment> {
        return this.paymentService.create(payment);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    async findOne(@Param('id') id: number): Promise<Payment> {
        const payment = await this.paymentService.findById(id);
        if (!payment) throw new NotFoundException()
        return payment;
    }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    index(@Query() search: PaymentSearchDto): Promise<Pagination<Payment>> {
        let limit = +search.limit;
        limit = limit > 100 ? 100 : limit;
        return this.paymentService.paginate(search);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete(':id')
    deleteOne(@Param('id') id: number): Promise<any> {
        return this.paymentService.deleteOne(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id')
    updateOne(@Param('id') id: number, @Body() payment: PaymentUpdateDto): Promise<any> {
        try {
            return this.paymentService.updateOne(id, payment);
        } catch {
            throw new InternalServerErrorException();
        }
    }
}