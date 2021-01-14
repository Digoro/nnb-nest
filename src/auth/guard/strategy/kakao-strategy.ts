import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-kakao';
import { Provider } from 'src/auth/service/auth.service';
import { AuthService } from '../../service/auth.service';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, Provider.KAKAO) {
    constructor(
        private configService: ConfigService,
        private authService: AuthService
    ) {
        super({
            clientID: configService.get('KAKAO_CLIENT_ID'),
            clientSecret: '',
            callbackURL: 'http://localhost:3000/auth/kakao/callback'
        })
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
        const email = profile.emails[0].value;
        const jwt = await this.authService.validateOAuthLogin(email, profile.id, Provider.KAKAO);
        if (jwt) done(null, jwt);
        else {
            done(null, false);
            throw new UnauthorizedException()
        }
    }
}