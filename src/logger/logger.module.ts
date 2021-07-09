import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from 'src/shared/shared.module';
import { LoggerController } from './logger.controller';
import { LoggerService } from './logger.service';
import { EventLog } from './model/event-log';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            EventLog,
        ]),
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