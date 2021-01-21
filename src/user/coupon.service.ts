import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';
import { CouponCreateDto, CouponUpdateDto } from './model/user.dto';
import { Coupon } from './model/user.entity';

@Injectable()
export class CouponService {
    constructor(
        @InjectRepository(Coupon) private couponRepository: Repository<Coupon>
    ) { }

    async create(couponDto: CouponCreateDto): Promise<Coupon> {
        const coupon = couponDto.toEntity();
        const newCoupon = await this.couponRepository.save(coupon);
        return newCoupon;
    }

    async paginateAll(options: IPaginationOptions): Promise<Pagination<Coupon>> {
        return await paginate<Coupon>(this.couponRepository, options)
    }

    async findById(id: number): Promise<Coupon> {
        return await this.couponRepository.findOne({ id });
    }

    private async update<T>(id: number, couponForUpdate: T): Promise<any> {
        const coupon = await this.findById(id);
        return await this.couponRepository.save(Object.assign(coupon, couponForUpdate))
    }

    async updateOne(id: number, couponDto: CouponUpdateDto): Promise<any> {
        return await this.update(id, couponDto);
    }

    async deleteOne(id: number): Promise<any> {
        return await this.couponRepository.delete(id);
    }
}
