import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { AuthService } from 'src/auth/service/auth.service';
import { EventComment } from 'src/product/model/product.entity';
import { PaginationWithChildren } from 'src/shared/model/pagination';
import { Repository } from 'typeorm';
import { EventService } from './event.service';
import { EventCommentCreateDto, EventCommentSearchDto, EventCommentUpdateDto } from './model/product.dto';

@Injectable()
export class EventCommentService {
  eventCommentRelations = ['user', 'event'];

  constructor(
    private authService: AuthService,
    private eventService: EventService,
    @InjectRepository(EventComment) private eventCommentRepository: Repository<EventComment>
  ) { }

  async create(userId: number, reviewDto: EventCommentCreateDto): Promise<EventComment> {
    const user = await this.authService.findById(userId);
    const event = await this.eventService.findById(reviewDto.eventId);
    const parent = reviewDto.parentId ? await this.findOne(reviewDto.parentId) : undefined;
    const review = reviewDto.toEntity(user, event, parent);
    const newReview = await this.eventCommentRepository.save(review);
    return newReview;
  }

  async paginate(search: EventCommentSearchDto): Promise<PaginationWithChildren<EventComment>> {
    const options = { page: search.page, limit: search.limit }
    delete search.page;
    delete search.limit;

    const result = await paginate<EventComment>(this.eventCommentRepository, options, {
      where: [{ ...search, parent: null }],
      relations: this.eventCommentRelations,
      order: { createdAt: 'DESC' }
    })
    const items = result.items;
    for (const parent of items) {
      const children = await this.eventCommentRepository.find({ where: [{ parent: parent.id }], relations: ['user', 'parent'] });
      if (children.length > 0) items.push(...children)
    }
    const count = await this.eventCommentRepository.count({ where: [search] });
    return {
      items: items,
      meta: { ...result.meta, totalItemsWithChildren: count }
    };
  }

  async findOne(id: number): Promise<EventComment> {
    return await this.eventCommentRepository.findOne({ id }, { relations: this.eventCommentRelations });
  }

  async update(id: number, reviewDto: EventCommentUpdateDto): Promise<any> {
    const review = await this.findOne(id);
    return await this.eventCommentRepository.save(Object.assign(review, reviewDto))
  }

  async delete(id: number): Promise<any> {
    const review = await this.eventCommentRepository.findOne({ id }, { relations: ['children'] });
    if (review.children.length > 0) {
      const dto = new EventCommentUpdateDto();
      dto.comment = '삭제된 댓글입니다.';
      return await this.update(id, dto);
    } else {
      return await this.eventCommentRepository.delete(id);
    }
  }
}
