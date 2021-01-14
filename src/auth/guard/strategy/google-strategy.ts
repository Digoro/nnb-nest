import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService, Provider } from '../../service/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, Provider.GOOGLE) {
    constructor(
        private authService: AuthService,
        private configService: ConfigService
    ) {
        super({
            clientID: configService.get('GOOGLE_CLIENT_ID'),
            clientSecret: configService.get('GOOGLE_CLIENT_SECRET_KEY'),
            callbackURL: 'http://localhost:3000/auth/google/callback',
            scope: ['email', 'profile']
        })
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
        const email = profile.emails[0].value;
        const jwt = await this.authService.validateOAuthLogin(email, profile.id, Provider.GOOGLE);
        if (jwt) done(null, jwt);
        else {
            done(null, false);
            throw new UnauthorizedException()
        }
    }
}