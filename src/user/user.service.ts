import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Like, Repository } from 'typeorm';
import { UserLikeDto } from './model/user.dto';
import { UserEntity, UserProductLikeEntity, UserUserLikeEntity } from './model/user.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
        @InjectRepository(UserProductLikeEntity) private userProductLikeRepository: Repository<UserProductLikeEntity>,
        @InjectRepository(UserUserLikeEntity) private userUserLikeRepository: Repository<UserUserLikeEntity>
    ) { }

    async paginateAll(options: IPaginationOptions): Promise<Pagination<UserEntity>> {
        return await paginate<UserEntity>(this.userRepository, options)
    }

    async paginateByUsername(options: IPaginationOptions, name: string): Promise<Pagination<UserEntity>> {
        return await paginate(this.userRepository, options, { where: [{ name: Like(`%${name}%`) }] })
    }

    async deleteOne(id: number): Promise<any> {
        return await this.userRepository.delete(id);
    }

    async likeProduct(userId: number, likeDto: UserLikeDto): Promise<any> {
        if (likeDto.isLike) {
            return await this.userProductLikeRepository.save({ userId, productId: likeDto.id })
        } else {
            const like = await this.userProductLikeRepository.findOne({ userId, productId: likeDto.id });
            if (like) {
                return await this.userProductLikeRepository.delete({ id: like.id })
            }
        }
    }

    async likeUser(userId: number, likeDto: UserLikeDto): Promise<any> {
        if (likeDto.isLike) {
            return await this.userUserLikeRepository.save({ followingId: userId, followedId: likeDto.id })
        } else {
            const like = await this.userUserLikeRepository.findOne({ followingId: userId, followedId: likeDto.id });
            if (like) {
                return await this.userUserLikeRepository.delete({ id: like.id })
            }
        }
    }
}
