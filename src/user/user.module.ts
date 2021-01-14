import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { UserEntity } from './model/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([UserEntity]),
        AuthModule
    ],
    providers: [UserService],
    controllers: [UserController]
})
export class UserModule { }