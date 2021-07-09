import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { LoggerController } from './logger.controller';
import { LoggerService } from './logger.service';

@Module({
    imports: [
        SharedModule
    ],
    providers: [
        LoggerService
    ],
    controllers: [
        LoggerController,
    ]
})
export class LoggerModule { }