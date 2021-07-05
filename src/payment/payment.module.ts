import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Payment } from 'src/payment/model/payment.entity';
import { Gift } from 'src/product/model/gift.entity';
import { Product } from 'src/product/model/product.entity';
import { SharedModule } from 'src/shared/shared.module';
import { Coupon, User, UserCouponMap } from 'src/user/model/user.entity';
import { ProductOption } from './../product/model/product.entity';
import { UserIsPaymentOwnerGuard } from './guard/user-is-payment-owner.guard';
import { Order, OrderItem } from './model/order.entity';
import { PaymentCancel } from './model/payment-cancel.entity';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Payment,
            PaymentCancel,
            Order,
            OrderItem,
            User,
            Coupon,
            UserCouponMap,
            Product,
            ProductOption,
            Gift
        ]),
        AuthModule,
        SharedModule
    ],
    providers: [
        PaymentService,
        UserIsPaymentOwnerGuard
    ],
    controllers: [
        PaymentController
    ]
})
export class PaymentModule { }