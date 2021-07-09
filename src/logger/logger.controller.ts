import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoggerService } from './logger.service';

@ApiTags('logger')
@Controller('api/logger')
export class LoggerController {
    constructor(
        private loggerService: LoggerService
    ) { }

    @Post('')
    addLog(@Body() log: any) {
        this.loggerService.log(log);
    }
}
