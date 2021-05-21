import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { Dto, PaginationSearchDto } from './../../shared/model/dto';
import { NonMemberCreateDto } from './../../user/model/user.dto';
import { Order } from './order.entity';
import { Payment } from './payment.entity';
import { PayMethod, PG } from './payment.interface';

class OrderCreateDto {
    @IsNumber()
    userId: number;

    @IsNumber()
    productId: number;

    @IsOptional()
    @IsNumber()
    couponId: number;

    @IsOptional()
    @IsNumber()
    point: number;

    @IsDate()
    @Type(() => Date)
    orderAt: Date;

    @ValidateNested({ each: true })
    @Type(() => OrderItemCreateDto)
    orderItems: OrderItemCreateDto[];
}

class OrderItemCreateDto {
    @IsNumber()
    productOptionId: number;

    @IsNumber()
    count: number;
}

export class PaymentCreateDto implements Dto<Payment>{
    @ValidateNested({ each: true })
    @Type(() => OrderCreateDto)
    order: OrderCreateDto;

    @IsOptional()
    @IsEnum(PG)
    pgName: PG;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    pgOrderId: string;

    @IsDate()
    @Type(() => Date)
    payAt: Date;

    @IsInt()
    totalPrice: number;

    @IsEnum(PayMethod)
    payMethod: PayMethod;

    @IsInt()
    payPrice: number;

    @IsInt()
    payCommissionPrice: number;

    @IsBoolean()
    result: boolean;

    @IsString()
    @MaxLength(500)
    resultMessage: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    cardName: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    cardNum: string;

    @IsOptional()
    @IsString()
    @MaxLength(65535)
    cardReceipt: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    bankName: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    bankNum: string;

    toEntity(order: Order): Payment {
        const payment = new Payment();
        payment.order = order;
        payment.pgName = this.pgName;
        payment.pgOrderId = this.pgOrderId;
        payment.payAt = this.payAt;
        payment.totalPrice = this.totalPrice;
        payment.payMethod = this.payMethod;
        payment.payPrice = this.payPrice;
        payment.payCommissionPrice = this.payCommissionPrice;
        payment.result = this.result;
        payment.resultMessage = this.resultMessage;
        payment.cardName = this.cardName;
        payment.cardNum = this.cardNum;
        payment.cardReceipt = this.cardReceipt;
        payment.bankName = this.bankName;
        payment.bankNum = this.bankNum;
        return payment;
    }
}

export class NonMemberOrderCreateDto extends OmitType(OrderCreateDto, ['userId', 'couponId', 'point']) {
    @ValidateNested({ each: true })
    @Type(() => NonMemberCreateDto)
    nonMember: NonMemberCreateDto;
}

export class NonMemberPaymentCreateDto extends OmitType(PaymentCreateDto, ['order']) {
    @ValidateNested({ each: true })
    @Type(() => NonMemberOrderCreateDto)
    order: NonMemberOrderCreateDto;

    toEntity2(order: Order): Payment {
        const payment = new Payment();
        payment.order = order;
        payment.pgName = this.pgName;
        payment.pgOrderId = this.pgOrderId;
        payment.payAt = this.payAt;
        payment.totalPrice = this.totalPrice;
        payment.payMethod = this.payMethod;
        payment.payPrice = this.payPrice;
        payment.payCommissionPrice = this.payCommissionPrice;
        payment.result = this.result;
        payment.resultMessage = this.resultMessage;
        payment.cardName = this.cardName;
        payment.cardNum = this.cardNum;
        payment.cardReceipt = this.cardReceipt;
        payment.bankName = this.bankName;
        payment.bankNum = this.bankNum;
        return payment;
    }
}

export class PaymentUpdateDto extends PartialType(PaymentCreateDto) { }

export class PaypleCreateDto {
    @IsOptional()
    @IsString()
    PCD_PAY_RST: string;
    @IsOptional()
    @IsString()
    PCD_PAY_MSG: string;
    @IsOptional()
    @IsString()
    PCD_AUTH_KEY: string;
    @IsOptional()
    @IsString()
    PCD_PAY_REQKEY: string;
    @IsOptional()
    @IsString()
    PCD_PAY_COFURL: string;
    @IsOptional()
    @IsString()
    PCD_PAY_OID: string;
    @IsOptional()
    @IsString()
    PCD_PAY_TYPE: string;
    @IsOptional()
    @IsString()
    PCD_PAY_WORK: string;
    @IsOptional()
    @IsString()
    PCD_PAYER_ID: string;
    @IsOptional()
    @IsString()
    PCD_PAYER_NO: string;
    @IsOptional()
    @IsString()
    PCD_REGULER_FLAG: string;
    @IsOptional()
    @IsString()
    PCD_PAY_YEAR: string;
    @IsOptional()
    @IsString()
    PCD_PAY_MONTH: string;
    @IsOptional()
    @IsString()
    PCD_PAY_GOODS: string;
    @IsOptional()
    @IsString()
    PCD_PAY_TOTAL: string;
    @IsOptional()
    @IsString()
    PCD_PAY_ISTAX: string;
    @IsOptional()
    @IsString()
    PCD_PAY_TAXTOTAL: string;
    @IsOptional()
    @IsString()
    PCD_PAY_BANK: string;
    @IsOptional()
    @IsString()
    PCD_PAY_BANKNAME: string;
    @IsOptional()
    @IsString()
    PCD_PAY_BANKNUM: string;
    @IsOptional()
    @IsString()
    PCD_PAY_TIME: string;
    @IsOptional()
    @IsString()
    PCD_TAXSAVE_FLAG: string;
    @IsOptional()
    @IsString()
    PCD_TAXSAVE_RST: string;
    @IsOptional()
    @IsString()
    PCD_TAXSAVE_MGTNUM: string;

    @IsOptional()
    @IsString()
    PCD_PAYER_NAME: string;
    @IsOptional()
    @IsString()
    PCD_RST_URL: string;
    @IsOptional()
    @IsString()
    PCD_PAYER_EMAIL: string;
    @IsOptional()
    @IsString()
    PCD_PAY_CARDNAME: string;
    @IsOptional()
    @IsString()
    PCD_PAY_CARDNUM: string;
    @IsOptional()
    @IsString()
    PCD_PAY_CARDQUOTA: string;
    @IsOptional()
    @IsString()
    PCD_PAY_CARDTRADENUM: string;
    @IsOptional()
    @IsString()
    PCD_PAY_CARDAUTHNO: string;
    @IsOptional()
    @IsString()
    PCD_PAY_CARDRECEIPT: string;

    @IsOptional()
    @IsString()
    PCD_CARD_VER: string;
    @IsOptional()
    @IsString()
    PCD_PAYER_HP: string;
    @IsOptional()
    @IsString()
    PCD_PAY_BANKACCTYPE: string;

    @IsOptional()
    @IsString()
    PCD_PAY_CODE: string;
    @IsOptional()
    @IsString()
    PCD_PAY_HOST: string;
    @IsOptional()
    @IsString()
    PCD_PAY_URL: string;
    @IsOptional()
    @IsString()
    PCD_PAY_AMOUNT: string;
    @IsOptional()
    @IsString()
    PCD_PAY_DISCOUNT: string;
    @IsOptional()
    @IsString()
    PCD_PAY_AMOUNT_REAL: string;
    @IsOptional()
    @IsString()
    PCD_USER_DEFINE1: string;
    @IsOptional()
    @IsString()
    PCD_USER_DEFINE2: string;
    @IsOptional()
    @IsString()
    PCD_HTTP_REFERER: string;
}

export class PaymentSearchDto extends PaginationSearchDto {
    @IsBoolean()
    isLast: boolean;
}

export class PaymentCancelDto {
    @IsString()
    @MaxLength(1000)
    reason: string;

    @IsNumber()
    @Type(() => Number)
    payment: number;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    refundPrice: number;

    @IsBoolean()
    @Type(() => Boolean)
    refundCoupon: boolean;

    @IsBoolean()
    @Type(() => Boolean)
    refundPoint: boolean;
}