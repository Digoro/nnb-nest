import { Body, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guard/roles-guard';
import { CouponEntity } from 'src/user/model/user.entity';
import { CouponService } from './coupon.service';
import { CouponCreateDto, CouponUpdateDto } from './model/user.dto';
import { Role } from './model/user.interface';

@Controller('api/coupons')
export class CouponController {
    constructor(
        private couponService: CouponService
    ) { }

    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Post('')
    create(@Body() coupon: CouponCreateDto): Promise<CouponEntity> {
        return this.couponService.create(coupon);
    }

    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Get(':id')
    async findOne(@Param('id') id: number): Promise<CouponEntity> {
        const coupon = await this.couponService.findById(id);
        if (!coupon) throw new NotFoundException()
        return coupon;
    }

    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Get('')
    index(@Query('page') page: number = 1, @Query('limit') limit: number = 10): Promise<Pagination<CouponEntity>> {
        limit = limit > 100 ? 100 : limit;
        return this.couponService.paginateAll({ page, limit });
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
        return this.couponService.deleteOne(id);
    }
}
