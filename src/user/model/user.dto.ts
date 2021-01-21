import { OmitType, PartialType, PickType } from '@nestjs/mapped-types';
import { IsDate, IsDateString, IsEmail, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Role } from 'src/user/model/user.interface';
import { CouponEntity } from './user.entity';
import { Gender } from './user.interface';

export class UserCreateDto {
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    password: string;

    @IsOptional()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    phoneNumber: string;

    @IsOptional()
    @IsString()
    provider: string;

    @IsOptional()
    @IsString()
    thirdpartyId: string;

    @IsOptional()
    @IsInt()
    points: number;

    @IsOptional()
    @IsDate()
    birthday: Date;

    @IsString()
    nickname: string;

    @IsOptional()
    @IsEnum(Gender)
    gender: Gender;

    @IsString()
    profilePhoto: string;

    @IsOptional()
    @IsString()
    catchphrase: string;

    @IsOptional()
    @IsString()
    introduction: string;
}

export class UserLoginDto extends PickType(UserCreateDto, ['email', 'password']) { }

export class UserUpdateDto extends OmitType(UserCreateDto, ['email', 'provider', 'thirdpartyId']) {
    @IsOptional()
    @IsString()
    nickname: string;

    @IsOptional()
    @IsString()
    profilePhoto: string;
}

export class UserUpdateRoleDto {
    @IsEnum(Role)
    role: Role;
}

export class CouponCreateDto {
    @IsString()
    name: string;

    @IsString()
    contents: string;

    @IsInt()
    price: number;

    @IsDateString()
    expireDuration: Date;

    toEntity(): CouponEntity {
        const coupon = new CouponEntity();
        coupon.name = this.name;
        coupon.contents = this.contents;
        coupon.price = this.price;
        coupon.expireDuration = this.expireDuration;
        return coupon;
    }
}

export class CouponUpdateDto extends PartialType(CouponCreateDto) { }