import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationSearchDto } from 'src/shared/model/dto';
import { PayMethod, PG } from './payment.interface';

export class PaymentCreateDto {
    @IsString()
    orderId: string;

    @IsOptional()
    @IsEnum(PG)
    pgName: PG;

    @IsOptional()
    @IsString()
    pgOrderId: string;

    @IsDateString()
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
    resultMessage: string;

    @IsOptional()
    @IsString()
    cardName: string;

    @IsOptional()
    @IsString()
    cardNum: string;

    @IsOptional()
    @IsString()
    cardReceipt: string;

    @IsOptional()
    @IsString()
    bankName: string;

    @IsOptional()
    @IsString()
    bankNum: string;
}

export class PaymentUpdateDto extends PartialType(PaymentCreateDto) { }

export class PaymentSearchDto extends PaginationSearchDto { }