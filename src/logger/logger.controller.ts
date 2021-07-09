import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoggerService } from './logger.service';
import { EventLogCreateDto } from './model/event-log.dto';

@ApiTags('logger')
@Controller('api/logger')
export class LoggerController {
    constructor(
        private loggerService: LoggerService
    ) { }

    @Post('')
    addLog(@Body() log: EventLogCreateDto) {
        this.loggerService.log(log);
    }
}
