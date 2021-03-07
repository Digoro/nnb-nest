import { BadRequestException, HttpService, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as FormData from 'form-data';
import { Observable } from 'rxjs';
import { Error } from 'src/shared/model/error';
import { UserCreateDto, UserLoginDto, UserUpdateDto, UserUpdateRoleDto } from 'src/user/model/user.dto';
import { User } from 'src/user/model/user.entity';
import { getConnection, MoreThan, Repository } from 'typeorm';
import { MailService } from './../../shared/service/mail.service';
import { AuthSms, FindPassword } from './../model/auth.entity';
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
    private SMS_API_KEY: string;
    private SMS_USER_ID: string;
    private SMS_SENDER_PHONE: string;
    private SMS_URL = "https://apis.aligo.in/send/";

    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(AuthSms) private authSmsRepository: Repository<AuthSms>,
        @InjectRepository(FindPassword) private findPasswordRepository: Repository<FindPassword>,
        private jwtService: JwtService,
        private http: HttpService,
        private configService: ConfigService,
        private mailService: MailService
    ) {
        this.SMS_API_KEY = configService.get("SMS_API_KEY");
        this.SMS_USER_ID = configService.get("SMS_USER_ID");
        this.SMS_SENDER_PHONE = configService.get("SMS_SENDER_PHONE");
    }

    async create(userDto: UserCreateDto): Promise<User> {
        const findEmail = await this.findByEmail(userDto.email);
        if (findEmail) throw new BadRequestException(new Error('WUSER1005', '이미 해당 이메일이 존재합니다.'));
        const findPhone = await this.userRepository.findOne({ phoneNumber: userDto.phoneNumber });
        if (findPhone) throw new BadRequestException(new Error('WUSER1006', '이미 해당 휴대폰 번호가 존재합니다.'));
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
        form.append('key', this.SMS_API_KEY)
        form.append('userid', this.SMS_USER_ID)
        form.append('msg', `노는법 인증 번호 ${authNumber}를 입력해주세요.`)
        form.append('sender', this.SMS_SENDER_PHONE)
        form.append('receiver', phoneNumber)
        const result = await this.http.post(this.SMS_URL, form, { headers: form.getHeaders() }).toPromise();
        if (result.data.result_code === -101) {
            throw new InternalServerErrorException();
        }
        return true;
    }

    async checkAuthSms(phoneNumber: string, authNumber: string): Promise<boolean> {
        const find = await this.userRepository.findOne({ phoneNumber });
        if (find) throw new BadRequestException(new Error('WUSER1006', '이미 해당 휴대폰 번호가 존재합니다.'));
        const time = moment().subtract(5, 'minute').format('YYYY-MM-DD HH:mm:ss')
        const authSms = await this.authSmsRepository.findOne({ phoneNumber, authNumber, updatedAt: MoreThan(time) });
        return !!authSms;
    }

    async sendFindPasswordMail(email: string): Promise<FindPassword> {
        const queryRunner = await getConnection().createQueryRunner()
        try {
            await queryRunner.startTransaction();
            const manager = queryRunner.manager;
            const user = await this.userRepository.findOne({ email });
            if (!user) {
                throw new BadRequestException(new Error('WUSER1007', '해당 이메일로 가입한 정보가 없습니다.'));
            }
            if (user.provider) {
                throw new BadRequestException(new Error('WUSER1008', '이메일로 가입한 경우에만 비밀번호 재설정이 가능합니다.'));
            }
            const code = this.gernateRandomString(16);
            const expirationAt = moment().add(15, 'minutes').toDate();
            const pass = new FindPassword();
            pass.validationCode = code;
            pass.email = email;
            pass.expirationAt = expirationAt;
            const result = await manager.save(FindPassword, pass);
            const url = `https://www.nonunbub.com/reset-password?validationCode=${code}`;
            // const url = `http://localhost:8080/tabs/reset-password?validationCode=${code}`;
            await this.mailService.sendMail(email, '[노는법] 비밀번호 재설정 안내 메일입니다.',
                `<div
                style="margin-top:0;margin-bottom:0;margin-right:auto;margin-left:auto;display:block;padding-top:0;padding-bottom:0;padding-right:20px;padding-left:20px;text-align:center;max-width:600px;">
                <table
                  style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;width:100%;">
                  <tbody
                    style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;">
                    <!-- header -->
                    <tr
                      style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;width:100%;">
                      <td
                        style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;">
                        <a href="https://www.nonunbub.com" target="_blank"
                          style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;text-decoration:none;"
                          rel="noreferrer noopener">
                          <img src="https://nonunbub.com/static//assets/nonunbub_logo.png" alt="nonunbub"
                            style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;width:99px;margin-top:40px;margin-bottom:40px;margin-right:0;margin-left:0;"
                            loading="lazy">
                        </a>
                        <div
                          style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;background-color:#eeeeee;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;height:1px;">
                        </div>
                      </td>
                    </tr><!-- header end -->
                    <!-- title -->
                    <tr
                      style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;">
                      <td
                        style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;">
                        <h1
                          style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;font-size:30px;line-height:42px;font-weight:200;color:#000000;margin-top:40px;margin-bottom:40px;margin-right:auto;margin-left:auto;text-align:center;">
                          비밀번호 재설정 안내
                        </h1>
                      </td>
                    </tr><!-- title end -->
                    <!-- contents -->
                    <tr
                      style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;">
                      <td
                        style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;">
                        <p
                          style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;font-size:12px;line-height:22px;font-weight:400;color:#666;text-align:center;margin-top:30px;margin-bottom:0;margin-right:auto;margin-left:auto;">
                          아래 링크를 클릭하여 비밀 번호를 변경해주세요.
                        </p>
                        <p
                          style="padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;font-size:12px;line-height:22px;font-weight:400;color:#666;text-align:center;margin-top:0;margin-bottom:30px;margin-right:auto;margin-left:auto;">
                          링크는 15분 동안만 유효합니다.
                        </p>
                      </td>
                    </tr><!-- contents end -->
                    <!-- btn -->
                    <tr
                      style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;">
                      <td
                        style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;">
                        <a href="${url}"
                          style="margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;text-decoration:none;"
                          rel="noreferrer noopener" target="_blank">
                          <div
                            style="background-color:#FF578D;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;color:#ffffff;font-size:14px;font-weight:600;padding-top:13px;padding-bottom:13px;padding-right:18px;padding-left:18px;border-radius:4px;margin-top:40px;margin-bottom:40px;margin-right:0;margin-left:0;">
                            비밀번호 변경하기
                          </div>
                        </a>
                      </td>
                    </tr><!-- btn end -->
                  </tbody>
                </table>
              </div>`);
            queryRunner.commitTransaction();
            return result;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        } finally {
            await queryRunner.release();
        }
    }

    gernateRandomString(length: number): string {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    async resetPassword(validationCode: string, password: string) {
        const time = moment().subtract(15, 'minute').format('YYYY-MM-DD HH:mm:ss')
        const findPassword = await this.findPasswordRepository.findOne({ validationCode, expirationAt: MoreThan(time) });
        if (!findPassword) throw new BadRequestException(new Error('WUSER1009', '유효한 코드가 아닙니다.'));
        const user = await this.userRepository.findOne({ email: findPassword.email });
        user.password = password;
        const update = await this.update(user.id, user);
        return update;
    }
}
