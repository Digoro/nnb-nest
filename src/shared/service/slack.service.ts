import { HttpService, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payment } from 'src/payment/model/payment.entity';
import { Product } from 'src/product/model/product.entity';
import { User } from 'src/user/model/user.entity';
import { ErrorInfo } from '../model/error-info';
const moment = require('moment');

export enum SlackMessageType {
    SIGNUP,
    SERVICE_ERROR,
    PAYMENT,
    PRODUCT
}

@Injectable()
export class SlackService {
    constructor(
        private http: HttpService,
        private configService: ConfigService
    ) { }

    async send(type: SlackMessageType, data: User | Payment | ErrorInfo | Product, meta?: any) {
        switch (type) {
            case SlackMessageType.SIGNUP: {
                const user = data as User;
                await this.http.post(this.configService.get('SLACK_SIGNUP_WEBHOOK_URL'), {
                    "blocks": [
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": "회원가입 알림봇 👏🏻"
                            }
                        },
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": `• 이름: ${user.name}\n • 닉네임: ${user.nickname}\n • 이메일: ${user.email}\n • Oauth: ${user.provider}\n • 가입일: ${moment(user.createdAt).add(9, 'hours').format('YYYY-MM-DD HH:mm:ss')}\n • 링크: https://nonunbub.com/tabs/profile/${user.id}`
                            }
                        },
                        {
                            "type": "image",
                            "image_url": user.profilePhoto,
                            "alt_text": user.nickname
                        }
                    ]
                }).toPromise()
                break;
            }
            case SlackMessageType.SERVICE_ERROR: {
                const errorInfo = data as ErrorInfo;
                await this.http.post(this.configService.get('SLACK_SERVICE_ERROR_WEBHOOK_URL'), {
                    "blocks": [
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": "서비스 오류 알림봇 🚫"
                            }
                        },
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": `• 서비스 응답 코드: ${errorInfo.code}\n • 오류 아이디: ${errorInfo.id}\n • 응답 메시지: ${errorInfo.message}\n • 원인: ${JSON.stringify(errorInfo.reason)}\n • 일시: ${moment().format('YYYY-MM-DD HH:mm:ss')}`
                            }
                        }
                    ]
                }).toPromise()
                break;
            }
            case SlackMessageType.PAYMENT: {
                const payment = data as Payment;
                const userMessage = payment.order.user ?
                    `결제자: ${payment.order.user.name}(닉네임: ${payment.order.user.nickname})` :
                    `결제자: ${payment.order.nonMember.name}(비회원)`;
                await this.http.post(this.configService.get('SLACK_PAYMENT_WEBHOOK_URL'), {
                    "blocks": [
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": "결제 알림봇 💳"
                            }
                        },
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": `• 상품명: ${payment.order.product.title}\n • 결제일: ${moment(payment.payAt).add(9, 'hours').format('YYYY-MM-DD HH:mm:ss')}\n • ${userMessage}`
                            }
                        }
                    ]
                }).toPromise()
                break;
            }
            case SlackMessageType.PRODUCT: {
                const product = data as Product;

                await this.http.post(this.configService.get('SLACK_PRODUCT_WEBHOOK_URL'), {
                    "blocks": [{
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": `상품 관리 봇 👍 [상품 ${meta.action}]`
                        }
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": `• 상품명: ${product.title}\n • 링크: https://nonunbub.com/tabs/meeting-detail/${product.id}`
                        },
                        "accessory": {
                            "type": "image",
                            "image_url": product.representationPhotos[0].photo,
                            "alt_text": product.title
                        }
                    }]
                }).toPromise()
                break;
            }
        }
    }
}
