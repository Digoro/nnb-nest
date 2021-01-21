import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';
import { Coupon, User, UserProductLike, UserUserLike } from './model/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Coupon,
            UserProductLike,
            UserUserLike
        ]),
        AuthModule
    ],
    providers: [
        UserService,
        CouponService
    ],
    controllers: [
        UserController,
        CouponController
    ]
})
export class UserModule { }