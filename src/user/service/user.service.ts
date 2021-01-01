import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { from, Observable } from 'rxjs';
import { UserEntity } from 'src/user/model/user.entity';
import { Like, Repository } from 'typeorm';
import { User } from '../model/user.interface';
import { IPaginationOptions } from './../../../node_modules/nestjs-typeorm-paginate/dist/interfaces/index.d';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>
    ) { }

    paginateAll(options: IPaginationOptions): Observable<Pagination<User>> {
        return from(paginate<User>(this.userRepository, options))
    }

    paginateByUsername(options: IPaginationOptions, name: string): Observable<Pagination<User>> {
        return from(paginate(this.userRepository, options, {
            where: [
                { name: Like(`%${name}%`) }
            ]
        }))
    }

    deleteOne(id: number): Observable<any> {
        return from(this.userRepository.delete(id));
    }
}
