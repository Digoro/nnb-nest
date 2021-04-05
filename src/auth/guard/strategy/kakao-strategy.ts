import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-kakao';
import { OAuthProvider } from 'src/auth/service/auth.service';
import { AuthService } from '../../service/auth.service';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, OAuthProvider.KAKAO) {
    constructor(
        private configService: ConfigService,
        private authService: AuthService
    ) {
        super({
            clientID: configService.get('KAKAO_CLIENT_ID'),
            clientSecret: '',
            callbackURL: `${configService.get('API_HOST')}/auth/kakao/callback`,
            scope: 'account_email, profile'
        })
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
        const email = profile._json.kakao_account.email;
        const username = profile.username;
        const image = profile._json.kakao_account.profile.profile_image_url;
        const jwt = await this.authService.oauthLogin(email, profile.id, username, OAuthProvider.KAKAO, image);
        if (jwt) done(null, jwt);
        else {
            done(null, false);
            throw new UnauthorizedException()
        }
    }
}