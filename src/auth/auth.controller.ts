import { Body, Controller, Get, Post, Query, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, Provider } from 'src/auth/service/auth.service';
import { UserLoginDto } from 'src/user/model/user.dto';

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
    @UseGuards(AuthGuard(Provider.GOOGLE))
    googleAuth() { }

    @UseGuards(AuthGuard('jwt'))
    @Get('success')
    success() {
        return 'success';
    }

    @Get('fail')
    fail() {
        return 'fail';
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req, @Res() res): Promise<any> {
        try {
            const user = await req.user;
            console.log(user);
            res.redirect('/success');
        } catch (err) {
            console.log(err);
            res.redirect('/fail');
            return err;
        }
    }

    @Get('login/kakao')
    @UseGuards(AuthGuard('kakao'))
    kakaoAuth(@Req() req) { }

    @Get('kakao/callback')
    @UseGuards(AuthGuard('kakao'))
    kakaoAuthRedirect(@Req() req) {
        return this.authService.checkJWT(req)
    }

    @Get('login/naver')
    @UseGuards(AuthGuard('naver'))
    naverAuth(@Req() req) { }

    @Get('naver/callback')
    @UseGuards(AuthGuard('naver'))
    naverAuthRedirect(@Req() req) {
        return this.authService.checkJWT(req)
    }

    @Get('login/facebook')
    @UseGuards(AuthGuard('facebook'))
    facebookAuth(@Req() req) { }

    @Get('facebook/callback')
    @UseGuards(AuthGuard('facebook'))
    facebookAuthRedirect(@Req() req) {
        return this.authService.checkJWT(req)
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('sms')
    requestAuthSms(@Body() body: any): Promise<boolean> {
        return this.authService.requestAuthSms(body.phoneNumber)
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('sms')
    checkAuthSms(@Query('phoneNumber') phoneNumber: string, @Query('authNumber') authNumber: string,): Promise<boolean> {
        return this.authService.checkAuthSms(phoneNumber, authNumber);
    }
}
