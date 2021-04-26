import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorInfo } from 'src/shared/model/error-info';
import { SlackService } from 'src/shared/service/slack.service';
import { SlackMessageType } from './slack.service';
const nodemailer = require('nodemailer')

@Injectable()
export class MailService {
    private MAIL_HOST: string;
    private MAIL_PORT: string;
    private MAIL_AUTH_USER: string;
    private MAIL_AUTH_PASS: string;
    private MAIL_SENDER: string;

    constructor(
        private configService: ConfigService,
        private slackService: SlackService
    ) {
        this.MAIL_HOST = configService.get('MAIL_HOST');
        this.MAIL_PORT = configService.get('MAIL_PORT');
        this.MAIL_AUTH_USER = configService.get('MAIL_AUTH_USER');
        this.MAIL_AUTH_PASS = configService.get('MAIL_AUTH_PASS');
        this.MAIL_SENDER = configService.get('MAIL_SENDER');
    }
    async sendMail(to: string, subject: string, html: string) {
        const naverTransport = await nodemailer.createTransport({
            host: this.MAIL_HOST,
            port: this.MAIL_PORT,
            secure: true,
            auth: {
                user: this.MAIL_AUTH_USER,
                pass: this.MAIL_AUTH_PASS
            }
        })
        const options = { from: this.MAIL_SENDER, to, subject, html }
        try {
            await naverTransport.sendMail(options);
            naverTransport.close();
        } catch (e) {
            const errorInfo = new ErrorInfo('NE002', 'NEI0004', '메일 전송에 오류가 발생하였습니다.', e)
            await this.slackService.sendMessage(SlackMessageType.SERVICE_ERROR, errorInfo)
            throw new InternalServerErrorException(errorInfo);
        }
    }
}
