import { Body, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guard/roles-guard';
import { Coupon } from 'src/user/model/user.entity';
import { CouponService } from './coupon.service';
import { CouponAddToUserDto, CouponCreateDto, CouponSearchDto, CouponUpdateDto } from './model/user.dto';
import { Role } from './model/user.interface';

@Controller('api/coupons')
export class CouponController {
    constructor(
        private couponService: CouponService
    ) { }

    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Post('')
    create(@Body() coupon: CouponCreateDto): Promise<Coupon> {
        return this.couponService.create(coupon);
    }

    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Get(':id')
    async findOne(@Param('id') id: number): Promise<Coupon> {
        const coupon = await this.couponService.findById(id);
        if (!coupon) throw new NotFoundException()
        return coupon;
    }

    @Get('')
    search(@Query() search: CouponSearchDto): Promise<Pagination<Coupon>> {
        let limit = search.limit;
        limit = limit > 100 ? 100 : limit;
        return this.couponService.search(search);
    }

    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Post('/user')
    addCouponToUser(@Body() dto: CouponAddToUserDto): Promise<any> {
        try {
            return this.couponService.addCouponToUser(dto);
        } catch {
            throw new InternalServerErrorException();
        }
    }

    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Put(':id')
    updateOne(@Param('id') id: number, @Body() coupon: CouponUpdateDto): Promise<any> {
        try {
            return this.couponService.updateOne(id, coupon);
        } catch {
            throw new InternalServerErrorException();
        }
    }

    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Delete(':id')
    deleteOne(@Param('id') id: number): Promise<any> {
        try {
            return this.couponService.deleteOne(id);
        } catch {
            throw new InternalServerErrorException();
        }
    }
}
