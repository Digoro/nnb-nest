import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Product } from 'src/product/model/product.entity';
import { SharedModule } from 'src/shared/shared.module';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';
import { Coupon, NonMember, User, UserCouponMap, UserProductLike, UserUserLike } from './model/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            NonMember,
            Coupon,
            UserProductLike,
            UserUserLike,
            UserCouponMap,
            Product
        ]),
        AuthModule,
        SharedModule
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