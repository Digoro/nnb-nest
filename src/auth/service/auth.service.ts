import { BadRequestException, HttpService, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as FormData from 'form-data';
import { ErrorInfo } from 'src/shared/model/error-info';
import { UserCreateDto, UserLoginDto, UserUpdateDto, UserUpdateRoleDto } from 'src/user/model/user.dto';
import { Coupon, User } from 'src/user/model/user.entity';
import { getConnection, MoreThan, Repository } from 'typeorm';
import { Configuration } from './../../configuration/model/configuration.entity';
import { MailService } from './../../shared/service/mail.service';
import { UserCouponMap } from './../../user/model/user.entity';
import { AuthSms, FindPassword } from './../model/auth.entity';
const bcrypt = require('bcrypt');
const moment = require('moment')

export enum OAuthProvider {
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
		@InjectRepository(Coupon) private couponRepository: Repository<Coupon>,
		@InjectRepository(UserCouponMap) private userCouponMapRepository: Repository<UserCouponMap>,
		@InjectRepository(Configuration) private configurationRepository: Repository<Configuration>,
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
		if (findEmail) throw new BadRequestException(new ErrorInfo('NE001', 'NEI0015', '이미 해당 이메일이 존재합니다.'));
		const findPhone = await this.userRepository.findOne({ phoneNumber: userDto.phoneNumber });
		if (findPhone) throw new BadRequestException(new ErrorInfo('NE001', 'NEI0016', '이미 해당 휴대폰 번호가 존재합니다.'));
		const user = await this.userRepository.save(this.userRepository.create(userDto));
		this.setCoupon(user);
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
		if (!user) throw new UnauthorizedException(new ErrorInfo('NE004', 'NEI0017', '로그인에 실패하였습니다. 입력 정보를 다시 확인해주세요.'));
		const match = await this.comparePassword(userDto.password, user.password);
		if (!match) throw new UnauthorizedException(new ErrorInfo('NE004', 'NEI0018', '로그인에 실패하였습니다. 입력 정보를 다시 확인해주세요.'));
		return await this.generateJWT(user);
	}

	async oauthLogin(email: string, thirdPartyId: string, username: string, provider: OAuthProvider, image?: string): Promise<string> {
		let user = await this.findByEmail(email);
		if (!user) {
			const newUser = new User();
			newUser.email = email;
			newUser.provider = provider;
			newUser.thirdpartyId = thirdPartyId;
			newUser.nickname = username ? username : `nonunbub_${this.gernateRandomString(11)}`;
			newUser.profilePhoto = image;
			newUser.aggrementTermsOfService = true;
			newUser.aggrementCollectPersonal = true;
			newUser.aggrementMarketing = true;
			user = await this.userRepository.save(newUser);
			this.setCoupon(user);
		}
		return await this.generateJWT(user);
	}

	async setCoupon(user: User) {
		const event = await this.configurationRepository.findOne({ key: 'signupEvent' });
		if (event && event.value === 'true') {
			const coupon = new Coupon();
			coupon.name = '회원가입 이벤트';
			coupon.contents = '회원가입 이벤트';
			coupon.price = 3000;
			coupon.expireDuration = moment().endOf('year').toDate();
			const newCoupon = await this.couponRepository.save(coupon);

			const map = new UserCouponMap();
			map.user = user;
			map.userId = user.id;
			map.coupon = newCoupon;
			map.couponId = newCoupon.id;
			await this.userCouponMapRepository.save(map);
		}
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
		return this.jwtService.signAsync({ ...user });
	}

	async comparePassword(newPassword: string, passwordHash: string): Promise<boolean> {
		return await bcrypt.compare(newPassword, passwordHash);
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
			throw new InternalServerErrorException(new ErrorInfo('NE002', 'NEI0019', '인증번호 문자 전송에 오류가 발생하였습니다.', result.data));
		}
		return true;
	}

	async checkAuthSms(phoneNumber: string, authNumber: string): Promise<boolean> {
		const find = await this.userRepository.findOne({ phoneNumber });
		if (find) throw new BadRequestException(new ErrorInfo('NE003', 'NEI0020', '이미 해당 휴대폰 번호가 존재합니다.'));
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
				throw new BadRequestException(new ErrorInfo('NE003', 'NEI0021', '해당 이메일로 가입한 정보가 없습니다.'));
			}
			if (user.provider) {
				throw new BadRequestException(new ErrorInfo('NE003', 'NEI0022', '이메일로 가입한 경우에만 비밀번호 재설정이 가능합니다.'));
			}
			const code = this.gernateRandomString(16);
			const expirationAt = moment().add(15, 'minutes').toDate();
			const pass = new FindPassword();
			pass.validationCode = code;
			pass.email = email;
			pass.expirationAt = expirationAt;
			const result = await manager.save(FindPassword, pass);
			const url = `${this.configService.get('SITE_HOST')}/tabs/reset-password?validationCode=${code}`;
			const message = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
	<!--[if gte mso 9]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<meta name="viewport" content="width=device-width">
	<!--[if !mso]><!-->
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<!--<![endif]-->
	<title></title>
	<!--[if !mso]><!-->
	<link href="https://fonts.googleapis.com/css?family=Abril+Fatface" rel="stylesheet" type="text/css">
	<link href="https://fonts.googleapis.com/css?family=Alegreya" rel="stylesheet" type="text/css">
	<link href="https://fonts.googleapis.com/css?family=Arvo" rel="stylesheet" type="text/css">
	<link href="https://fonts.googleapis.com/css?family=Bitter" rel="stylesheet" type="text/css">
	<link href="https://fonts.googleapis.com/css?family=Cabin" rel="stylesheet" type="text/css">
	<link href="https://fonts.googleapis.com/css?family=Ubuntu" rel="stylesheet" type="text/css">
	<!--<![endif]-->
	<style type="text/css">
		body {
			margin: 0;
			padding: 0;
		}

		table,
		td,
		tr {
			vertical-align: top;
			border-collapse: collapse;
		}

		* {
			line-height: inherit;
		}

		a[x-apple-data-detectors=true] {
			color: inherit !important;
			text-decoration: none !important;
		}
	</style>
	<style type="text/css" id="media-query">
		@media (max-width: 520px) {

			.block-grid,
			.col {
				min-width: 320px !important;
				max-width: 100% !important;
				display: block !important;
			}

			.block-grid {
				width: 100% !important;
			}

			.col {
				width: 100% !important;
			}

			.col_cont {
				margin: 0 auto;
			}

			img.fullwidth,
			img.fullwidthOnMobile {
				max-width: 100% !important;
			}

			.no-stack .col {
				min-width: 0 !important;
				display: table-cell !important;
			}

			.no-stack.two-up .col {
				width: 50% !important;
			}

			.no-stack .col.num2 {
				width: 16.6% !important;
			}

			.no-stack .col.num3 {
				width: 25% !important;
			}

			.no-stack .col.num4 {
				width: 33% !important;
			}

			.no-stack .col.num5 {
				width: 41.6% !important;
			}

			.no-stack .col.num6 {
				width: 50% !important;
			}

			.no-stack .col.num7 {
				width: 58.3% !important;
			}

			.no-stack .col.num8 {
				width: 66.6% !important;
			}

			.no-stack .col.num9 {
				width: 75% !important;
			}

			.no-stack .col.num10 {
				width: 83.3% !important;
			}

			.video-block {
				max-width: none !important;
			}

			.mobile_hide {
				min-height: 0px;
				max-height: 0px;
				max-width: 0px;
				display: none;
				overflow: hidden;
				font-size: 0px;
			}

			.desktop_hide {
				display: block !important;
				max-height: none !important;
			}
		}
	</style>
</head>

<body class="clean-body" style="margin: 0; padding: 0; -webkit-text-size-adjust: 100%; background-color: #FFFFFF;">
	<!--[if IE]><div class="ie-browser"><![endif]-->
	<table class="nl-container" style="table-layout: fixed; vertical-align: top; min-width: 320px; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #FFFFFF; width: 100%;" cellpadding="0" cellspacing="0" role="presentation" width="100%" bgcolor="#FFFFFF" valign="top">
		<tbody>
			<tr style="vertical-align: top;" valign="top">
				<td style="word-break: break-word; vertical-align: top;" valign="top">
					<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color:#FFFFFF"><![endif]-->
					<div style="background-color:#f5f5f5;">
						<div class="block-grid " style="min-width: 320px; max-width: 500px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
							<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
								<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:500px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
								<!--[if (mso)|(IE)]><td align="center" width="500" style="background-color:transparent;width:500px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:0px; padding-bottom:5px;"><![endif]-->
								<div class="col num12" style="min-width: 320px; max-width: 500px; display: table-cell; vertical-align: top; width: 500px;">
									<div class="col_cont" style="width:100% !important;">
										<!--[if (!mso)&(!IE)]><!-->
										<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:0px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">
											<!--<![endif]-->
											<div class="img-container center fixedwidth" align="center" style="padding-right: 0px;padding-left: 0px;">
												<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr style="line-height:0px"><td style="padding-right: 0px;padding-left: 0px;" align="center"><![endif]--><img class="center fixedwidth" align="center" border="0" src="https://nonunbub.com/static//assets/nnb_logo.png" alt="nnb" title="nnb" style="text-decoration: none; -ms-interpolation-mode: bicubic; height: auto; border: 0; width: 100%; max-width: 125px; display: block;" width="125">
												<div style="font-size:1px;line-height:10px">&nbsp;</div>
												<!--[if mso]></td></tr></table><![endif]-->
											</div>
											<!--[if (!mso)&(!IE)]><!-->
										</div>
										<!--<![endif]-->
									</div>
								</div>
								<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
								<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
							</div>
						</div>
					</div>
					<div style="background-color:#f5f5f5;">
						<div class="block-grid " style="min-width: 320px; max-width: 500px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
							<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
								<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:500px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
								<!--[if (mso)|(IE)]><td align="center" width="500" style="background-color:transparent;width:500px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:5px; padding-bottom:0px;"><![endif]-->
								<div class="col num12" style="min-width: 320px; max-width: 500px; display: table-cell; vertical-align: top; width: 500px;">
									<div class="col_cont" style="width:100% !important;">
										<!--[if (!mso)&(!IE)]><!-->
										<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:5px; padding-bottom:0px; padding-right: 0px; padding-left: 0px;">
											<!--<![endif]-->
											<div class="img-container center autowidth" align="center" style="padding-right: 0px;padding-left: 0px;">
												<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr style="line-height:0px"><td style="padding-right: 0px;padding-left: 0px;" align="center"><![endif]--><img class="center autowidth" align="center" border="0" src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/2966/Top.png" style="text-decoration: none; -ms-interpolation-mode: bicubic; height: auto; border: 0; width: 100%; max-width: 500px; display: block;" width="500">
												<!--[if mso]></td></tr></table><![endif]-->
											</div>
											<!--[if (!mso)&(!IE)]><!-->
										</div>
										<!--<![endif]-->
									</div>
								</div>
								<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
								<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
							</div>
						</div>
					</div>
					<div style="background-color:#f5f5f5;">
						<div class="block-grid " style="min-width: 320px; max-width: 500px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: #ffffff;">
							<div style="border-collapse: collapse;display: table;width: 100%;background-color:#ffffff;">
								<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:500px"><tr class="layout-full-width" style="background-color:#ffffff"><![endif]-->
								<!--[if (mso)|(IE)]><td align="center" width="500" style="background-color:#ffffff;width:500px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:0px; padding-bottom:5px;"><![endif]-->
								<div class="col num12" style="min-width: 320px; max-width: 500px; display: table-cell; vertical-align: top; width: 500px;">
									<div class="col_cont" style="width:100% !important;">
										<!--[if (!mso)&(!IE)]><!-->
										<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:0px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">
											<!--<![endif]-->
											<div class="img-container center fixedwidth" align="center" style="padding-right: 5px;padding-left: 5px;">
												<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr style="line-height:0px"><td style="padding-right: 5px;padding-left: 5px;" align="center"><![endif]--><img class="center fixedwidth" align="center" border="0" src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/2966/pass-animate.gif" alt="reset-password" title="reset-password" style="text-decoration: none; -ms-interpolation-mode: bicubic; height: auto; border: 0; width: 100%; max-width: 350px; display: block;" width="350">
												<div style="font-size:1px;line-height:5px">&nbsp;</div>
												<!--[if mso]></td></tr></table><![endif]-->
											</div>
											<table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;" valign="top">
												<tr style="vertical-align: top;" valign="top">
													<td style="word-break: break-word; vertical-align: top; padding-bottom: 0px; padding-left: 0px; padding-right: 0px; padding-top: 0px; text-align: center; width: 100%;" width="100%" align="center" valign="top">
														<h1 style="color:#393d47;direction:ltr;font-family:Tahoma, Verdana, Segoe, sans-serif;font-size:25px;font-weight:normal;letter-spacing:normal;line-height:120%;text-align:center;margin-top:0;margin-bottom:0;"><strong>비밀번호 변경해주세요.</strong></h1>
													</td>
												</tr>
											</table>
											<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Tahoma, Verdana, sans-serif"><![endif]-->
											<div style="color:#393d47;font-family:Tahoma, Verdana, Segoe, sans-serif;line-height:1.5;padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;">
												<div class="txtTinyMce-wrapper" style="line-height: 1.5; font-size: 12px; font-family: Tahoma, Verdana, Segoe, sans-serif; color: #393d47; mso-line-height-alt: 18px;">
													<p style="font-size: 14px; line-height: 1.5; word-break: break-word; text-align: center; font-family: Tahoma, Verdana, Segoe, sans-serif; mso-line-height-alt: 21px; margin: 0;">아래 링크를 클릭하여 비밀 번호를 변경해주세요.</p>
												</div>
											</div>
											<!--[if mso]></td></tr></table><![endif]-->
											<div class="button-container" align="center" style="padding-top:15px;padding-right:15px;padding-bottom:15px;padding-left:15px;">
												<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-spacing: 0; border-collapse: collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"><tr><td style="padding-top: 15px; padding-right: 15px; padding-bottom: 15px; padding-left: 15px" align="center"><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:43.5pt;width:292.5pt;v-text-anchor:middle;" arcsize="35%" strokeweight="0.75pt" strokecolor="#FFC727" fillcolor="#ffc727"><w:anchorlock/><v:textbox inset="0,0,0,0"><center style="color:#393d47; font-family:Tahoma, Verdana, sans-serif; font-size:18px"><![endif]--><a href="${url}" target="_blank" style="-webkit-text-size-adjust: none; text-decoration: none; display: inline-block; color: #393d47; background-color: #ffc727; border-radius: 20px; -webkit-border-radius: 20px; -moz-border-radius: 20px; width: auto; width: auto; border-top: 1px solid #FFC727; border-right: 1px solid #FFC727; border-bottom: 1px solid #FFC727; border-left: 1px solid #FFC727; padding-top: 10px; padding-bottom: 10px; font-family: Tahoma, Verdana, Segoe, sans-serif; text-align: center; mso-border-alt: none; word-break: keep-all;"><span style="padding-left:50px;padding-right:50px;font-size:18px;display:inline-block;letter-spacing:normal;"><span style="font-size: 16px; line-height: 2; word-break: break-word; font-family: Tahoma, Verdana, Segoe, sans-serif; mso-line-height-alt: 32px;"><span style="font-size: 18px; line-height: 36px;" data-mce-style="font-size: 18px; line-height: 36px;"><strong>비밀번호 재설정 하러가기!</strong></span></span></span></a>
												<!--[if mso]></center></v:textbox></v:roundrect></td></tr></table><![endif]-->
											</div>
											<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 5px; font-family: Tahoma, Verdana, sans-serif"><![endif]-->
											<div style="color:#393d47;font-family:Tahoma, Verdana, Segoe, sans-serif;line-height:1.5;padding-top:10px;padding-right:10px;padding-bottom:5px;padding-left:10px;">
												<div class="txtTinyMce-wrapper" style="line-height: 1.5; font-size: 12px; font-family: Tahoma, Verdana, Segoe, sans-serif; text-align: center; color: #393d47; mso-line-height-alt: 18px;">링크는 15분 동안만 유효합니다.</div>
											</div>
											<!--[if mso]></td></tr></table><![endif]-->
											<!--[if (!mso)&(!IE)]><!-->
										</div>
										<!--<![endif]-->
									</div>
								</div>
								<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
								<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
							</div>
						</div>
					</div>
					<div style="background-color:#f5f5f5;">
						<div class="block-grid " style="min-width: 320px; max-width: 500px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
							<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
								<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:500px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
								<!--[if (mso)|(IE)]><td align="center" width="500" style="background-color:transparent;width:500px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:0px; padding-bottom:0px;"><![endif]-->
								<div class="col num12" style="min-width: 320px; max-width: 500px; display: table-cell; vertical-align: top; width: 500px;">
									<div class="col_cont" style="width:100% !important;">
										<!--[if (!mso)&(!IE)]><!-->
										<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:0px; padding-bottom:0px; padding-right: 0px; padding-left: 0px;">
											<!--<![endif]-->
											<div class="img-container center autowidth" align="center" style="padding-right: 0px;padding-left: 0px;">
												<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr style="line-height:0px"><td style="padding-right: 0px;padding-left: 0px;" align="center"><![endif]--><img class="center autowidth" align="center" border="0" src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/2966/Btm.png" style="text-decoration: none; -ms-interpolation-mode: bicubic; height: auto; border: 0; width: 100%; max-width: 500px; display: block;" width="500">
												<!--[if mso]></td></tr></table><![endif]-->
											</div>
											<!--[if (!mso)&(!IE)]><!-->
										</div>
										<!--<![endif]-->
									</div>
								</div>
								<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
								<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
							</div>
						</div>
					</div>
					<div style="background-color:#fff;">
						<div class="block-grid " style="min-width: 320px; max-width: 500px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
							<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
								<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:500px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
								<!--[if (mso)|(IE)]><td align="center" width="500" style="background-color:transparent;width:500px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:5px; padding-bottom:5px;"><![endif]-->
								<div class="col num12" style="min-width: 320px; max-width: 500px; display: table-cell; vertical-align: top; width: 500px;">
									<div class="col_cont" style="width:100% !important;">
										<!--[if (!mso)&(!IE)]><!-->
										<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">
											<!--<![endif]-->
											<div style="font-size:16px;text-align:center;font-family:Arial, Helvetica Neue, Helvetica, sans-serif">
												<div style="height:30px;">&nbsp;</div>
											</div>
											<table class="social_icons" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;" valign="top">
												<tbody>
													<tr style="vertical-align: top;" valign="top">
														<td style="word-break: break-word; vertical-align: top; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px;" valign="top">
															<table class="social_table" align="center" cellpadding="0" cellspacing="0" role="presentation" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-tspace: 0; mso-table-rspace: 0; mso-table-bspace: 0; mso-table-lspace: 0;" valign="top">
																<tbody>
																	<tr style="vertical-align: top; display: inline-block; text-align: center;" align="center" valign="top">
																		<td style="word-break: break-word; vertical-align: top; padding-bottom: 0; padding-right: 5px; padding-left: 5px;" valign="top"><a href="https://band.us/band/75866264" target="_blank"><img width="32" height="32" src="https://d15k2d11r6t6rl.cloudfront.net/public/users/Integrators/BeeProAgency/644479_626629/ezgif-3-82ce70a879a6.png" alt="Band" title="Band" style="text-decoration: none; -ms-interpolation-mode: bicubic; height: auto; border: 0; display: block;"></a></td>
																		<td style="word-break: break-word; vertical-align: top; padding-bottom: 0; padding-right: 5px; padding-left: 5px;" valign="top"><a href="https://www.instagram.com/nonunbub/" target="_blank"><img width="32" height="32" src="https://d15k2d11r6t6rl.cloudfront.net/public/users/Integrators/BeeProAgency/644479_626629/%E1%84%8B%E1%85%B5%E1%86%AB%E1%84%89%E1%85%B3%E1%84%90%E1%85%A1%E1%84%80%E1%85%B3%E1%84%85%E1%85%A2%E1%86%B71.png" alt="Instagram" title="Instagram" style="text-decoration: none; -ms-interpolation-mode: bicubic; height: auto; border: 0; display: block;"></a></td>
																		<td style="word-break: break-word; vertical-align: top; padding-bottom: 0; padding-right: 5px; padding-left: 5px;" valign="top"><a href="https://www.youtube.com/channel/UCdlug-_m_DVkFBAK7iKEMsw/videos" target="_blank"><img width="32" height="32" src="https://d15k2d11r6t6rl.cloudfront.net/public/users/Integrators/BeeProAgency/644479_626629/%E1%84%8B%E1%85%B2%E1%84%90%E1%85%B2%E1%84%87%E1%85%B32.png" alt="Youtube" title="Youtube" style="text-decoration: none; -ms-interpolation-mode: bicubic; height: auto; border: 0; display: block;"></a></td>
																		<td style="word-break: break-word; vertical-align: top; padding-bottom: 0; padding-right: 5px; padding-left: 5px;" valign="top"><a href="https://www.facebook.com/nonunbub" target="_blank"><img width="32" height="32" src="https://d15k2d11r6t6rl.cloudfront.net/public/users/Integrators/BeeProAgency/644479_626629/%E1%84%91%E1%85%A6%E1%84%8B%E1%85%B5%E1%84%89%E1%85%B3%E1%84%87%E1%85%AE%E1%86%A8.png" alt="Facebook" title="Facebook" style="text-decoration: none; -ms-interpolation-mode: bicubic; height: auto; border: 0; display: block;"></a></td>
																	</tr>
																</tbody>
															</table>
														</td>
													</tr>
												</tbody>
											</table>
											<div style="font-size:16px;text-align:center;font-family:Arial, Helvetica Neue, Helvetica, sans-serif">
												<div style="margin-top: 25px;border-top:1px dashed #D6D6D6;margin-bottom: 20px;"></div>
											</div>
											<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Tahoma, Verdana, sans-serif"><![endif]-->
											<div style="color:#C0C0C0;font-family:Tahoma, Verdana, Segoe, sans-serif;line-height:1.2;padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;">
												<div class="txtTinyMce-wrapper" style="line-height: 1.2; font-size: 12px; font-family: Tahoma, Verdana, Segoe, sans-serif; color: #C0C0C0; mso-line-height-alt: 14px;">
													<p style="text-align: center; line-height: 1.2; word-break: break-word; font-family: Tahoma, Verdana, Segoe, sans-serif; mso-line-height-alt: 14px; margin: 0;">오늘 가장 젊은 순간을 특별하게</p>
													<p style="text-align: center; line-height: 1.2; word-break: break-word; font-family: Tahoma, Verdana, Segoe, sans-serif; mso-line-height-alt: 14px; margin: 0;">꽃중년들의 노는 방법,&nbsp;노는법</p>
													<p style="text-align: center; line-height: 1.2; word-break: break-word; font-family: Tahoma, Verdana, Segoe, sans-serif; mso-line-height-alt: 14px; margin: 0;">&nbsp;</p>
													<p style="text-align: center; line-height: 1.2; word-break: break-word; font-family: Tahoma, Verdana, Segoe, sans-serif; mso-line-height-alt: 14px; margin: 0;">서울특별시 강남구 역삼로 215(역삼동, 남국빌딩 2층) /&nbsp; nonunbub@gmail.com / 032-321-1917<a href="http://www.example.com" style></a></p>
													<p style="font-size: 12px; line-height: 1.2; text-align: center; word-break: break-word; font-family: Tahoma, Verdana, Segoe, sans-serif; mso-line-height-alt: 14px; margin: 0;"><span style="color: #c0c0c0;">&nbsp;</span></p>
												</div>
											</div>
											<!--[if mso]></td></tr></table><![endif]-->
											<div style="font-size:16px;text-align:center;font-family:Arial, Helvetica Neue, Helvetica, sans-serif">
												<div style="height-top: 20px;">&nbsp;</div>
											</div>
											<!--[if (!mso)&(!IE)]><!-->
										</div>
										<!--<![endif]-->
									</div>
								</div>
								<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
								<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
							</div>
						</div>
					</div>
					<div style="background-color:transparent;">
						<div class="block-grid " style="min-width: 320px; max-width: 500px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
							<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
								<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:500px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
								<!--[if (mso)|(IE)]><td align="center" width="500" style="background-color:transparent;width:500px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:5px; padding-bottom:5px;"><![endif]-->
								<div class="col num12" style="min-width: 320px; max-width: 500px; display: table-cell; vertical-align: top; width: 500px;">
									<div class="col_cont" style="width:100% !important;">
										<!--[if (!mso)&(!IE)]><!-->
										<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">
											<!--<![endif]-->
											<div></div>
											<!--[if (!mso)&(!IE)]><!-->
										</div>
										<!--<![endif]-->
									</div>
								</div>
								<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
								<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
							</div>
						</div>
					</div>
					<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
				</td>
			</tr>
		</tbody>
	</table>
	<!--[if (IE)]></div><![endif]-->
</body>

</html>`
			await this.mailService.sendMail(email, '[노는법] 비밀번호 재설정 안내 메일입니다.', message);
			await queryRunner.commitTransaction();
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
		if (!findPassword) throw new BadRequestException(new ErrorInfo('NE003', 'NEI0023', '유효한 코드가 아닙니다.'));
		const user = await this.userRepository.findOne({ email: findPassword.email });
		user.password = await bcrypt.hash(password, 12);
		const update = await this.update(user.id, user);
		return update;
	}
}
