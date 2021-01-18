import { Body, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guard/roles-guard';
import { AuthService } from 'src/auth/service/auth.service';
import { UserIsUserGuard } from '../auth/guard/user-is-user-guard';
import { UserCreateDto, UserUpdateDto, UserUpdateRoleDto } from './model/user.dto';
import { Role, User } from './model/user.interface';
import { UserService } from './user.service';

@Controller('api/users')
export class UserController {
    constructor(
        private userService: UserService,
        private authService: AuthService
    ) { }

    @Post('')
    create(@Body() user: UserCreateDto): Promise<User> {
        return this.authService.create(user);
    }

    @Get(':id')
    async findOne(@Param('id') id: number): Promise<User> {
        const user = await this.authService.findById(id);
        if (!user) throw new NotFoundException()
        return user;
    }

    @Get('')
    index(@Query('page') page: number = 1, @Query('limit') limit: number = 10, @Query('name') name: string): Promise<Pagination<User>> {
        limit = limit > 100 ? 100 : limit;
        if (name === null || name === undefined) {
            return this.userService.paginateAll({ page, limit });
        } else {
            return this.userService.paginateByUsername({ page, limit }, name)
        }
    }

    @UseGuards(AuthGuard('jwt'), UserIsUserGuard)
    @Delete(':id')
    deleteOne(@Param('id') id: number): Promise<any> {
        return this.userService.deleteOne(id);
    }

    @UseGuards(AuthGuard('jwt'), UserIsUserGuard)
    @Put(':id')
    updateOne(@Param('id') id: number, @Body() user: UserUpdateDto): Promise<any> {
        try {
            return this.authService.updateOne(id, user);
        } catch {
            throw new InternalServerErrorException();
        }
    }

    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Put(':id/role')
    updateRoleOfUser(@Param('id') id: number, @Body() user: UserUpdateRoleDto): Promise<User> {
        return this.authService.updateRoleOfUser(id, user);
    }
}
