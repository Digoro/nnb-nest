import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UserEntity } from 'src/user/model/user.entity';
import { User } from 'src/user/model/user.interface';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';

@Injectable()
export class UserSecurityService {
    constructor(
        @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
        private authService: AuthService
    ) { }

    withoutPassword(user: User): User {
        delete user.password;
        return user;
    }

    create(user: User): Observable<User> {
        const passwordHash = this.authService.hashPassword(user.password);
        console.log(passwordHash);
        const newUser = new UserEntity();
        newUser.name = user.name;
        newUser.email = user.email;
        newUser.role = user.role;
        newUser.password = passwordHash;
        return from(this.userRepository.save(newUser)).pipe(
            map(this.withoutPassword),
            catchError(err => throwError(err))
        )
    }

    findById(id: number): Observable<User> {
        return from(this.userRepository.findOne(id)).pipe(
            map(this.withoutPassword)
        );
    }

    login(user: User): Observable<string> {
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
        return from(this.userRepository.findOne({ email })).pipe(
            switchMap((user: User) => this.authService.comparePassword(password, user.password).pipe(
                map((match: boolean) => {
                    if (match) {
                        return this.withoutPassword(user);
                    } else {
                        throw Error;
                    }
                })
            ))
        )
    }
}
