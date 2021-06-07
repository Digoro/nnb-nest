import { HttpService, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as FormData from 'form-data';
import { Payment } from 'src/payment/model/payment.entity';
import { User } from 'src/user/model/user.entity';
const moment = require('moment');

export enum KakaotalkMessageType {
    PAYMENT,
    REQUEST_REVIEW
}

@Injectable()
export class KakaotalkService {
    constructor(
        private http: HttpService,
        private configService: ConfigService
    ) { }

    async getAlimtalkToken() {
        const url = "https://kakaoapi.aligo.in/akv10/token/create/30/s/"
        const form = new FormData();
        form.append('apikey', this.configService.get('ALIMTALK_API_KEY'))
        form.append('userid', this.configService.get('ALIMTALK_USER_ID'))
        const response = await this.http.post(url, form, { headers: form.getHeaders() }).toPromise()
        return response.data.token;
    }

    async send(type: KakaotalkMessageType, data: User | Payment) {
        switch (type) {
            case KakaotalkMessageType.REQUEST_REVIEW: {
                const payment = data as Payment;
                const token = await this.getAlimtalkToken();
                const url = "https://kakaoapi.aligo.in/akv10/alimtalk/send/"
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
                const response = await this.http.post(url, form, { headers: form.getHeaders() }).toPromise();
                return response;
            }
        }
    }
}
