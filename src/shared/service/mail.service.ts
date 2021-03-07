import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const nodemailer = require('nodemailer')

@Injectable()
export class MailService {
    private MAIL_HOST: string;
    private MAIL_PORT: string;
    private MAIL_AUTH_USER: string;
    private MAIL_AUTH_PASS: string;
    private MAIL_SENDER: string;

    constructor(
        private configService: ConfigService
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
            throw new InternalServerErrorException('fail send email');
        }
    }
}
