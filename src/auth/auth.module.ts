import { HttpModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from './../shared/service/mail.service';
import { User } from './../user/model/user.entity';
import { AuthController } from './auth.controller';
import { RolesGuard } from './guard/roles-guard';
import { FacebookStrategy } from './guard/strategy/facebook-strategy';
import { GoogleStrategy } from './guard/strategy/google-strategy';
import { JwtStrategy } from './guard/strategy/jwt-strategy';
import { KakaoStrategy } from './guard/strategy/kakao-strategy';
import { NaverStrategy } from './guard/strategy/naver-strategy';
import { UserIsUserGuard } from './guard/user-is-user-guard';
import { AuthSms, FindPassword } from './model/auth.entity';
import { AuthService } from './service/auth.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            AuthSms,
            FindPassword
        ]),
        HttpModule,
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
        NaverStrategy,
        MailService
    ],
    exports: [AuthService],
    controllers: [AuthController]
})
export class AuthModule { }