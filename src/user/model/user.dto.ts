import { OmitType, PartialType, PickType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsDateString, IsEmail, IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { Role } from 'src/user/model/user.interface';
import { Dto, PaginationSearchDto } from './../../shared/model/dto';
import { Coupon } from './user.entity';
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
    @IsDateString()
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


export class UserLikeDto {
    @IsInt()
    id: number;

    @IsBoolean()
    isLike: boolean;
}

export class CouponCreateDto implements Dto<Coupon>{
    @IsString()
    name: string;

    @IsString()
    contents: string;

    @IsInt()
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