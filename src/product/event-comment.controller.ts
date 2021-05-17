import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { EventComment } from 'src/product/model/product.entity';
import { ErrorInfo } from 'src/shared/model/error-info';
import { EventCommentService } from './event-comment.service';
import { EventCommentCreateDto, EventCommentSearchDto, EventCommentUpdateDto } from './model/product.dto';
import { UserIsEventCommentAuthorGuard } from './user-is-event-comment-author-guard';

@ApiTags('reviews')
@Controller('api/reviews/events')
export class EventCommentController {
  constructor(private readonly eventCommentService: EventCommentService) { }

  @UseGuards(AuthGuard('jwt'))
  @Post('')
  createReview(@Body() review: EventCommentCreateDto, @Request() request): Promise<EventComment> {
    const userId = request.user.id;
    return this.eventCommentService.create(userId, review);
  }

  @Get('')
  indexReview(@Query() search: EventCommentSearchDto): any {
    let limit = +search.limit;
    limit = limit > 100 ? 100 : limit;
    return this.eventCommentService.paginate(search);
  }

  @Get(':id')
  async findReviewOne(@Param('id') id: number) {
    const review = await this.eventCommentService.findOne(id);
    //todo
    if (!review) throw new NotFoundException(new ErrorInfo('NE001', 'NEI0007', '존재하지 않습니다.'))
    return review;
  }

  @UseGuards(AuthGuard('jwt'), UserIsEventCommentAuthorGuard)
  @Put(':id')
  updateReview(@Param('id') id: number, @Body() review: EventCommentUpdateDto) {
    return this.eventCommentService.update(id, review);
  }

  @UseGuards(AuthGuard('jwt'), UserIsEventCommentAuthorGuard)
  @Delete(':id')
  removeReview(@Param('id') id: number) {
    return this.eventCommentService.delete(id);
  }
}
