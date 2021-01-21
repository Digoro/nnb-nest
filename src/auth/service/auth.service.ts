import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable } from 'rxjs';
import { UserCreateDto, UserLoginDto, UserUpdateDto, UserUpdateRoleDto } from 'src/user/model/user.dto';
import { User } from 'src/user/model/user.entity';
import { Repository } from 'typeorm';
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
        @InjectRepository(User) private userRepository: Repository<User>,
        private jwtService: JwtService,
    ) { }

    async create(userDto: UserCreateDto): Promise<User> {
        const find = await this.findByEmail(userDto.email);
        if (find) throw new BadRequestException('already exist email');
        const user = await this.userRepository.save(this.userRepository.create(userDto));
        return await this.findById(user.id)
    }

    async findById(id: number): Promise<User> {
        return await this.userRepository.findOne(id);
    }

    async findByEmail(email: string): Promise<User> {
        return await this.userRepository.findOne({ email });
    }

    async login(userDto: UserLoginDto): Promise<string> {
        const user = await this.findByEmail(userDto.email);
        if (!user) throw new UnauthorizedException();
        const match = await this.comparePassword(userDto.password, user.password);
        if (!match) throw new UnauthorizedException();
        return await this.generateJWT(user);
    }

    async validateOAuthLogin(email: string, thirdPartyId: string, provider: Provider): Promise<string> {
        const user = await this.findByEmail(email);
        return this.generateJWT(user);
    }

    async update<T>(id: number, userForUpdate: T) {
        const user = await this.findById(id);
        return this.userRepository.save(Object.assign(user, userForUpdate))
    }

    async updateOne(id: number, user: UserUpdateDto): Promise<any> {
        // const find = await this.findByEmail(user.email);
        // if (find) throw new BadRequestException('already exist email');
        return await this.update(id, user)
    }

    async updateRoleOfUser(id: number, user: UserUpdateRoleDto): Promise<any> {
        return await this.update(id, user);
    }

    async generateJWT(user: User): Promise<string> {
        delete user.password;
        return await this.jwtService.signAsync({ ...user });
    }

    async comparePassword(newPassword: string, passwordHash: string): Promise<boolean> {
        return await bcrypt.compare(newPassword, passwordHash);
    }

    checkJWT(req): Observable<any> {
        return req.user;
    }
}
