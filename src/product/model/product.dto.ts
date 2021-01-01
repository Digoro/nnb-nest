import { PartialType } from '@nestjs/mapped-types';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { User } from 'src/user/model/user.interface';

export class ProductCreateDto {
    @IsString()
    title: string;

    @IsNumber()
    price: number;

    @IsString()
    programs: string;

    @IsOptional()
    host: User;
}

export class ProductUpdateDto extends PartialType(ProductCreateDto) { }