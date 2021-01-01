import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UserCreateDto, UserLoginDto, UserUpdateDto, UserUpdateRoleDto } from 'src/user/model/user.dto';
import { UserEntity } from 'src/user/model/user.entity';
import { Role, User } from 'src/user/model/user.interface';
import { getRepository, Repository } from 'typeorm';
import { AuthService } from './auth.service';

@Injectable()
export class UserSecurityService {
    constructor(
        @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
        private authService: AuthService
    ) { }

    create(user: UserCreateDto): Observable<User> {
        const passwordHash = this.authService.hashPassword(user.password);
        const newUser = new UserEntity();
        newUser.name = user.name;
        newUser.email = user.email;
        newUser.password = passwordHash;
        newUser.role = Role.USER;

        return from(this.userRepository.save(newUser)).pipe(
            switchMap((user: User) => {
                return this.findById(user.id)
            }),
            catchError(err => throwError(err))
        )
    }

    findById(id: number): Observable<User> {
        return from(this.userRepository.findOne(id));
    }

    login(user: UserLoginDto): Observable<string> {
        return this.validateUser(user.email, user.password).pipe(
            switchMap((user: User) => {
                if (user) {
                    return this.authService.generateJWT(user).pipe(map(jwt => jwt))
                } else {
                    return 'Wrong Credentials'
                }
            }),
            catchError(err => throwError(err))
        )
    }

    validateUser(email: string, password: string): Observable<User> {
        return from(getRepository(UserEntity)
            .createQueryBuilder("user")
            .addSelect('user.password')
            .where("user.email = :email", { email })
            .getOne()
        ).pipe(
            switchMap((user: User) => this.authService.comparePassword(password, user.password).pipe(
                map((match: boolean) => {
                    if (match) {
                        return user;
                    } else {
                        throw Error;
                    }
                })
            ))
        )
    }

    update<T>(id: number, userForUpdate: T) {
        return this.findById(id).pipe(
            switchMap(user => {
                return this.userRepository.save(Object.assign(user, userForUpdate))
            })
        )
    }

    updateOne(id: number, user: UserUpdateDto): Observable<any> {
        return this.update(id, user)
    }

    updateRoleOfUser(id: number, user: UserUpdateRoleDto): Observable<any> {
        return this.update(id, user);
    }
}
