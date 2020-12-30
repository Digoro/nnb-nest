import { Body, Controller, Delete, Get, HttpException, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guard/roles-guard';
import { UserSecurityService } from 'src/auth/service/user-security.service';
import { Role, User } from '../model/user.interface';
import { UserService } from '../service/user.service';
import { JwtAuthGuard } from './../../auth/guard/jwt-auth-guard';
import { UserIsUserGuard } from './../../auth/guard/user-is-user-guard';

@Controller('users')
export class UserController {
    constructor(
        private userService: UserService,
        private userSecurityService: UserSecurityService
    ) { }

    @Post()
    create(@Body() user: User): Observable<User | Object> {
        return this.userSecurityService.create(user).pipe(
            map((user: User) => user),
            catchError(err => of({ error: err.message }))
        );
    }

    @Post('login')
    login(@Body() user: User): Observable<Object> {
        return this.userSecurityService.login(user).pipe(
            map((jwt: string) => {
                return { access_token: jwt };
            }),
            catchError(err => {
                throw new HttpException('Unauthorized', 401);
            })
        )
    }

    @Get(':id')
    findOne(@Param('id') id): Observable<User> {
        return this.userSecurityService.findById(+id);
    }

    @Get()
    index(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('name') name: string
    ): Observable<Pagination<User>> {
        limit = limit > 100 ? 100 : limit;

        if (name === null || name === undefined) {
            return this.userService.paginate({ page: Number(page), limit: Number(limit), route: 'http://localhost:3000/api/users' });
        } else {
            return this.userService.paginateFilterByUsername(
                { page: Number(page), limit: Number(limit), route: 'http://localhost:3000/api/users' },
                { name }
            )
        }
    }

    @Delete('/:id')
    deleteOne(@Param('id') id: string): Observable<any> {
        return this.userService.deleteOne(+id);
    }

    @UseGuards(JwtAuthGuard, UserIsUserGuard)
    @Put(':id')
    updateOne(@Param('id') id, @Body() user: User): Observable<any> {
        return this.userService.updateOne(+id, user);
    }

    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Put(':id/role')
    updateRoleOfUser(@Param('id') id: string, @Body() user: User): Observable<User> {
        return this.userService.updateRoleOfUser(+id, user);
    }
}
