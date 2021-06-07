import { HttpService, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as FormData from 'form-data';
import { Payment } from 'src/payment/model/payment.entity';
import { ErrorInfo } from '../model/error-info';
import { SlackMessageType, SlackService } from './slack.service';
const moment = require('moment');

export enum KakaotalkMessageType {
    PAYMENT = "PAYMENT",
    REQUEST_REVIEW = "REQUEST_REVIEW",
    ADD_REVIEW = "ADD_REVIEW",
    ADD_REVIEW_COMMENT = "ADD_REVIEW_COMMENT"
}

@Injectable()
export class KakaotalkService {
    constructor(
        private http: HttpService,
        private configService: ConfigService,
        private slackService: SlackService
    ) { }

    async getAlimtalkToken() {
        const url = "https://kakaoapi.aligo.in/akv10/token/create/30/s/"
        const form = new FormData();
        form.append('apikey', this.configService.get('ALIMTALK_API_KEY'))
        form.append('userid', this.configService.get('ALIMTALK_USER_ID'))
        const response = await this.http.post(url, form, { headers: form.getHeaders() }).toPromise()
        return response.data.token;
    }

    async send(type: KakaotalkMessageType, data: Payment, meta?: any) {
        let response: any;
        const token = await this.getAlimtalkToken();
        const url = "https://kakaoapi.aligo.in/akv10/alimtalk/send/"
        switch (type) {
            case KakaotalkMessageType.PAYMENT: {
                const payment = data as Payment;
                const receiver = meta.receiver;
                let receiverPhoneNumber: string;
                let receiverName: string;
                let nickname: string;
                if (payment.order.user) {
                    receiverPhoneNumber = payment.order.user.phoneNumber;
                    receiverName = payment.order.user.nickname;
                    nickname = payment.order.user.nickname;
                } else {
                    receiverPhoneNumber = payment.order.nonMember.phoneNumber;
                    receiverName = payment.order.nonMember.name;
                    nickname = payment.order.nonMember.name;
                }
                const orderNumber = payment.id;
                const totalPrice = payment.totalPrice;
                const payAt = moment(payment.payAt).add(9, 'hours').format('YYYY년MM월DD일 HH시mm분');
                const productTitle = payment.order.product.title;
                const productAddress = `${payment.order.product.address} (상세주소:${payment.order.product.detailAddress})`;
                const orderItems = meta.orderItems;
                let productOptions = orderItems.map(item => item.productOption.name).join(", ");
                const productOptionDate = moment(orderItems[0].productOption.date).add(9, 'hours').format('YYYY년MM월DD일 HH시mm분');
                const productId = payment.order.product.id;
                const temp = "TE_5377"
                const subject = "노는법 예약확인 메시지"
                const message = `${nickname}님의 예약이 완료되었습니다.

[상품정보]
- 상품이름: ${productTitle}
- 참여일시: ${productOptionDate}
- 옵션이름: ${productOptions}
- 주소: ${productAddress}

[예약정보]
- 주문번호: ${orderNumber}
- 결제금액: ${totalPrice}원
- 결제일시: ${payAt}

[주의사항]
- 유의사항과 준비물을 꼭 확인하세요!
- 예약 취소시 환불 규정에 따라 수수료가 부과될 수 있습니다.

[문의하기]
- 문의하실 내용이 있으시면 노는법 담당자에게 연락바랍니다.
- 담당자 연락처: 010-6687-1917`
                const sender = this.configService.get('ALIMTALK_SENDER_PHONE')
                const button = {
                    button: [{
                        name: "예약한 상품 확인하기",
                        linkType: "WL",
                        linkTypeName: "웹링크",
                        linkMo: `https://nonunbub.com/tabs/meeting-detail/${productId}`,
                        linkPc: `https://nonunbub.com/tabs/meeting-detail/${productId}`
                    }]
                };
                const form = new FormData();
                form.append('apikey', this.configService.get('ALIMTALK_API_KEY'));
                form.append('userid', this.configService.get('ALIMTALK_USER_ID'));
                form.append('token', token);
                form.append('senderkey', this.configService.get('ALIMTALK_SENDER_KEY'));
                form.append('tpl_code', temp);
                form.append('sender', sender);
                receiver ? form.append('receiver_1', receiver) : form.append('receiver_1', receiverPhoneNumber);
                form.append('recvname_1', receiverName);
                form.append('subject_1', subject);
                form.append('message_1', message);
                form.append('button_1', JSON.stringify(button));
                form.append('failover', "Y");
                form.append('fsubject_1', subject);
                form.append('fmessage_1', message);
                form.append('testMode', "N");
                response = await this.http.post(url, form, { headers: form.getHeaders() }).toPromise();
                break;
            }
            case KakaotalkMessageType.REQUEST_REVIEW: {
                const payment = data as Payment;
                const temp = "TE_7357"
                const subject = "노는법 리뷰 안내"
                const message = `안녕하세요. ${payment.order.user.nickname}님!
참여하신 "${payment.order.product.title}" 모임은 만족스러우셨나요?

더 나은 서비스 제공과 다른 참여자들을 위해서 아래 버튼 혹은 링크를 눌러 리뷰를 남겨주세요.

더욱 발전하는 노는법이 되도록 노력하겠습니다.

- 리뷰 쓰러가기
https://nonunbub.com/tabs/review-detail/${payment.id}`
                const sender = this.configService.get('ALIMTALK_SENDER_PHONE')
                const button = {
                    button: [{
                        name: "리뷰 쓰러가기!",
                        linkType: "WL",
                        linkTypeName: "웹링크",
                        linkMo: `https://nonunbub.com/tabs/review-detail/${payment.id}`,
                        linkPc: `https://nonunbub.com/tabs/review-detail/${payment.id}`
                    }]
                };
                const form = new FormData();
                form.append('apikey', this.configService.get('ALIMTALK_API_KEY'));
                form.append('userid', this.configService.get('ALIMTALK_USER_ID'));
                form.append('token', token);
                form.append('senderkey', this.configService.get('ALIMTALK_SENDER_KEY'));
                form.append('tpl_code', temp);
                form.append('sender', sender);
                form.append('receiver_1', payment.order.user.phoneNumber);
                form.append('recvname_1', payment.order.user.nickname);
                form.append('subject_1', subject);
                form.append('message_1', message);
                form.append('button_1', JSON.stringify(button));
                form.append('failover', "Y");
                form.append('fsubject_1', subject);
                form.append('fmessage_1', message);
                form.append('testMode', "N");
                response = await this.http.post(url, form, { headers: form.getHeaders() }).toPromise();
                break;
            }
            case KakaotalkMessageType.ADD_REVIEW: {
                const payment = data as Payment;
                const temp = "TE_7359"
                const subject = "노는법 리뷰 등록 안내"
                const message = `안녕하세요. 호스트님!

주최하신 "${payment.order.product.title}" 상품에 리뷰가 등록되었습니다. 답글을 달아주세요!

- 답글 쓰러가기
https://nonunbub.com/host/review`
                const sender = this.configService.get('ALIMTALK_SENDER_PHONE')
                const button = {
                    button: [{
                        name: "답글 쓰러가기!",
                        linkType: "WL",
                        linkTypeName: "웹링크",
                        linkMo: `https://nonunbub.com/host/review`,
                        linkPc: `https://nonunbub.com/host/review`
                    }]
                };
                const form = new FormData();
                form.append('apikey', this.configService.get('ALIMTALK_API_KEY'));
                form.append('userid', this.configService.get('ALIMTALK_USER_ID'));
                form.append('token', token);
                form.append('senderkey', this.configService.get('ALIMTALK_SENDER_KEY'));
                form.append('tpl_code', temp);
                form.append('sender', sender);
                form.append('receiver_1', payment.order.product.host.phoneNumber);
                form.append('recvname_1', payment.order.product.host.nickname);
                form.append('subject_1', subject);
                form.append('message_1', message);
                form.append('button_1', JSON.stringify(button));
                form.append('failover', "Y");
                form.append('fsubject_1', subject);
                form.append('fmessage_1', message);
                form.append('testMode', "N");
                response = await this.http.post(url, form, { headers: form.getHeaders() }).toPromise();
                break;
            }
            case KakaotalkMessageType.ADD_REVIEW_COMMENT: {
                const payment = data as Payment;
                const temp = "TE_7360"
                const subject = "노는법 리뷰 답글 등록 안내"
                const message = `안녕하세요. ${payment.order.user.nickname}님!

"${payment.order.product.title}" 모임에 호스트가 답글을 작성하였습니다.

- 모임 확인하기
https://nonunbub.com/tabs/meeting-detail/${payment.order.product.id}`
                const sender = this.configService.get('ALIMTALK_SENDER_PHONE')
                const button = {
                    button: [{
                        name: "모임 확인하기!",
                        linkType: "WL",
                        linkTypeName: "웹링크",
                        linkMo: `https://nonunbub.com/tabs/meeting-detail/${payment.order.product.id}`,
                        linkPc: `https://nonunbub.com/tabs/meeting-detail/${payment.order.product.id}`
                    }]
                };
                const form = new FormData();
                form.append('apikey', this.configService.get('ALIMTALK_API_KEY'));
                form.append('userid', this.configService.get('ALIMTALK_USER_ID'));
                form.append('token', token);
                form.append('senderkey', this.configService.get('ALIMTALK_SENDER_KEY'));
                form.append('tpl_code', temp);
                form.append('sender', sender);
                form.append('receiver_1', payment.order.user.phoneNumber);
                form.append('recvname_1', payment.order.user.nickname);
                form.append('subject_1', subject);
                form.append('message_1', message);
                form.append('button_1', JSON.stringify(button));
                form.append('failover', "Y");
                form.append('fsubject_1', subject);
                form.append('fmessage_1', message);
                form.append('testMode', "N");
                response = await this.http.post(url, form, { headers: form.getHeaders() }).toPromise();
                break;
            }
        }
        if (response.data.code === -99) {
            //todo
            const errorInfo = new ErrorInfo('NE002', 'NEI0013', `알림톡 전송(${KakaotalkMessageType})에 오류가 발생하였습니다.`, response.data)
            await this.slackService.send(SlackMessageType.SERVICE_ERROR, errorInfo)
            throw new InternalServerErrorException(errorInfo);
        } else {
            return response;
        }
    }
}
