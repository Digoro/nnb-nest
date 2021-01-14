import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-facebook';
import { Provider } from 'src/auth/service/auth.service';
import { AuthService } from './../../service/auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, Provider.FACEBOOK) {
    constructor(
        private configService: ConfigService,
        private authService: AuthService
    ) {
        super({
            clientID: configService.get('FACEBOOK_CLIENT_ID'),
            clientSecret: configService.get('FACEBOOK_CLIENT_SECRET_KEY'),
            callbackURL: 'http://localhost:3000/auth/facebook/callback',
            profileFields: ['id', 'email', 'gender', 'link', 'locale', 'name', 'timezone', 'updated_time', 'verified', 'photos'],
        })
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
        const email = profile.emails[0].value;
        const jwt = await this.authService.validateOAuthLogin(email, profile.id, Provider.FACEBOOK);
        if (jwt) done(null, jwt);
        else {
            done(null, false);
            throw new UnauthorizedException()
        }
    }
}