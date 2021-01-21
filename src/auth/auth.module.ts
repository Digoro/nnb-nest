import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './../user/model/user.entity';
import { AuthController } from './auth.controller';
import { RolesGuard } from './guard/roles-guard';
import { FacebookStrategy } from './guard/strategy/facebook-strategy';
import { GoogleStrategy } from './guard/strategy/google-strategy';
import { JwtStrategy } from './guard/strategy/jwt-strategy';
import { KakaoStrategy } from './guard/strategy/kakao-strategy';
import { NaverStrategy } from './guard/strategy/naver-strategy';
import { UserIsUserGuard } from './guard/user-is-user-guard';
import { AuthService } from './service/auth.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
                signOptions: { expiresIn: '2h' }
            })
        })
    ],
    providers: [
        AuthService,
        RolesGuard,
        AuthService,
        UserIsUserGuard,
        FacebookStrategy,
        GoogleStrategy,
        JwtStrategy,
        KakaoStrategy,
        NaverStrategy
    ],
    exports: [AuthService],
    controllers: [AuthController]
})
export class AuthModule { }