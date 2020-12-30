import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './../user/model/user.entity';
import { JwtAuthGuard } from './guard/jwt-auth-guard';
import { JwtStrategy } from './guard/jwt-strategy';
import { RolesGuard } from './guard/roles-guard';
import { UserIsUserGuard } from './guard/user-is-user-guard';
import { AuthService } from './service/auth.service';
import { UserSecurityService } from './service/user-security.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([UserEntity]),
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
        JwtAuthGuard,
        JwtStrategy,
        UserSecurityService,
        UserIsUserGuard
    ],
    exports: [UserSecurityService]
})
export class AuthModule { }