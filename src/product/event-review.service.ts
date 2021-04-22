import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { AuthService } from 'src/auth/service/auth.service';
import { EventReview } from 'src/product/model/product.entity';
import { PaginationWithChildren } from 'src/shared/model/pagination';
import { Repository } from 'typeorm';
import { EventService } from './event.service';
import { EventReviewCreateDto, EventReviewSearchDto, EventReviewUpdateDto } from './model/product.dto';

@Injectable()
export class EventReviewService {
  eventReviewRelations = ['user', 'event'];

  constructor(
    private authService: AuthService,
    private eventService: EventService,
    @InjectRepository(EventReview) private eventReviewRepository: Repository<EventReview>
  ) { }

  async create(userId: number, reviewDto: EventReviewCreateDto): Promise<EventReview> {
    const user = await this.authService.findById(userId);
    const event = await this.eventService.findById(reviewDto.eventId);
    const parent = reviewDto.parentId ? await this.findOne(reviewDto.parentId) : undefined;
    const review = reviewDto.toEntity(user, event, parent);
    const newReview = await this.eventReviewRepository.save(review);
    return newReview;
  }

  async paginate(search: EventReviewSearchDto): Promise<PaginationWithChildren<EventReview>> {
    const options = { page: search.page, limit: search.limit }
    delete search.page;
    delete search.limit;

    const result = await paginate<EventReview>(this.eventReviewRepository, options, {
      where: [{ ...search, parent: null }],
      relations: this.eventReviewRelations,
      order: { createdAt: 'DESC' }
    })
    const items = result.items;
    for (const parent of items) {
      const children = await this.eventReviewRepository.find({ where: [{ parent: parent.id }], relations: ['user', 'parent'] });
      if (children.length > 0) items.push(...children)
    }
    const count = await this.eventReviewRepository.count({ where: [search] });
    return {
      items: items,
      meta: { ...result.meta, totalItemsWithChildren: count }
    };
  }

  async findOne(id: number): Promise<EventReview> {
    return await this.eventReviewRepository.findOne({ id }, { relations: this.eventReviewRelations });
  }

  async update(id: number, reviewDto: EventReviewUpdateDto): Promise<any> {
    const review = await this.findOne(id);
    return await this.eventReviewRepository.save(Object.assign(review, reviewDto))
  }

  async delete(id: number): Promise<any> {
    const review = await this.eventReviewRepository.findOne({ id }, { relations: ['children'] });
    if (review.children.length > 0) {
      const dto = new EventReviewUpdateDto();
      dto.comment = '삭제된 댓글입니다.';
      return await this.update(id, dto);
    } else {
      return await this.eventReviewRepository.delete(id);
    }
  }
}
