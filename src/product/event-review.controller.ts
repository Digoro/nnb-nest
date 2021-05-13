import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { EventReview } from 'src/product/model/product.entity';
import { ErrorInfo } from 'src/shared/model/error-info';
import { EventReviewService } from './event-review.service';
import { EventReviewCreateDto, EventReviewSearchDto, EventReviewUpdateDto } from './model/product.dto';
import { UserIsEventReviewAuthorGuard } from './user-is-event-review-author-guard';

@ApiTags('reviews')
@Controller('api/reviews/events')
export class EventReviewController {
  constructor(private readonly eventReviewService: EventReviewService) { }

  @UseGuards(AuthGuard('jwt'))
  @Post('')
  createReview(@Body() review: EventReviewCreateDto, @Request() request): Promise<EventReview> {
    const userId = request.user.id;
    return this.eventReviewService.create(userId, review);
  }

  @Get('')
  indexReview(@Query() search: EventReviewSearchDto): any {
    let limit = +search.limit;
    limit = limit > 100 ? 100 : limit;
    return this.eventReviewService.paginate(search);
  }

  @Get(':id')
  async findReviewOne(@Param('id') id: number) {
    const review = await this.eventReviewService.findOne(id);
    //todo
    if (!review) throw new NotFoundException(new ErrorInfo('NE001', 'NEI0007', '존재하지 않습니다.'))
    return review;
  }

  @UseGuards(AuthGuard('jwt'), UserIsEventReviewAuthorGuard)
  @Put(':id')
  updateReview(@Param('id') id: number, @Body() review: EventReviewUpdateDto) {
    return this.eventReviewService.update(id, review);
  }

  @UseGuards(AuthGuard('jwt'), UserIsEventReviewAuthorGuard)
  @Delete(':id')
  removeReview(@Param('id') id: number) {
    return this.eventReviewService.delete(id);
  }
}
