import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventLog } from './model/event-log';
import { EventLogCreateDto } from './model/event-log.dto';

@Injectable()
export class LoggerService {
    constructor(
        @InjectRepository(EventLog) private eventLogRepository: Repository<EventLog>,
    ) { }

    async log(dto: EventLogCreateDto) {
        const event = dto.toEntity();
        await this.eventLogRepository.save(event);
    }
}
