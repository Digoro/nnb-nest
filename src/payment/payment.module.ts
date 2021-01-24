import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from 'src/payment/model/payment.entity';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Payment
        ])
    ],
    providers: [
        PaymentService
    ],
    controllers: [
        PaymentController
    ]
})
export class PaymentModule { }