import { Body, Controller, Get, Post, Put, Query, Request, Response, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { AuthService, OAuthProvider } from 'src/auth/service/auth.service';
import { ErrorInfo } from 'src/shared/model/error-info';
import { UserLoginDto } from 'src/user/model/user.dto';
import { User } from 'src/user/model/user.entity';
import { UserIsUserGuard } from './guard/user-is-user-guard';
import { FindPassword } from './model/auth.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private configService: ConfigService
    ) { }

    @Post('login')
    async login(@Body() user: UserLoginDto, @Request() request) {
        try {
            const jwt = await this.authService.login(user);
            return { access_token: jwt }
        } catch {
            throw new UnauthorizedException(new ErrorInfo('NE004', 'NEI0014', '로그인에 실패하였습니다. 입력 정보를 다시 확인해주세요.'));
        }
    }

    @Get('login/google/:previousUrl')
    @UseGuards(AuthGuard(OAuthProvider.GOOGLE))
    googleAuth() { }

    @Get('google/callback')
    @UseGuards(AuthGuard(OAuthProvider.GOOGLE))
    async googleAuthRedirect(@Request() request, @Response() response): Promise<any> {
        return await this.redirect(request, response);
    }

    @Get('login/kakao/:previousUrl')
    @UseGuards(AuthGuard(OAuthProvider.KAKAO))
    kakaoAuth(@Request() request) { }

    @Get('kakao/callback')
    @UseGuards(AuthGuard(OAuthProvider.KAKAO))
    async kakaoAuthRedirect(@Request() request, @Response() response) {
        return await this.redirect(request, response);
    }

    @Get('login/naver/:previousUrl')
    @UseGuards(AuthGuard(OAuthProvider.NAVER))
    naverAuth(@Request() request) { }

    @Get('naver/callback')
    @UseGuards(AuthGuard(OAuthProvider.NAVER))
    async naverAuthRedirect(@Request() request, @Response() response) {
        return await this.redirect(request, response);
    }

    @Get('login/facebook/:previousUrl')
    @UseGuards(AuthGuard(OAuthProvider.FACEBOOK))
    facebookAuth(@Request() request) { }

    @Get('facebook/callback')
    @UseGuards(AuthGuard(OAuthProvider.FACEBOOK))
    async facebookAuthRedirect(@Request() request, @Response() response) {
        return await this.redirect(request, response);
    }

    setCookie(token: string, res) {
        const weekMillis = '604800000'
        res.cookie('access_token', token, { maxAge: weekMillis })
    }

    async redirect(request, response) {
        try {
            const user = await request.user;
            const jwt = user.jwt;
            const isMember = user.isMember;
            const host = this.configService.get('SITE_HOST');
            this.setCookie(jwt, response);

            const prevPath = request.prevPath;
            if (prevPath) {
                const splited = request.prevPath.split("/");
                const encodedUrl = splited[splited.length - 1];
                const previousUrl = decodeURIComponent(encodedUrl)
                if (isMember) response.redirect(previousUrl);
                else response.redirect(`${this.configService.get('SITE_HOST')}/tabs/need-user-info/${encodedUrl}`);
            } else {
                if (isMember) response.redirect(`${host}/tabs/home`);
                else response.redirect(`${host}/tabs/need-user-info/${encodeURIComponent(host)}`);
            }
        } catch (err) {
            response.redirect(`${this.configService.get('SITE_HOST')}/tabs/login`);
        }
    }

    @Post('sms')
    requestAuthSms(@Body() body: any): Promise<boolean> {
        return this.authService.requestAuthSms(body.phoneNumber)
    }

    @Get('sms')
    checkAuthSms(@Query('phoneNumber') phoneNumber: string, @Query('authNumber') authNumber: string,): Promise<boolean> {
        return this.authService.checkAuthSms(phoneNumber, authNumber);
    }

    @Post('find-password')
    findPassword(@Body() body: any): Promise<FindPassword> {
        return this.authService.sendFindPasswordMail(body.email);
    }

    @Put('reset-password')
    resetPassword(@Body() body: { validationCode: string, password: string }): Promise<User> {
        return this.authService.resetPassword(body.validationCode, body.password);
    }

    @UseGuards(AuthGuard('jwt'), UserIsUserGuard)
    @Get('token/:id')
    async updateToken(@Request() request): Promise<any> {
        const userId = request.user.id;
        const user = await this.authService.findById(userId);
        const token = await this.authService.generateJWT(user);
        return { accessToken: token };
    }
}
