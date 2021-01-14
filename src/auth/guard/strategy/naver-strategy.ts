import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-naver';
import { AuthService, Provider } from 'src/auth/service/auth.service';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, Provider.NAVER) {
    constructor(
        private configService: ConfigService,
        private authService: AuthService
    ) {
        super({
            clientID: configService.get('NAVER_CLIENT_ID'),
            clientSecret: configService.get('NAVER_CLIENT_SECRET_KEY'),
            callbackURL: 'http://localhost:3000/auth/naver/callback'
        })
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
        const email = profile.emails[0].value;
        const jwt = await this.authService.validateOAuthLogin(email, profile.id, Provider.NAVER);
        if (jwt) done(null, jwt);
        else {
            done(null, false);
            throw new UnauthorizedException()
        }
    }
}