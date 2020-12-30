import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Like, Repository } from 'typeorm';
import { UserEntity } from '../model/user.entity';
import { User } from '../model/user.interface';
import { IPaginationOptions } from './../../../node_modules/nestjs-typeorm-paginate/dist/interfaces/index.d';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>
    ) { }

    withoutPassword(user: User): User {
        delete user.password;
        return user;
    }

    findByEmail(email: string): Observable<User> {
        return from(this.userRepository.findOne({ email })).pipe(
            map(this.withoutPassword)
        );
    }

    findAll(): Observable<User[]> {
        return from(this.userRepository.find()).pipe(
            map(users => {
                return users.map(this.withoutPassword)
            })
        );
    }

    paginate(options: IPaginationOptions): Observable<Pagination<User>> {
        return from(paginate<User>(this.userRepository, options)).pipe(
            map((userPageable: Pagination<User>) => {
                userPageable.items.forEach(this.withoutPassword)
                return userPageable;
            })
        )
    }

    paginateFilterByUsername(options: IPaginationOptions, user: User): Observable<Pagination<User>> {
        return from(this.userRepository.findAndCount({
            skip: options.page * options.limit || 0,
            take: options.limit || 10,
            order: { id: "ASC" },
            select: ['id', 'name', 'email', 'role'],
            where: [
                { name: Like(`%${user.name}%`) }
            ]
        })).pipe(
            map(([users, totalUsers]) => {
                const usersPageable: Pagination<User> = {
                    items: users,
                    links: {
                        first: options.route + `?limit=${options.limit}`,
                        previous: options.route + ``,
                        next: options.route + `?limit=${options.limit}&page=${options.page + 1}`,
                        last: options.route + `?limit=${options.limit}&page=${Math.ceil(totalUsers / options.limit)}`
                    },
                    meta: {
                        currentPage: options.page,
                        itemCount: users.length,
                        itemsPerPage: options.limit,
                        totalItems: totalUsers,
                        totalPages: Math.ceil(totalUsers / options.limit)
                    }
                };
                return usersPageable;
            })
        )
    }

    deleteOne(id: number): Observable<any> {
        return from(this.userRepository.delete(id));
    }

    updateOne(id: number, user: User): Observable<any> {
        delete user.id;
        delete user.email;
        delete user.password;
        delete user.role;
        return from(this.userRepository.update(id, user));
    }

    updateRoleOfUser(id: number, user: User): Observable<any> {
        return from(this.userRepository.update(id, user));
    }
}
