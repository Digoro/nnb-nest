import { HttpModule, Module } from '@nestjs/common';
import { SlackService } from 'src/shared/service/slack.service';
import { MailService } from './service/mail.service';

@Module({
    imports: [
        HttpModule
    ],
    providers: [
        SlackService,
        MailService
    ],
    exports: [
        HttpModule,
        SlackService,
        MailService
    ]
})
export class SharedModule { }