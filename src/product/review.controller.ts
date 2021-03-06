import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guard/roles-guard';
import { UserIsPaymentOwnerGuard } from 'src/payment/guard/user-is-payment-owner.guard';
import { HostIsProductHostGuard } from 'src/product/host-is-product-host-guard';
import { Role } from 'src/user/model/user.interface';
import { ReviewCreateDto, ReviewSearchDto, ReviewUpdateDto } from './model/review.dto';
import { Review } from './model/review.entity';
import { ReviewService } from './review.service';

@ApiTags('reviews')
@Controller('api/reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) { }

  @UseGuards(AuthGuard('jwt'), UserIsPaymentOwnerGuard)
  @Post('/by/user')
  createByUser(@Body() review: ReviewCreateDto, @Request() request): Promise<Review> {
    const userId = request.user.id;
    return this.reviewService.create(userId, review);
  }

  @UseGuards(AuthGuard('jwt'), HostIsProductHostGuard)
  @Post('/by/host')
  createByHost(@Body() review: ReviewCreateDto, @Request() request): Promise<Review> {
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
  @Get('/by/host')
  searchByHost(@Query() search: ReviewSearchDto, @Request() request): any {
    let limit = +search.limit;
    limit = limit > 100 ? 100 : limit;
    const userId = request.user.id;
    return this.reviewService.paginateByHost(search, userId);
  }

  @Get('/by/user/:userId')
  searchByUser(@Query() search: ReviewSearchDto, @Param('userId') userId: number): any {
    let limit = +search.limit;
    limit = limit > 100 ? 100 : limit;
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

  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('request')
  async requestReview(@Body() body: any) {
    return this.reviewService.requestReview(body.paymentId)
  }
}
