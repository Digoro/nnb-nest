import { Body, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Param, Post, Put, Query, Redirect, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Payment } from 'src/payment/model/payment.entity';
import { UserIsPaymentOwnerGuard } from './guard/user-is-payment-owner.guard';
import { PaymentCreateDto, PaymentSearchDto, PaymentUpdateDto, PaypleCreateDto } from './model/payment.dto';
import { PaymentService } from './payment.service';

@Controller('api/payments')
export class PaymentController {
    constructor(
        private paymentService: PaymentService
    ) { }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    index(@Query() search: PaymentSearchDto): Promise<Pagination<Payment>> {
        let limit = +search.limit;
        limit = limit > 100 ? 100 : limit;
        return this.paymentService.paginate(search);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    async findOne(@Param('id') id: number): Promise<Payment> {
        const payment = await this.paymentService.findById(id);
        if (!payment) throw new NotFoundException()
        return payment;
    }

    @UseGuards(AuthGuard('jwt'), UserIsPaymentOwnerGuard)
    @Get('owner/id/:id')
    getPurchasedProduct(@Param('id') id: number): Promise<any> {
        return this.paymentService.findById(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('owner/search')
    getPurchasedProducts(@Query() search: PaymentSearchDto, @Request() request): Promise<any> {
        const userId = request.user.id;
        return this.paymentService.paginateByUserId(userId, search);
    }

    @Post('pg/auth')
    pgAuth(): Promise<boolean> {
        return this.paymentService.authPayple('');
    }

    @Post('callback')
    @Redirect('http://localhost:8080/tabs/payment-success')
    async callbackPayment(@Body() paypleDto: PaypleCreateDto): Promise<any> {
        try {
            const payment = await this.paymentService.pay(paypleDto);
            return { url: `http://localhost:8080/tabs/payment-success/${payment.id}` }
        } catch {
            return { url: `http://localhost:8080/tabs/payment-fail` }
        }
    }

    @Post('')
    create(@Body() paymentDto: PaymentCreateDto): Promise<any> {
        return this.paymentService.join(paymentDto);
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

    @UseGuards(AuthGuard('jwt'))
    @Delete(':id')
    deleteOne(@Param('id') id: number): Promise<any> {
        return this.paymentService.deleteOne(id);
    }
}