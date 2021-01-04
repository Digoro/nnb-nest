import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { User } from 'src/user/model/user.interface';
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

    validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Observable<any> {
        const email = profile.emails[0].value;
        return this.authService.findWithPasswordByEmail(email).pipe(
            switchMap((user: User) => {
                return this.authService.generateJWT(user).pipe(
                    map(jwt => {
                        return { user, access_token: jwt }
                    })
                )
            }),
            catchError(err => {
                return throwError(new UnauthorizedException())
            })
        )
    }
}