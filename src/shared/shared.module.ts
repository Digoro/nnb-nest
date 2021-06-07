import { HttpModule, Module } from '@nestjs/common';
import { SlackService } from 'src/shared/service/slack.service';
import { KakaotalkService } from './service/kakaotalk.service';
import { MailService } from './service/mail.service';

@Module({
    imports: [
        HttpModule
    ],
    providers: [
        SlackService,
        KakaotalkService,
        MailService
    ],
    exports: [
        HttpModule,
        SlackService,
        KakaotalkService,
        MailService
    ]
})
export class SharedModule { }