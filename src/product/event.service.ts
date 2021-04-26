import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Event } from 'src/product/model/product.entity';
import { ErrorInfo } from 'src/shared/model/error-info';
import { Repository } from 'typeorm';
import { EventCreateDto, EventSearchDto, EventUpdateDto } from './model/product.dto';
import { EventStatus, EventType } from './model/product.interface';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event) private eventRepository: Repository<Event>,
  ) { }

  async create(eventDto: EventCreateDto): Promise<Event> {
    const event = eventDto.toEntity();
    const newEvent = await this.eventRepository.save(event);
    return newEvent;
  }

  async paginate(search: EventSearchDto): Promise<Pagination<Event>> {
    const options = { page: search.page, limit: search.limit }
    const query = this.eventRepository
      .createQueryBuilder('event')
    if (search.status !== EventStatus.ALL) {
      query.where('event.status = :status', { status: search.status })
    }
    if (search.type !== EventType.ALL) {
      query.where('event.type = :type', { type: search.type })
    }
    const events = await paginate<Event>(query, options)
    return events;
  }

  async findById(id: number): Promise<Event> {
    return await this.eventRepository.findOne({ id });
  }

  async updateOne(id: number, eventtDto: EventUpdateDto): Promise<any> {
    const event = await this.findById(id);
    if (!event) throw new BadRequestException(new ErrorInfo('NE003', 'NEI0032', '존재하지 않습니다.'))
    return await this.eventRepository.save(Object.assign(event, eventtDto))
  }

  async deleteOne(id: number): Promise<any> {
    return await this.eventRepository.delete(id);
  }
}
