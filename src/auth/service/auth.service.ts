import { BadRequestException, HttpService, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as FormData from 'form-data';
import { Observable } from 'rxjs';
import { UserCreateDto, UserLoginDto, UserUpdateDto, UserUpdateRoleDto } from 'src/user/model/user.dto';
import { User } from 'src/user/model/user.entity';
import { MoreThan, Repository } from 'typeorm';
import { AuthSms } from './../model/auth.entity';
const bcrypt = require('bcrypt');
const moment = require('moment')

export enum Provider {
    GOOGLE = 'google',
    FACEBOOK = 'facebook',
    KAKAO = 'kakao',
    NAVER = 'naver'
}

@Injectable()
export class AuthService {
    private sms_api_key: string;
    private sms_user_id: string;
    private sms_sender_phone: string;
    private sms_url = "https://apis.aligo.in/send/";

    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(AuthSms) private authSmsRepository: Repository<AuthSms>,
        private jwtService: JwtService,
        private http: HttpService,
        private configService: ConfigService
    ) {
        this.sms_api_key = configService.get("SMS_API_KEY");
        this.sms_user_id = configService.get("SMS_USER_ID");
        this.sms_sender_phone = configService.get("SMS_SENDER_PHONE");
    }

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

    makeRandomNumber(): string {
        var result = Math.floor(Math.random() * 10000) + 1000;
        if (result > 10000) result = result - 1000
        return `${result}`;
    }

    async updateAuthSms(id: number, update: AuthSms) {
        const authSms = await this.authSmsRepository.findOne(id);
        return await this.authSmsRepository.save(Object.assign(authSms, update))
    }

    async requestAuthSms(phoneNumber: string): Promise<boolean> {
        const temp = await this.authSmsRepository.findOne({ phoneNumber });
        const authNumber = this.makeRandomNumber();
        if (temp) {
            temp.phoneNumber = phoneNumber;
            temp.authNumber = authNumber;
            await this.updateAuthSms(temp.id, temp)
        } else {
            const authSms = new AuthSms();
            authSms.phoneNumber = phoneNumber;
            authSms.authNumber = authNumber;
            await this.authSmsRepository.save(authSms);
        }
        return await this.sendSms(phoneNumber, authNumber);
    }

    async sendSms(phoneNumber: string, authNumber: string) {
        const form = new FormData();
        form.append('key', this.sms_api_key)
        form.append('userid', this.sms_user_id)
        form.append('msg', `노는법 인증 번호 ${authNumber}를 입력해주세요.`)
        form.append('sender', this.sms_sender_phone)
        form.append('receiver', phoneNumber)
        const result = await this.http.post(this.sms_url, form, { headers: form.getHeaders() }).toPromise();
        if (result.data.result_code === -101) {
            throw new InternalServerErrorException();
        }
        return true;
    }

    async checkAuthSms(phoneNumber: string, authNumber: string): Promise<boolean> {
        const time = moment().subtract(5, 'minute').format('YYYY-MM-DD HH:mm:ss')
        const authSms = await this.authSmsRepository.findOne({ phoneNumber, authNumber, updatedAt: MoreThan(time) });
        return !!authSms;
    }
}
