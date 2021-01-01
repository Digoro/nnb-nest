import { PickType } from '@nestjs/mapped-types';
import { IsEmail, IsEnum, IsString } from 'class-validator';
import { Role } from 'src/user/model/user.interface';

export class UserCreateDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

export class UserLoginDto extends PickType(UserCreateDto, ['email', 'password']) { }

export class UserUpdateDto extends PickType(UserCreateDto, ['name']) { }

export class UserUpdateRoleDto {
    @IsEnum(Role)
    role: Role;
}