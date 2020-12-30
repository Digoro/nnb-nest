import { Body, Controller, Delete, Get, HttpException, Param, Post, Put, UseGuards } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth-guard';
import { RolesGuard } from 'src/auth/guard/roles-guard';
import { UserSecurityService } from 'src/auth/service/user-security.service';
import { Role, User } from '../model/user.interface';
import { UserService } from '../service/user.service';

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

    @Roles(Role.Admin)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get()
    findAll(): Observable<User[]> {
        return this.userService.findAll();
    }

    @Delete('/:id')
    deleteOne(@Param('id') id: string): Observable<any> {
        return this.userService.deleteOne(+id);
    }

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
