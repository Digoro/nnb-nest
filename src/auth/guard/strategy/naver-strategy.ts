import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-naver';
import { AuthService, OAuthProvider } from 'src/auth/service/auth.service';
import { ErrorInfo } from 'src/shared/model/error-info';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, OAuthProvider.NAVER) {
    constructor(
        private configService: ConfigService,
        private authService: AuthService
    ) {
        super({
            clientID: configService.get('NAVER_CLIENT_ID'),
            clientSecret: configService.get('NAVER_CLIENT_SECRET_KEY'),
            callbackURL: `${configService.get('API_HOST')}/auth/naver/callback`
        })
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
        const email = profile.emails[0].value;
        const id = profile.id;
        const nickname = profile.displayName;
        const image = profile.photos ? profile.photos[0].value : profile._json.profile_image;
        const jwt = await this.authService.oauthLogin(email, id, nickname, OAuthProvider.NAVER, image);
        if (jwt) done(null, jwt);
        else {
            done(null, false);
            throw new UnauthorizedException(new ErrorInfo('NE004', 'NEI0024', '네이버로 로그인 실패'))
        }
    }
}