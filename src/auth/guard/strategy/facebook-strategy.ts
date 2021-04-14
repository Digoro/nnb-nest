import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-facebook';
import { OAuthProvider } from 'src/auth/service/auth.service';
import { ErrorInfo } from 'src/shared/model/error-info';
import { AuthService } from './../../service/auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, OAuthProvider.FACEBOOK) {
    constructor(
        private configService: ConfigService,
        private authService: AuthService
    ) {
        super({
            clientID: configService.get('FACEBOOK_CLIENT_ID'),
            clientSecret: configService.get('FACEBOOK_CLIENT_SECRET_KEY'),
            callbackURL: `${configService.get('API_HOST')}/auth/facebook/callback`,
            profileFields: ['id', 'email', 'gender', 'link', 'locale', 'name', 'timezone', 'updated_time', 'verified', 'photos'],
        })
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
        const email = profile.emails[0].value;
        const id = profile.id;
        const nickname = profile.displayName;
        const image = profile.photos[0].value;
        const jwt = await this.authService.oauthLogin(email, id, nickname, OAuthProvider.FACEBOOK, image);
        if (jwt) done(null, jwt);
        else {
            done(null, false);
            throw new UnauthorizedException(new ErrorInfo('NE004', 'NEI0028', '페이스북으로 로그인 실패'))
        }
    }
}