import { OmitType, PickType } from '@nestjs/mapped-types';
import { IsDate, IsEmail, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Role } from 'src/user/model/user.interface';
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