import { Body, Controller, Delete, Get, InternalServerErrorException, Logger, Param, Post, Put, Query, Redirect, Request, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guard/roles-guard';
import { Payment } from 'src/payment/model/payment.entity';
import { PaginationSearchDto } from 'src/shared/model/dto';
import { Role } from 'src/user/model/user.interface';
import { UserIsPaymentOwnerGuard } from './guard/user-is-payment-owner.guard';
import { PaymentCreateDto, PaymentUpdateDto } from './model/payment.dto';
import { PaymentService } from './payment.service';

@ApiTags('payments')
@Controller('api/payments')
export class PaymentController {
    private readonly logger = new Logger(PaymentController.name);

    constructor(
        private paymentService: PaymentService,
        private configService: ConfigService
    ) { }

    /**
     * 전체 결제 목록 조회
     */
    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Get('')
    getAll(@Query() search: PaginationSearchDto): Promise<Pagination<Payment>> {
        let limit = search.limit;
        limit = limit > 100 ? 100 : limit;
        return this.paymentService.paginate(search);
    }

    /**
     * 호스트 단위 전체 결제 목록 조회
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('by/host')
    get(@Query() search: PaginationSearchDto, @Request() request): Promise<Pagination<Payment>> {
        const userId = request.user.id;
        let limit = search.limit;
        limit = limit > 100 ? 100 : limit;
        return this.paymentService.paginate(search, userId);
    }

    /**
     * 호스트가 주최한 상품의 개별 결제 조회
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('by/host/:productId')
    getCountByProduct(@Param('productId') productId: number, @Request() request): Promise<number> {
        const userId = request.user.id;
        return this.paymentService.findOneByProduct(productId, userId);
    }

    /**
     * 로그인 한 유저의 개별 결제 조회
     */
    @UseGuards(AuthGuard('jwt'), UserIsPaymentOwnerGuard)
    @Get('owner/id/:id')
    getPurchasedProduct(@Param('id') id: number): Promise<any> {
        return this.paymentService.findOneByOwner(id);
    }

    /**
     * 로그인 한 유저의 결제 목록 조회
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('owner/search')
    getPurchasedProducts(@Query() search: PaginationSearchDto, @Request() request): Promise<any> {
        const userId = request.user.id;
        return this.paymentService.paginateByUser(userId, search);
    }

    @Post('pg/auth')
    pgAuth(): Promise<boolean> {
        return this.paymentService.authPayple('');
    }

    @Post('callback')
    @Redirect(`${new ConfigService().get('SITE_HOST')}/tabs/payment-success`)
    async callbackPayment(@Body() paypleDto: any): Promise<any> {
        try {
            const payment = await this.paymentService.pay(paypleDto);
            this.logger.log(payment);
            await this.paymentService.sendAlimtalk(payment);
            return { url: `${this.configService.get('SITE_HOST')}/tabs/payment-success/${payment.id}` }
        } catch (e) {
            this.logger.error(e);
            return { url: `${this.configService.get('SITE_HOST')}/tabs/payment-fail` }
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