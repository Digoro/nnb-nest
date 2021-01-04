import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UserCreateDto, UserLoginDto, UserUpdateDto, UserUpdateRoleDto } from 'src/user/model/user.dto';
import { UserEntity } from 'src/user/model/user.entity';
import { Role } from 'src/user/model/user.interface';
import { getRepository, Repository } from 'typeorm';
import { User } from './../../user/model/user.interface';
const bcrypt = require('bcrypt');

export enum Provider {
    GOOGLE = 'google',
    FACEBOOK = 'facebook',
    KAKAO = 'kakao',
    NAVER = 'naver'
}

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
        private configService: ConfigService,
        private jwtService: JwtService,
    ) { }

    create(user: UserCreateDto): Observable<User> {
        const passwordHash = this.hashPassword(user.password);
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

    findByEmail(email: string): Observable<User> {
        return from(this.userRepository.findOne({ email })).pipe(
            map((user: User) => {
                if (user) return user;
                else throw new UnauthorizedException();
            })
        );
    }

    findWithPasswordByEmail(email: string): Observable<User> {
        return from(getRepository(UserEntity)
            .createQueryBuilder("user")
            .addSelect('user.password')
            .where("user.email = :email", { email })
            .getOne()
        ).pipe(
            map((user: User) => {
                if (user) {
                    delete user.password;
                    return user;
                }
                else throw new UnauthorizedException();
            })
        )
    }

    login(user: UserLoginDto): Observable<string> {
        return this.validateUser(user.email, user.password).pipe(
            switchMap((user: User) => {
                return this.generateJWT(user);
            })
        )
    }

    validateUser(email: string, password: string): Observable<User> {
        return this.findWithPasswordByEmail(email).pipe(
            switchMap((user: User) => {
                return this.comparePassword(password, user.password).pipe(
                    map((match: boolean) => {
                        if (match) {
                            return user;
                        } else {
                            throw new UnauthorizedException();
                        }
                    })
                )
            })
        )
    }

    validateOAuthLogin(email: string, thirdPartyId: string, provider: Provider): Observable<string> {
        return this.findWithPasswordByEmail(email).pipe(
            switchMap((user: User) => {
                return this.generateJWT(user);
            })
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

    generateJWT(user: User): Observable<string> {
        return from(this.jwtService.signAsync({ user }));
    }

    hashPassword(password: string): string {
        return bcrypt.hashSync(password, 12)
    }

    comparePassword(newPassword: string, passwordHash: string): Observable<any | boolean> {
        return from<any | boolean>(bcrypt.compare(newPassword, passwordHash));
    }

    checkJWT(req): Observable<any> {
        return req.user;
    }
}
