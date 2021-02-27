import { Body, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guard/roles-guard';
import { UserIsUserGuard } from 'src/auth/guard/user-is-user-guard';
import { AuthService } from 'src/auth/service/auth.service';
import { UserCreateDto, UserLikeDto, UserUpdateDto, UserUpdateRoleDto } from 'src/user/model/user.dto';
import { User } from 'src/user/model/user.entity';
import { Role } from './model/user.interface';
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

    @UseGuards(AuthGuard('jwt'))
    @Post('/likes/user')
    likeUser(@Body() likeDto: UserLikeDto, @Request() request): Promise<User> {
        const userId = request.user.id;
        return this.userService.likeUser(userId, likeDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('/likes/product')
    likeProduct(@Body() likeDto: UserLikeDto, @Request() request): Promise<User> {
        const userId = request.user.id;
        return this.userService.likeProduct(userId, likeDto);
    }

    @Get(':id')
    async findOne(@Param('id') id: number): Promise<User> {
        const user = await this.authService.findById(id);
        if (!user) throw new NotFoundException()
        return user;
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('/user/current')
    async getCurrentUser(@Request() request): Promise<User> {
        const userId = request.user.id;
        const user = await this.authService.findById(userId);
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
