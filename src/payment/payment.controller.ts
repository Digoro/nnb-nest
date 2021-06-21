import { Body, Controller, Delete, Get, Param, Post, Put, Query, Redirect, Request, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guard/roles-guard';
import { Payment } from 'src/payment/model/payment.entity';
import { PaginationSearchDto } from 'src/shared/model/dto';
import { KakaotalkMessageType, KakaotalkService } from 'src/shared/service/kakaotalk.service';
import { SlackMessageType, SlackService } from 'src/shared/service/slack.service';
import { Role } from 'src/user/model/user.interface';
import { NonMemberPaymentCreateDto, PaymentCancelDto, PaymentCreateDto, PaymentSearchDto, PaymentUpdateDto } from './model/payment.dto';
import { PaymentService } from './payment.service';

@ApiTags('payments')
@Controller('api/payments')
export class PaymentController {
    constructor(
        private paymentService: PaymentService,
        private configService: ConfigService,
        private slackService: SlackService,
        private kakaoService: KakaotalkService
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
    @Get('owner/id/:id')
    getPurchasedProduct(@Param('id') id: number): Promise<any> {
        return this.paymentService.findOneByOwner(id);
    }

    /**
     * 로그인 한 유저의 결제 목록 조회
     */
    @UseGuards(AuthGuard('jwt'))
    @Post('owner/search')
    getPurchasedProducts(@Body() search: PaymentSearchDto, @Request() request): Promise<any> {
        const userId = request.user.id;
        return this.paymentService.paginateByUser(userId, search);
    }

    /**
     * 비회원 예약 확인
     */
    @Get('nonMember')
    getNonMemberPayment(@Query('name') name: string, @Query('phoneNumber') phoneNumber: string, @Query('orderId') orderId: string): Promise<Payment> {
        return this.paymentService.getNonMemberPayment(name, phoneNumber, orderId);
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
            try {
                const orderItems = await this.paymentService.getOrderItems(payment.order.id);
                await this.kakaoService.send(KakaotalkMessageType.PAYMENT, payment, { orderItems })
                if (this.configService.get('IS_SEND_ALIM_TO_MANAGER') === 'true') {
                    await this.slackService.send(SlackMessageType.PAYMENT, payment);
                    await this.kakaoService.send(KakaotalkMessageType.PAYMENT, payment, { orderItems, receiver: this.configService.get('MANAGER_PHONE_01') });
                    await this.kakaoService.send(KakaotalkMessageType.PAYMENT, payment, { orderItems, receiver: this.configService.get('MANAGER_PHONE_02') });
                }
            } catch (e) {
                return { url: `${this.configService.get('SITE_HOST')}/tabs/payment-fail?errorCode=NEI0013` }
            }
            return { url: `${this.configService.get('SITE_HOST')}/tabs/payment-success/${payment.id}` }
        } catch (e) {
            const status = e.getStatus();
            const beforePage = e.getResponse().reason;
            if (status === 400) return { url: beforePage }
            else return { url: `${this.configService.get('SITE_HOST')}/tabs/payment-fail?errorCode=NEI0011` }
        }
    }

    @Post('')
    create(@Body() paymentDto: PaymentCreateDto): Promise<any> {
        return this.paymentService.join(paymentDto);
    }

    @Post('nonMember')
    nonMemberCreate(@Body() paymentDto: NonMemberPaymentCreateDto): Promise<any> {
        return this.paymentService.payNonMember(paymentDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id')
    updateOne(@Param('id') id: number, @Body() payment: PaymentUpdateDto): Promise<any> {
        return this.paymentService.updateOne(id, payment);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete(':id')
    deleteOne(@Param('id') id: number): Promise<any> {
        return this.paymentService.deleteOne(id);
    }

    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Post('cancel')
    cancel(@Body() dto: PaymentCancelDto): Promise<any> {
        return this.paymentService.cancelPayple(dto);
    }
}