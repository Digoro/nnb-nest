import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Like, Repository } from 'typeorm';
import { UserEntity } from './model/user.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>
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
}
