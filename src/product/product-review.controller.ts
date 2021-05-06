import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { ProductReview } from 'src/product/model/product.entity';
import { ErrorInfo } from 'src/shared/model/error-info';
import { ProductReviewCreateDto, ProductReviewSearchDto, ProductReviewUpdateDto } from './model/product.dto';
import { ProductReviewService } from './product-review.service';
import { UserIsProductReviewAuthorGuard } from './user-is-product-review-author-guard';

@ApiTags('reviews')
@Controller('api/reviews/products')
export class ProductReviewController {
  constructor(private readonly productReviewService: ProductReviewService) { }

  @UseGuards(AuthGuard('jwt'))
  @Post('')
  createReview(@Body() review: ProductReviewCreateDto, @Request() request): Promise<ProductReview> {
    const userId = request.user.id;
    return this.productReviewService.create(userId, review);
  }

  @Get('')
  indexReview(@Query() search: ProductReviewSearchDto): any {
    let limit = +search.limit;
    limit = limit > 100 ? 100 : limit;
    return this.productReviewService.paginate(search);
  }

  @Get(':id')
  async findReviewOne(@Param('id') id: number) {
    const review = await this.productReviewService.findOne(id);
    if (!review) throw new NotFoundException(new ErrorInfo('NE001', 'NEI0007', '존재하지 않습니다.'))
    return review;
  }

  @UseGuards(AuthGuard('jwt'), UserIsProductReviewAuthorGuard)
  @Put(':id')
  updateReview(@Param('id') id: number, @Body() review: ProductReviewUpdateDto) {
    return this.productReviewService.update(id, review);
  }

  @UseGuards(AuthGuard('jwt'), UserIsProductReviewAuthorGuard)
  @Delete(':id')
  removeReview(@Param('id') id: number) {
    return this.productReviewService.delete(id);
  }
}
