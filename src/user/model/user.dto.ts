import { OmitType, PartialType, PickType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsDateString, IsEmail, IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { Role } from 'src/user/model/user.interface';
import { Dto, PaginationSearchDto } from './../../shared/model/dto';
import { Coupon } from './user.entity';
import { Gender } from './user.interface';

export class UserCreateDto {
    @IsEmail()
    @MaxLength(254)
    email: string;

    @IsOptional()
    @IsString()
    @MinLength(10)
    @MaxLength(20)
    password: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(15)
    phoneNumber: string;

    @IsOptional()
    @IsString()
    @MaxLength(254)
    provider: string;

    @IsOptional()
    @IsString()
    @MaxLength(65535)
    thirdpartyId: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    points: number;

    @IsOptional()
    @IsDateString()
    birthday: Date;

    @IsString()
    @MaxLength(20)
    nickname: string;

    @IsOptional()
    @IsEnum(Gender)
    gender: Gender;

    @IsOptional()
    @IsString()
    @MaxLength(65535)
    profilePhoto: string;

    @IsOptional()
    @IsString()
    @MaxLength(30)
    catchphrase: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    introduction: string;

    @IsBoolean()
    aggrementTermsOfService: boolean;

    @IsBoolean()
    aggrementCollectPersonal: boolean;

    @IsBoolean()
    aggrementMarketing: boolean;
}

export class UserLoginDto extends PickType(UserCreateDto, ['email']) {
    @IsOptional()
    @IsString()
    password: string;
}

export class UserUpdateDto extends OmitType(UserCreateDto, ['email', 'provider', 'thirdpartyId', 'aggrementTermsOfService', 'aggrementCollectPersonal']) {
    @IsOptional()
    @IsString()
    @MaxLength(20)
    nickname: string;

    @IsOptional()
    @IsString()
    @MaxLength(65535)
    profilePhoto: string;

    @IsOptional()
    @IsBoolean()
    aggrementMarketing: boolean;
}

export class UserUpdateRoleDto {
    @IsEnum(Role)
    role: Role;
}

export class UserLikeDto {
    @IsInt()
    id: number;

    @IsBoolean()
    isLike: boolean;
}

export class CouponCreateDto implements Dto<Coupon>{
    @IsString()
    @MaxLength(50)
    name: string;

    @IsString()
    @MaxLength(500)
    contents: string;

    @IsInt()
    @Min(0)
    price: number;

    @IsDate()
    @Type(() => Date)
    expireDuration: Date;

    toEntity(): Coupon {
        const coupon = new Coupon();
        coupon.name = this.name;
        coupon.contents = this.contents;
        coupon.price = this.price;
        coupon.expireDuration = this.expireDuration;
        return coupon;
    }
}

export class CouponUpdateDto extends PartialType(CouponCreateDto) { }

export class CouponAddToUserDto {
    @IsInt()
    userId: number;

    @IsInt()
    couponId: number;
}

export class CouponSearchDto extends PaginationSearchDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    userId: number;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    expireDuration: Date;

    @IsOptional()
    @IsBoolean()
    @Transform(value => {
        if (value === 'true') return true;
        else if (value === 'false') return false;
        else return value;
    })
    isUsed: boolean;
}