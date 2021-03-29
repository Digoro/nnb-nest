import { Body, Controller, Get, Post, Put, Query, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, OAuthProvider } from 'src/auth/service/auth.service';
import { UserLoginDto } from 'src/user/model/user.dto';
import { User } from 'src/user/model/user.entity';
import { FindPassword } from './model/auth.entity';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService
    ) { }

    @Post('login')
    async login(@Body() user: UserLoginDto): Promise<Object> {
        try {
            const jwt = await this.authService.login(user);
            return { access_token: jwt };
        } catch {
            throw new UnauthorizedException();
        }
    }

    @Get('login/google')
    @UseGuards(AuthGuard(OAuthProvider.GOOGLE))
    googleAuth() { }

    @Get('google/callback')
    @UseGuards(AuthGuard(OAuthProvider.GOOGLE))
    async googleAuthRedirect(@Req() req, @Res() res): Promise<any> {
        return await this.redirect(res, req);
    }

    @Get('login/kakao')
    @UseGuards(AuthGuard(OAuthProvider.KAKAO))
    kakaoAuth(@Req() req) { }

    @Get('kakao/callback')
    @UseGuards(AuthGuard(OAuthProvider.KAKAO))
    async kakaoAuthRedirect(@Req() req, @Res() res) {
        return await this.redirect(res, req);
    }

    @Get('login/naver')
    @UseGuards(AuthGuard(OAuthProvider.NAVER))
    naverAuth(@Req() req) { }

    @Get('naver/callback')
    @UseGuards(AuthGuard(OAuthProvider.NAVER))
    async naverAuthRedirect(@Req() req, @Res() res) {
        return await this.redirect(res, req);
    }

    @Get('login/facebook')
    @UseGuards(AuthGuard(OAuthProvider.FACEBOOK))
    facebookAuth(@Req() req) { }

    @Get('facebook/callback')
    @UseGuards(AuthGuard(OAuthProvider.FACEBOOK))
    async facebookAuthRedirect(@Req() req, @Res() res) {
        return await this.redirect(res, req);
    }

    async redirect(res, req) {
        try {
            const user = await req.user;
            res.cookie('access_token', user)
            res.redirect('http://localhost:8080');
        } catch (err) {
            res.redirect('http://localhost:8080/tabs/login');
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
}
