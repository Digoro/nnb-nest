import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { IPaginationOptions } from 'nestjs-typeorm-paginate/dist/interfaces';
import { UserEntity } from 'src/user/model/user.entity';
import { Like, Repository } from 'typeorm';
import { User } from './model/user.interface';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>
    ) { }

    async paginateAll(options: IPaginationOptions): Promise<Pagination<User>> {
        return await paginate<User>(this.userRepository, options)
    }

    async paginateByUsername(options: IPaginationOptions, name: string): Promise<Pagination<User>> {
        return await paginate(this.userRepository, options, { where: [{ name: Like(`%${name}%`) }] })
    }

    async deleteOne(id: number): Promise<any> {
        return await this.userRepository.delete(id);
    }
}
