import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Event, EventProductMap, Product } from 'src/product/model/product.entity';
import { ErrorInfo } from 'src/shared/model/error-info';
import { getConnection, Repository } from 'typeorm';
import { EventCreateDto, EventSearchDto, EventUpdateDto } from './model/product.dto';
import { EventStatus, EventType, ProductStatus } from './model/product.interface';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event) private eventRepository: Repository<Event>,
    @InjectRepository(Product) private productRepository: Repository<Product>
  ) { }

  async create(dto: EventCreateDto): Promise<Event> {
    const queryRunner = await getConnection().createQueryRunner();
    try {
      await queryRunner.startTransaction();
      const manager = queryRunner.manager;
      const event = dto.toEntity();
      const newEvent = await manager.save(Event, event);

      if (dto.products) {
        for (const id of dto.products) {
          const product = await this.productRepository.findOne({ id });
          const map = new EventProductMap();
          map.eventId = newEvent.id;
          map.event = newEvent;
          map.productId = product.id;
          map.product = product;
          await manager.save(EventProductMap, map);
        }
      }
      await queryRunner.commitTransaction();
      return newEvent;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      //todo
      const errorInfo = new ErrorInfo('NE002', 'NEI0006', '이벤트 등록에 오류가 발생했습니다.', e)
      throw new InternalServerErrorException(errorInfo);
    } finally {
      await queryRunner.release();
    }
  }

  async paginate(search: EventSearchDto): Promise<Pagination<Event>> {
    const options = { page: search.page, limit: search.limit }
    const query = this.eventRepository
      .createQueryBuilder('event')
      .orderBy('event.createdAt', 'DESC')
    if (search.status !== EventStatus.ALL) {
      query.where('event.status = :status', { status: search.status })
    }
    if (search.type !== EventType.ALL) {
      query.where('event.type = :type', { type: search.type })
    }
    const events = await paginate<Event>(query, options);
    await events.items.forEach(async (event) => {
      const now = moment();
      const start = moment(event.startAt);
      const end = moment(event.endAt);
      if (now.isAfter(start) && now.isBefore(end)) {
        const dto = new EventUpdateDto();
        dto.status = EventStatus.RUNNING;
        await this.updateOne(event.id, dto);
      } else if (now.isAfter(end)) {
        const dto = new EventUpdateDto();
        dto.status = EventStatus.END;
        await this.updateOne(event.id, dto);
      }
    })
    const result = await paginate<Event>(query, options);
    return result;
  }

  async findById(id: number): Promise<Event> {
    const event = await this.eventRepository
      .createQueryBuilder('event')
      .innerJoinAndSelect('event.eventProductMap', 'eventProductMap')
      .innerJoinAndSelect('eventProductMap.product', 'product')
      .leftJoinAndSelect("product.productHashtagMap", 'productHashtagMap')
      .leftJoinAndSelect("productHashtagMap.hashtag", 'hashtag')
      .leftJoinAndSelect('product.representationPhotos', 'representationPhoto')
      .where('event.id = :id', { id })
      .andWhere('product.status = :status', { status: ProductStatus.ENTERED })
      .getOne()

    if (event?.eventProductMap) {
      const products = event.eventProductMap.map(map => map.product);
      event.products = products.map(product => {
        const hashtags = product.productHashtagMap.map(map => map.hashtag);
        product.hashtags = hashtags;
        delete product.productHashtagMap;
        return product;
      })
      delete event.eventProductMap;
    }

    return event;
  }

  async updateOne(id: number, dto: EventUpdateDto): Promise<any> {
    const queryRunner = await getConnection().createQueryRunner()
    try {
      await queryRunner.startTransaction();
      const manager = queryRunner.manager;
      const event = await this.findById(id);
      if (!event) throw new BadRequestException(new ErrorInfo('NE003', 'NEI0032', '존재하지 않습니다.'))
      const newEvent = await manager.save(Event, Object.assign(event, dto))

      if (dto.products) {
        await manager.delete(EventProductMap, { eventId: id });
        for (const productId of dto.products) {
          const product = await manager.findOne(Product, { id: productId });
          const map = new EventProductMap();
          map.eventId = newEvent.id;
          map.event = newEvent;
          map.productId = product.id;
          map.product = product;
          await manager.save(EventProductMap, map);
        }
      }
      await queryRunner.commitTransaction();
      return newEvent;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      //todo
      const errorInfo = new ErrorInfo('NE002', 'NEI0006', '이벤트 수정에 오류가 발생하였습니다.', e)
      throw new InternalServerErrorException(errorInfo);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteOne(id: number): Promise<any> {
    return await this.eventRepository.delete(id);
  }
}
