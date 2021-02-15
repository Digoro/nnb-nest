import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';
import { CouponAddToUserDto, CouponCreateDto, CouponSearchDto, CouponUpdateDto } from './model/user.dto';
import { Coupon, UserCouponMap } from './model/user.entity';

@Injectable()
export class CouponService {
    constructor(
        @InjectRepository(Coupon) private couponRepository: Repository<Coupon>,
        @InjectRepository(UserCouponMap) private userCouponMapRepository: Repository<UserCouponMap>
    ) { }

    async create(couponDto: CouponCreateDto): Promise<Coupon> {
        const coupon = couponDto.toEntity();
        const newCoupon = await this.couponRepository.save(coupon);
        return newCoupon;
    }

    async search(search: CouponSearchDto): Promise<Pagination<Coupon>> {
        if (!search.isUsed) return await this.searchActive(search);
        else if (search.isUsed) return await this.searchDeactive(search);
        else return await this.searchAll(search);
    }

    async searchActive(search: CouponSearchDto): Promise<Pagination<Coupon>> {
        const options = { page: search.page, limit: search.limit };
        const coupons = await paginate<Coupon>(
            this.couponRepository
                .createQueryBuilder('coupon')
                .leftJoin(UserCouponMap, 'map', 'map.couponId = coupon.id')
                .where('map.userId = :userId', { userId: search.userId })
                .andWhere('coupon.expireDuration > :to', { to: search.expireDuration })
                .andWhere('coupon.isUsed = :isUsed', { isUsed: search.isUsed })
                .orderBy('coupon.createdAt', 'DESC')
            , options
        )
        return coupons;
    }

    async searchDeactive(search: CouponSearchDto): Promise<Pagination<Coupon>> {
        const options = { page: search.page, limit: search.limit };
        const coupons = await paginate<Coupon>(
            this.couponRepository
                .createQueryBuilder('coupon')
                .leftJoin(UserCouponMap, 'map', 'map.couponId = coupon.id')
                .where('map.userId = :userId', { userId: search.userId })
                .andWhere('coupon.isUsed = :isUsed', { isUsed: search.isUsed })
                .orWhere('coupon.expireDuration < :to', { to: search.expireDuration })
                .orderBy('coupon.createdAt', 'DESC')
            , options
        )
        return coupons;
    }

    async searchAll(search: CouponSearchDto): Promise<Pagination<Coupon>> {
        const options = { page: search.page, limit: search.limit };
        const coupons = await paginate<Coupon>(this.couponRepository, options)
        return coupons
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

    async addCouponToUser(dto: CouponAddToUserDto): Promise<any> {
        return await this.userCouponMapRepository.save(dto);
    }

    async deleteOne(id: number): Promise<any> {
        return await this.couponRepository.delete(id);
    }
}
