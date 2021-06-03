import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { UserIsPaymentOwnerGuard } from 'src/payment/guard/user-is-payment-owner.guard';
import { ReviewCreateDto, ReviewSearchDto, ReviewUpdateDto } from './model/review.dto';
import { Review } from './model/review.entity';
import { ReviewService } from './review.service';

@ApiTags('reviews')
@Controller('api/reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) { }

  @UseGuards(AuthGuard('jwt'), UserIsPaymentOwnerGuard)
  @Post('')
  create(@Body() review: ReviewCreateDto, @Request() request): Promise<Review> {
    const userId = request.user.id;
    return this.reviewService.create(userId, review);
  }

  @Get('')
  search(@Query() search: ReviewSearchDto): any {
    let limit = +search.limit;
    limit = limit > 100 ? 100 : limit;
    return this.reviewService.paginate(search);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/by/host/:hostId')
  searchByHost(@Query() search: ReviewSearchDto, @Request() request, @Param('hostId') hostId: number): any {
    let limit = +search.limit;
    limit = limit > 100 ? 100 : limit;
    const userId = hostId ? hostId : request.user.id;
    return this.reviewService.paginateByHost(search, userId);
  }

  @Get('/best/productId/:productId')
  async getBestByProduct(@Param('productId') productId: number) {
    const review = await this.reviewService.getBestByProduct(productId);
    return review;
  }

  @Get(':paymentId')
  async findOneByPayment(@Param('paymentId') paymentId: number) {
    const review = await this.reviewService.findOneByPayment(paymentId);
    return review;
  }

  @UseGuards(AuthGuard('jwt'), UserIsPaymentOwnerGuard)
  @Put(':id')
  update(@Param('id') id: number, @Body() review: ReviewUpdateDto) {
    return this.reviewService.update(id, review);
  }

  @UseGuards(AuthGuard('jwt'), UserIsPaymentOwnerGuard)
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.reviewService.delete(id);
  }
}
