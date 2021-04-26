import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ErrorInfo } from 'src/shared/model/error-info';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET')
        });
    }

    async validate(payload, done: Function) {
        try {
            // You could add a function to the authService to verify the claims of the token:
            // i.e. does the user still have the roles that are claimed by the token
            //const validClaims = await this.authService.verifyTokenClaims(payload);

            //if (!validClaims)
            //    return done(new UnauthorizedException('invalid token claims'), false);

            done(null, payload);
        }
        catch (err) {
            throw new UnauthorizedException(new ErrorInfo('NE004', 'NEI0026', '이메일로 로그인 실패'))
        }
    }
}