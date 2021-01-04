import { Injectable } from '@nestjs/common';
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
        try {
            const email = profile.emails[0].value
            const jwt = this.authService.validateOAuthLogin(email, profile.id, Provider.GOOGLE);
            const user = {
                jwt
            };
            done(null, user)
        } catch (err) {
            done(err, false);
        }
    }
}