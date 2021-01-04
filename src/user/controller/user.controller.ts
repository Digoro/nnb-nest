import { Body, Controller, Delete, Get, HttpException, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guard/roles-guard';
import { AuthService } from 'src/auth/service/auth.service';
import { UserCreateDto, UserLoginDto, UserUpdateDto, UserUpdateRoleDto } from '../model/user.dto';
import { Role, User } from '../model/user.interface';
import { UserService } from '../service/user.service';
import { UserIsUserGuard } from './../../auth/guard/user-is-user-guard';

@Controller('')
export class UserController {
    constructor(
        private userService: UserService,
        private authService: AuthService
    ) { }

    @Post('login')
    login(@Body() user: UserLoginDto): Observable<Object> {
        return this.authService.login(user).pipe(
            map((jwt: string) => {
                return { access_token: jwt };
            }),
            catchError(err => {
                throw new HttpException('Unauthorized', 401);
            })
        )
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
    googleAuthRedirect(@Req() req, @Res() res): Observable<any> {
        return req.user.pipe(
            map(user => {
                console.log(user);
                res.redirect('/success');
            }),
            catchError(err => {
                console.log(err);
                res.redirect('/fail');
                return err;
            })
        )
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
    create(@Body() user: UserCreateDto): Observable<User | Object> {
        return this.authService.create(user).pipe(
            catchError(err => of({ error: err.message }))
        );
    }

    @Get('users/:id')
    findOne(@Param('id') id: number): Observable<User> {
        return this.authService.findById(id);
    }

    @Get('users')
    index(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('name') name: string
    ): Observable<Pagination<User>> {
        limit = limit > 100 ? 100 : limit;

        if (name === null || name === undefined) {
            return this.userService.paginateAll({ page: Number(page), limit: Number(limit), route: 'http://localhost:3000/api/users' });
        } else {
            return this.userService.paginateByUsername(
                { page: Number(page), limit: Number(limit), route: 'http://localhost:3000/api/users' },
                name
            )
        }
    }

    @UseGuards(AuthGuard('jwt'), UserIsUserGuard)
    @Delete('users/:id')
    deleteOne(@Param('id') id: number): Observable<any> {
        return this.userService.deleteOne(id);
    }

    @UseGuards(AuthGuard('jwt'), UserIsUserGuard)
    @Put('users/:id')
    updateOne(@Param('id') id: number, @Body() user: UserUpdateDto): Observable<any> {
        return this.authService.updateOne(id, user);
    }

    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Put('users/:id/role')
    updateRoleOfUser(@Param('id') id: number, @Body() user: UserUpdateRoleDto): Observable<User> {
        return this.authService.updateRoleOfUser(id, user);
    }
}
