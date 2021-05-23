import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guard/roles-guard';
import { ErrorInfo } from 'src/shared/model/error-info';
import { Coupon } from 'src/user/model/user.entity';
import { CouponService } from './coupon.service';
import { CouponAddByCodeDto, CouponAddToUserDto, CouponCreateDto, CouponSearchDto, CouponUpdateDto } from './model/user.dto';
import { Role } from './model/user.interface';

@ApiTags('coupons')
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
        if (!coupon) throw new NotFoundException(new ErrorInfo('NE001', 'NEI0001', '존재하지 않습니다.'));
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
        return this.couponService.addCouponToUser(dto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('/code')
    addCouponByCode(@Body() dto: CouponAddByCodeDto, @Request() request): Promise<any> {
        const userId = request.user.id;
        return this.couponService.addCouponByCode(userId, dto);
    }

    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Put(':id')
    updateOne(@Param('id') id: number, @Body() coupon: CouponUpdateDto): Promise<any> {
        return this.couponService.updateOne(id, coupon);
    }

    @Roles(Role.ADMIN)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Delete(':id')
    deleteOne(@Param('id') id: number): Promise<any> {
        return this.couponService.deleteOne(id);
    }
}
