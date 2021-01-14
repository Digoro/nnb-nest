import { Body, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Param, Post, Put, Query, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guard/roles-guard';
import { AuthService } from 'src/auth/service/auth.service';
import { UserIsUserGuard } from '../auth/guard/user-is-user-guard';
import { UserCreateDto, UserLoginDto, UserUpdateDto, UserUpdateRoleDto } from './model/user.dto';
import { Role, User } from './model/user.interface';
import { UserService } from './user.service';

@Controller('')
export class UserController {
    constructor(
        private userService: UserService,
        private authService: AuthService
    ) { }

    @Post('login')
    async login(@Body() user: UserLoginDto): Promise<Object> {
        try {
            const jwt = await this.authService.login(user);
            return { accessToken: jwt };
        } catch {
            throw new UnauthorizedException();
        }
    }


    @Get('login/google')
    @UseGuards(AuthGuard('google'))
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

    @Get('auth/google/callback')
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

    @Get('auth/kakao/callback')
    @UseGuards(AuthGuard('kakao'))
    kakaoAuthRedirect(@Req() req) {
        return this.authService.checkJWT(req)
    }

    @Get('login/naver')
    @UseGuards(AuthGuard('naver'))
    naverAuth(@Req() req) { }

    @Get('auth/naver/callback')
    @UseGuards(AuthGuard('naver'))
    naverAuthRedirect(@Req() req) {
        return this.authService.checkJWT(req)
    }

    @Get('login/facebook')
    @UseGuards(AuthGuard('facebook'))
    facebookAuth(@Req() req) { }

    @Get('auth/facebook/callback')
    @UseGuards(AuthGuard('facebook'))
    facebookAuthRedirect(@Req() req) {
        return this.authService.checkJWT(req)
    }

    @Post('users')
    create(@Body() user: UserCreateDto): Promise<User> {
        return this.authService.create(user);
    }

    @Get('users/:id')
    async findOne(@Param('id') id: number): Promise<User> {
        const user = await this.authService.findById(id);
        if (!user) throw new NotFoundException()
        return user;
    }

    @Get('users')
    index(@Query('page') page: number = 1, @Query('limit') limit: number = 10, @Query('name') name: string): Promise<Pagination<User>> {
        limit = limit > 100 ? 100 : limit;
        if (name === null || name === undefined) {
            return this.userService.paginateAll({ page, limit });
        } else {
            return this.userService.paginateByUsername({ page, limit }, name)
        }
    }

    @UseGuards(AuthGuard('jwt'), UserIsUserGuard)
    @Delete('users/:id')
    deleteOne(@Param('id') id: number): Promise<any> {
        return this.userService.deleteOne(id);
    }

    @UseGuards(AuthGuard('jwt'), UserIsUserGuard)
    @Put('users/:id')
    updateOne(@Param('id') id: number, @Body() user: UserUpdateDto): Promise<any> {
        try {
            return this.authService.updateOne(id, user);
        } catch {
            throw new InternalServerErrorException();
        }
    }

    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Put('users/:id/role')
    updateRoleOfUser(@Param('id') id: number, @Body() user: UserUpdateRoleDto): Promise<User> {
        return this.authService.updateRoleOfUser(id, user);
    }
}
